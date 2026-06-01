import type { SQLiteDatabase } from "expo-sqlite";

import type { Account, Budget, Goal, Insight, Profile, ProfileSettings, Transaction, RecurringTransaction, RecurringFrequency, Rupiah } from "@/types/finance";
import { getMonthKey } from "@/lib/forms";

import { AccountRow, mapAccount } from "./account-repository";
import { TransactionRow, mapTransaction } from "./transaction-repository";
import { BudgetRow, mapBudget } from "./budget-repository";
import { GoalRow, mapGoal } from "./goal-repository";
import { ProfileRow, SettingRow, mapProfile, mapSettings } from "./profile-repository";
import { RecurringTransactionRow, mapRecurringTransaction } from "./recurring-repository";
import { generateAutoInsights, calculateMonthlySpending, MonthlySpendingPoint } from "./insights";

export * from "./account-repository";
export * from "./transaction-repository";
export * from "./budget-repository";
export * from "./goal-repository";
export * from "./recurring-repository";
export * from "./profile-repository";
export * from "./transfer-repository";
export * from "./insights";

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

export async function getFinanceSnapshot(db: SQLiteDatabase, monthKey?: string): Promise<FinanceSnapshot> {
  const [accountRows, transactionRows, budgetRows, goalRows, profileRow, settingRows, recurringRows] = await Promise.all([
    db.getAllAsync<AccountRow>("SELECT id, name, institution, balance, accent, mask FROM accounts ORDER BY created_at ASC"),
    db.getAllAsync<TransactionRow>(
      "SELECT id, title, merchant, category, amount, flow, account_id, date FROM transactions ORDER BY date DESC, created_at DESC",
    ),
    db.getAllAsync<BudgetRow>("SELECT id, name, category, limit_amount, spent_amount, accent FROM budgets ORDER BY created_at ASC"),
    db.getAllAsync<GoalRow>("SELECT id, name, target_amount, saved_amount, due_date FROM goals ORDER BY created_at ASC"),
    db.getFirstAsync<ProfileRow>("SELECT display_name, plan_label FROM profile WHERE id = 1"),
    db.getAllAsync<SettingRow>("SELECT key, value FROM settings"),
    db.getAllAsync<RecurringTransactionRow>("SELECT * FROM recurring_transactions ORDER BY next_date ASC, created_at DESC"),
  ]);

  const defaultProfile = {
    displayName: "Pengguna",
    planLabel: "Keuangan pribadi",
  };

  const currentMonthKey = monthKey ?? getMonthKey();
  
  const autoInsights = generateAutoInsights(transactionRows, currentMonthKey);
  const monthlySpending = calculateMonthlySpending(transactionRows);

  return {
    accounts: accountRows.map(mapAccount),
    budgets: budgetRows.map((row) => mapBudget(row, transactionRows, currentMonthKey)),
    goals: goalRows.map(mapGoal),
    insights: autoInsights,
    monthlySpending,
    profile: profileRow ? mapProfile(profileRow) : defaultProfile,
    recurringTransactions: recurringRows.map(mapRecurringTransaction),
    settings: mapSettings(settingRows),
    transactions: transactionRows.map(mapTransaction),
  };
}
