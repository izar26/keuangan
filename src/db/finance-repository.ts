import type { SQLiteDatabase, SQLiteRunResult } from "expo-sqlite";

import type { Account, Budget, Goal, Insight, Profile, ProfileSettings, Transaction, RecurringTransaction, RecurringFrequency } from "@/types/finance";
import { createLocalId } from "@/lib/id";
import { getMonthKey, isIsoDate } from "@/lib/forms";

export type MonthlySpendingPoint = {
  amount: number;
  month: string;
};

export type FinanceSnapshot = {
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  insights: Insight[];
  monthlySpending: MonthlySpendingPoint[];
  profile: Profile;
  settings: ProfileSettings;
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
};

export type SaveAccountInput = Omit<Account, "id"> & {
  id?: string;
};

export type SaveBudgetInput = Omit<Budget, "id" | "spent"> & {
  id?: string;
  spent?: number;
};

export type SaveGoalInput = Omit<Goal, "id"> & {
  id?: string;
};

export type SaveTransactionInput = Omit<Transaction, "id"> & {
  id?: string;
};

export type SaveRecurringTransactionInput = Omit<RecurringTransaction, "id"> & {
  id?: string;
};

export type TransferInput = {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
};

export type SaveProfileInput = Profile;

export type SaveSettingsInput = Partial<ProfileSettings>;

type AccountRow = {
  accent: Account["accent"];
  balance: number;
  id: string;
  institution: string;
  mask: string;
  name: string;
};

type TransactionRow = {
  account_id: string;
  amount: number;
  category: string;
  date: string;
  flow: Transaction["flow"];
  id: string;
  merchant: string;
  title: string;
};

type RecurringTransactionRow = {
  account_id: string;
  amount: number;
  category: string;
  flow: Transaction["flow"];
  frequency: RecurringFrequency;
  id: string;
  merchant: string;
  next_date: string;
  title: string;
};

type BudgetRow = {
  accent: Budget["accent"];
  category: string;
  id: string;
  limit_amount: number;
  name: string;
  spent_amount: number;
};

type GoalRow = {
  due_date: string;
  id: string;
  name: string;
  saved_amount: number;
  target_amount: number;
};

type ProfileRow = {
  display_name: string;
  plan_label: string;
};

type SettingRow = {
  key: string;
  value: string;
};

type BalanceRow = {
  balance: number;
};

type SortOrderRow = {
  sort_order: number;
};

export async function getFinanceSnapshot(db: SQLiteDatabase, monthKey?: string): Promise<FinanceSnapshot> {
  // First process any due recurring transactions
  await processRecurringTransactions(db);

  const [accountRows, transactionRows, budgetRows, goalRows, profileRow, settingRows, recurringRows] = await Promise.all([
    db.getAllAsync<AccountRow>("SELECT id, name, institution, balance, accent, mask FROM accounts ORDER BY created_at ASC"),
    db.getAllAsync<TransactionRow>(
      "SELECT id, title, merchant, category, amount, flow, account_id, date FROM transactions ORDER BY date DESC, created_at DESC",
    ),
    db.getAllAsync<BudgetRow>(
      "SELECT id, name, category, limit_amount, spent_amount, accent FROM budgets ORDER BY created_at ASC",
    ),
    db.getAllAsync<GoalRow>("SELECT id, name, target_amount, saved_amount, due_date FROM goals ORDER BY due_date ASC"),
    db.getFirstAsync<ProfileRow>("SELECT display_name, plan_label FROM profile WHERE id = 1"),
    db.getAllAsync<SettingRow>("SELECT key, value FROM settings"),
    db.getAllAsync<RecurringTransactionRow>("SELECT id, title, merchant, category, amount, flow, account_id, frequency, next_date FROM recurring_transactions ORDER BY next_date ASC"),
  ]);

  return {
    accounts: accountRows.map(mapAccount),
    budgets: budgetRows.map((budget) => mapBudget(budget, transactionRows, monthKey)),
    goals: goalRows.map(mapGoal),
    insights: generateAutoInsights(transactionRows, monthKey),
    monthlySpending: calculateMonthlySpending(transactionRows),
    profile: profileRow ? mapProfile(profileRow) : { displayName: "Izar Finance", planLabel: "Local finance workspace" },
    settings: mapSettings(settingRows),
    transactions: transactionRows.map(mapTransaction),
    recurringTransactions: recurringRows.map(mapRecurringTransaction),
  };
}

