import type { SQLiteDatabase } from "expo-sqlite";
import type { RecurringTransaction, MoneyFlow, RecurringFrequency, Rupiah } from "@/types/finance";
import { createLocalId } from "@/lib/id";
import { isIsoDate } from "@/lib/forms";
import { assertChanged } from "./account-repository";

export type RecurringTransactionRow = {
  id: string;
  title: string;
  merchant: string;
  category: string;
  amount: Rupiah;
  flow: MoneyFlow;
  account_id: string;
  frequency: RecurringFrequency;
  next_date: string;
};

export type SaveRecurringTransactionInput = Omit<RecurringTransaction, "id"> & {
  id?: string;
};

export function mapRecurringTransaction(row: RecurringTransactionRow): RecurringTransaction {
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

export async function processRecurringTransactions(db: SQLiteDatabase) {
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
      let iterations = 0;
      
      // Process it multiple times if it's way past due (capped at 90 to prevent infinite loop/freezes)
      while (currentDate <= todayDate && iterations < 90) {
        iterations++;
        const dateStr = currentDate.toISOString().slice(0, 10);
        const balanceDelta = rtx.flow === "income" ? rtx.amount : -rtx.amount;

        try {
          // 1. Try to apply balance changes first to ensure we have enough funds
          // We don't use applyAccountDelta directly because it throws, which would abort the transaction
          const row = await tx.getFirstAsync<{balance: number}>("SELECT balance FROM accounts WHERE id = ?", rtx.account_id);
          if (!row) throw new Error("Account not found");
          if (row.balance + balanceDelta < 0) {
             // Insufficient funds for this recurring expense. Stop processing this transaction series for now.
             break;
          }
          await tx.runAsync(
            "UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            balanceDelta,
            rtx.account_id
          );

          // 2. Insert actual transaction
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
        } catch (e) {
          // If something fails (e.g., account deleted), skip this transaction series
          break;
        }

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