function calculateMonthlySpending(transactions: TransactionRow[]): MonthlySpendingPoint[] {
  const map = new Map<string, number>();
  
  for (const trx of transactions) {
    if (trx.flow === "expense") {
      const trxMonth = trx.date.slice(0, 7); // YYYY-MM
      map.set(trxMonth, (map.get(trxMonth) ?? 0) + trx.amount);
    }
  }
  
  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Only keep the last 6 months
}

function generateAutoInsights(transactions: TransactionRow[], currentMonthKey?: string): Insight[] {
  const insights: Insight[] = [];
  const monthKey = currentMonthKey ?? getMonthKey();
  
  // 1. Top Spending Category
  const categoryMap = new Map<string, number>();
  let currentMonthExpense = 0;
  let previousMonthExpense = 0;
  
  // Hitung bulan lalu
  const [yearStr, monthStr] = monthKey.split("-");
  let prevMonth = parseInt(monthStr, 10) - 1;
  let prevYear = parseInt(yearStr, 10);
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;

  for (const trx of transactions) {
    if (trx.flow === "expense") {
      if (trx.date.startsWith(monthKey)) {
        categoryMap.set(trx.category, (categoryMap.get(trx.category) ?? 0) + trx.amount);
        currentMonthExpense += trx.amount;
      } else if (trx.date.startsWith(prevMonthKey)) {
        previousMonthExpense += trx.amount;
      }
    }
  }
  
  if (categoryMap.size > 0) {
    let topCategory = "";
    let topAmount = 0;
    for (const [cat, amt] of categoryMap.entries()) {
      if (amt > topAmount) {
        topCategory = cat;
        topAmount = amt;
      }
    }
    
    if (topCategory && topAmount > 0) {
      insights.push({
        id: "insight-top-category",
        title: "Pengeluaran terbesar",
        value: topCategory,
        trend: "flat",
        caption: `Sebesar Rp ${(topAmount / 1000).toLocaleString("id-ID")}rb bulan ini`,
      });
    }
  }

  // 2. Spending Trend (Vs Last Month)
  if (previousMonthExpense > 0 && currentMonthExpense > 0) {
    const diff = currentMonthExpense - previousMonthExpense;
    const percentage = Math.round(Math.abs(diff) / previousMonthExpense * 100);
    
    if (diff > 0) {
      insights.push({
        id: "insight-trend",
        title: "Trend pengeluaran",
        value: `Naik ${percentage}%`,
        trend: "up",
        caption: `Dibandingkan pengeluaran bulan lalu`,
      });
    } else if (diff < 0) {
      insights.push({
        id: "insight-trend",
        title: "Trend pengeluaran",
        value: `Turun ${percentage}%`,
        trend: "down",
        caption: `Lebih hemat dari bulan lalu!`,
      });
    }
  }

  // 3. Transaction Count Streak
  const count = transactions.filter((t) => t.date.startsWith(monthKey)).length;
  if (count > 0) {
    insights.push({
      id: "insight-count",
      title: "Aktivitas mencatat",
      value: `${count} kali`,
      trend: "up",
      caption: "Rajin catat transaksi bulan ini!",
    });
  }

  const previousCategoryMap = new Map<string, number>();
  for (const trx of transactions) {
    if (trx.flow !== "expense") {
      continue;
    }

    if (trx.date.startsWith(prevMonthKey)) {
      previousCategoryMap.set(trx.category, (previousCategoryMap.get(trx.category) ?? 0) + trx.amount);
    }
  }

  for (const [category, amount] of categoryMap.entries()) {
    const previousAmount = previousCategoryMap.get(category) ?? 0;
    if (previousAmount > 0 && amount > previousAmount * 1.25) {
      const percentage = Math.round(((amount - previousAmount) / previousAmount) * 100);
      insights.push({
        id: `insight-category-${category.toLowerCase().replace(/\s+/g, "-")}`,
        title: `${category} lagi naik`,
        value: `Naik ${percentage}%`,
        trend: "up",
        caption: `Kategori ini lebih tinggi dari bulan lalu. Cocok buat dipantau sebelum akhir bulan.`,
      });
      break;
    }
  }

  const paydayWindowExpense = transactions
    .filter((trx) => trx.flow === "expense" && trx.date.startsWith(monthKey))
    .filter((trx) => {
      const day = Number(trx.date.slice(8, 10));
      return day >= 25 && day <= 28;
    })
    .reduce((sum, trx) => sum + trx.amount, 0);

  if (paydayWindowExpense > 0) {
    insights.push({
      id: "insight-payday-window",
      title: "Rawan boros akhir bulan",
      value: `Rp ${(paydayWindowExpense / 1000).toLocaleString("id-ID")}rb`,
      trend: "flat",
      caption: "Tanggal 25-28 punya pengeluaran aktif. Set reminder kecil sebelum payday.",
    });
  }

  return insights;
}

export async function saveProfile(db: SQLiteDatabase, input: SaveProfileInput) {
  await db.runAsync(
    `INSERT INTO profile (id, display_name, plan_label)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       plan_label = excluded.plan_label,
       updated_at = CURRENT_TIMESTAMP`,
    input.displayName,
    input.planLabel,
  );
}

export async function saveSettings(db: SQLiteDatabase, input: SaveSettingsInput) {
  if (input.budgetNotification !== undefined && !isBudgetNotification(input.budgetNotification)) {
    throw new Error("Siklus notifikasi budget tidak valid.");
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    if (input.securityLock !== undefined) {
      await upsertSetting(tx, "security_lock", String(input.securityLock));
    }

    if (input.budgetNotification !== undefined) {
      await upsertSetting(tx, "budget_notification", input.budgetNotification);
    }

    if (input.localPrivacyMode !== undefined) {
      await upsertSetting(tx, "local_privacy_mode", String(input.localPrivacyMode));
    }
  });
}


export async function saveAccount(db: SQLiteDatabase, input: SaveAccountInput) {
  const id = input.id ?? createLocalId("acc");

  if (!input.name.trim() || !input.institution.trim() || !input.mask.trim()) {
    throw new Error("Nama, institusi, dan nomor rekening wajib diisi.");
  }

  if (!input.id && input.balance < 0) {
    throw new Error("Saldo awal tidak boleh negatif.");
  }

  if (input.id) {
    const result = await db.runAsync(
      `UPDATE accounts
       SET name = ?,
         institution = ?,
         accent = ?,
         mask = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      input.name,
      input.institution,
      input.accent,
      input.mask,
      id,
    );
    assertChanged(result, "Rekening tidak ditemukan.");
  } else {
    await db.runAsync(
      "INSERT INTO accounts (id, name, institution, balance, accent, mask) VALUES (?, ?, ?, ?, ?, ?)",
      id,
      input.name,
      input.institution,
      input.balance,
      input.accent,
      input.mask,
    );
  }

  return id;
}

export async function deleteAccount(db: SQLiteDatabase, id: string) {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM transactions WHERE account_id = ?",
    id,
  );

  if ((row?.count ?? 0) > 0) {
    throw new Error("Rekening masih dipakai transaksi dan tidak bisa dihapus.");
  }

  const result = await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
  assertChanged(result, "Rekening tidak ditemukan.");
}

export async function saveBudget(db: SQLiteDatabase, input: SaveBudgetInput) {
  const id = input.id ?? createLocalId("bud");

  if (!input.name.trim() || !input.category.trim() || input.limit <= 0) {
    throw new Error("Nama, kategori, dan limit budget wajib diisi.");
  }

  await db.runAsync(
    `INSERT INTO budgets (id, name, category, limit_amount, spent_amount, accent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       category = excluded.category,
       limit_amount = excluded.limit_amount,
       spent_amount = excluded.spent_amount,
       accent = excluded.accent,
       updated_at = CURRENT_TIMESTAMP`,
    id,
    input.name,
    input.category,
    input.limit,
    input.spent ?? 0,
    input.accent,
  );

  return id;
}

export async function deleteBudget(db: SQLiteDatabase, id: string) {
  const result = await db.runAsync("DELETE FROM budgets WHERE id = ?", id);
  assertChanged(result, "Budget tidak ditemukan.");
}

export async function saveGoal(db: SQLiteDatabase, input: SaveGoalInput) {
  const id = input.id ?? createLocalId("goal");

  if (!input.name.trim() || input.target <= 0) {
    throw new Error("Nama dan target tujuan wajib diisi.");
  }

  if (!isIsoDate(input.dueDate)) {
    throw new Error("Tanggal target wajib valid.");
  }

  if (input.saved < 0 || input.saved > input.target) {
    throw new Error("Nominal terkumpul harus berada di antara 0 dan target.");
  }

  await db.runAsync(
    `INSERT INTO goals (id, name, target_amount, saved_amount, due_date)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       target_amount = excluded.target_amount,
       saved_amount = excluded.saved_amount,
       due_date = excluded.due_date,
       updated_at = CURRENT_TIMESTAMP`,
    id,
    input.name,
    input.target,
    input.saved,
    input.dueDate,
  );

  return id;
}

export async function deleteGoal(db: SQLiteDatabase, id: string) {
  const result = await db.runAsync("DELETE FROM goals WHERE id = ?", id);
  assertChanged(result, "Tujuan tidak ditemukan.");
}

export async function saveTransaction(db: SQLiteDatabase, input: SaveTransactionInput) {
  const id = input.id ?? createLocalId("trx");

  if (!input.title.trim() || !input.merchant.trim() || !input.category.trim() || input.amount <= 0 || !input.accountId) {
    throw new Error("Judul, merchant, kategori, nominal, dan rekening wajib valid.");
  }

  if (!isIsoDate(input.date)) {
    throw new Error("Tanggal transaksi wajib valid.");
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    const existing = await tx.getFirstAsync<TransactionRow>(
      "SELECT id, title, merchant, category, amount, flow, account_id, date FROM transactions WHERE id = ?",
      id,
    );

    if (existing) {
      await applyAccountDelta(tx, existing.account_id, existing.flow === "income" ? -existing.amount : existing.amount);
    }

    await tx.runAsync(
      `INSERT INTO transactions (id, title, merchant, category, amount, flow, account_id, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         merchant = excluded.merchant,
         category = excluded.category,
         amount = excluded.amount,
         flow = excluded.flow,
         account_id = excluded.account_id,
         date = excluded.date,
         updated_at = CURRENT_TIMESTAMP`,
      id,
      input.title,
      input.merchant,
      input.category,
      input.amount,
      input.flow,
      input.accountId,
      input.date,
    );

    await applyAccountDelta(tx, input.accountId, input.flow === "income" ? input.amount : -input.amount);
  });

  return id;
}

export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const existing = await tx.getFirstAsync<TransactionRow>(
      "SELECT id, title, merchant, category, amount, flow, account_id, date FROM transactions WHERE id = ?",
      id,
    );

    if (!existing) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    const result = await tx.runAsync("DELETE FROM transactions WHERE id = ?", id);
    assertChanged(result, "Transaksi tidak ditemukan.");
    await applyAccountDelta(tx, existing.account_id, existing.flow === "income" ? -existing.amount : existing.amount);
  });
}

export async function transferBetweenAccounts(db: SQLiteDatabase, input: TransferInput) {
  if (input.fromAccountId === input.toAccountId) {
    throw new Error("Rekening sumber dan tujuan harus berbeda.");
  }

  if (input.amount <= 0) {
    throw new Error("Nominal transfer harus lebih dari 0.");
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    await applyAccountDelta(tx, input.fromAccountId, -input.amount);
    await applyAccountDelta(tx, input.toAccountId, input.amount);
  });
}

export async function saveRecurringTransaction(db: SQLiteDatabase, input: SaveRecurringTransactionInput) {
  const id = input.id ?? createLocalId("rtx");

  if (!input.title.trim() || !input.merchant.trim() || !input.category.trim() || input.amount <= 0 || !input.accountId) {
    throw new Error("Judul, merchant, kategori, nominal, dan rekening wajib valid.");
  }

  if (!isIsoDate(input.nextDate)) {
    throw new Error("Tanggal berikutnya wajib valid.");
  }

  await db.runAsync(
    `INSERT INTO recurring_transactions (id, title, merchant, category, amount, flow, account_id, frequency, next_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       merchant = excluded.merchant,
       category = excluded.category,
       amount = excluded.amount,
       flow = excluded.flow,
       account_id = excluded.account_id,
       frequency = excluded.frequency,
       next_date = excluded.next_date,
       updated_at = CURRENT_TIMESTAMP`,
    id,
    input.title,
    input.merchant,
    input.category,
    input.amount,
    input.flow,
    input.accountId,
    input.frequency,
    input.nextDate,
  );

  return id;
}

export async function deleteRecurringTransaction(db: SQLiteDatabase, id: string) {
  const result = await db.runAsync("DELETE FROM recurring_transactions WHERE id = ?", id);
  assertChanged(result, "Transaksi berulang tidak ditemukan.");
}

async function processRecurringTransactions(db: SQLiteDatabase) {
  const today = new Date().toISOString().slice(0, 10);
  
  const dueTransactions = await db.getAllAsync<RecurringTransactionRow>(
    "SELECT * FROM recurring_transactions WHERE next_date <= ?",
    today
  );

  if (dueTransactions.length === 0) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const rtx of dueTransactions) {
      let currentDate = new Date(rtx.next_date);
      const todayDate = new Date(today);
      
      // Process it multiple times if it's way past due
      while (currentDate <= todayDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        
        // 1. Insert actual transaction
        await tx.runAsync(
          `INSERT INTO transactions (id, title, merchant, category, amount, flow, account_id, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          createLocalId("trx"),
          rtx.title,
          rtx.merchant,
          rtx.category,
          rtx.amount,
          rtx.flow,
          rtx.account_id,
          dateStr
        );
        
        // 2. Apply balance changes
        const balanceDelta = rtx.flow === "income" ? rtx.amount : -rtx.amount;
        // Ignore error if account balance becomes negative for auto-transaction, 
        // to prevent blocking loop, but normally we'd assert. We'll just update directly.
        await tx.runAsync(
          "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          balanceDelta,
          rtx.account_id
        );

        // 3. Increment current date based on frequency
        if (rtx.frequency === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (rtx.frequency === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rtx.frequency === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (rtx.frequency === "yearly") {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      }

      // Update next_date
      await tx.runAsync(
        "UPDATE recurring_transactions SET next_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        currentDate.toISOString().slice(0, 10),
        rtx.id
      );
    }
  });
}

async function applyAccountDelta(db: SQLiteDatabase, accountId: string, delta: number) {
  const row = await db.getFirstAsync<BalanceRow>("SELECT balance FROM accounts WHERE id = ?", accountId);

  if (!row) {
    throw new Error("Rekening tidak ditemukan.");
  }

  if (row.balance + delta < 0) {
    throw new Error("Saldo rekening tidak mencukupi.");
  }

  const result = await db.runAsync(
    "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    delta,
    accountId,
  );
  assertChanged(result, "Rekening tidak ditemukan.");
}

function assertChanged(result: SQLiteRunResult, message: string) {
  if (result.changes < 1) {
    throw new Error(message);
  }
}

async function upsertSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`,
    key,
    value,
  );
}

function mapAccount(row: AccountRow): Account {
  return {
    accent: row.accent,
    balance: row.balance,
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    name: row.name,
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    accountId: row.account_id,
    amount: row.amount,
    category: row.category,
    date: row.date,
    flow: row.flow,
    id: row.id,
    merchant: row.merchant,
    title: row.title,
  };
}

function mapRecurringTransaction(row: RecurringTransactionRow): RecurringTransaction {
  return {
    accountId: row.account_id,
    amount: row.amount,
    category: row.category,
    flow: row.flow,
    frequency: row.frequency,
    id: row.id,
    merchant: row.merchant,
    nextDate: row.next_date,
    title: row.title,
  };
}

function mapBudget(row: BudgetRow, transactions: TransactionRow[], monthKey?: string): Budget {
  const resolvedMonthKey = monthKey ?? getMonthKey();
  const category = row.category.trim();
  const spent = category
    ? transactions
        .filter((transaction) => {
          return (
            transaction.flow === "expense" &&
            transaction.category.toLowerCase() === category.toLowerCase() &&
            transaction.date.startsWith(resolvedMonthKey)
          );
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    : row.spent_amount;

  return {
    accent: row.accent,
    category,
    id: row.id,
    limit: row.limit_amount,
    name: row.name,
    spent,
  };
}

function mapGoal(row: GoalRow): Goal {
  return {
    dueDate: row.due_date,
    id: row.id,
    name: row.name,
    saved: row.saved_amount,
    target: row.target_amount,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    planLabel: row.plan_label,
  };
}

function mapSettings(rows: SettingRow[]): ProfileSettings {
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    budgetNotification: parseBudgetNotification(map.get("budget_notification")),
    localPrivacyMode: map.get("local_privacy_mode") !== "false",
    securityLock: map.get("security_lock") !== "false",
  };
}

function parseBudgetNotification(value: string | undefined): ProfileSettings["budgetNotification"] {
  if (isBudgetNotification(value)) {
    return value;
  }

  return "daily";
}

function isBudgetNotification(value: string | undefined): value is ProfileSettings["budgetNotification"] {
  return value === "daily" || value === "off" || value === "weekly";
}
