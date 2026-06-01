import type { SQLiteDatabase } from "expo-sqlite";
import type { Budget, Rupiah } from "@/types/finance";
import { createLocalId } from "@/lib/id";
import { getMonthKey } from "@/lib/forms";
import { assertChanged } from "./account-repository";
import type { TransactionRow } from "./transaction-repository";

export type BudgetRow = {
  id: string;
  name: string;
  category: string;
  limit_amount: Rupiah;
  spent_amount: Rupiah;
  accent: "emerald" | "sky" | "amber" | "coral";
};

export type SaveBudgetInput = Omit<Budget, "id" | "spent"> & {
  id?: string;
  spent?: Rupiah;
};

export function mapBudget(row: BudgetRow, transactions: TransactionRow[], monthKey?: string): Budget {
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

export async function saveBudget(db: SQLiteDatabase, input: SaveBudgetInput) {
  const id = input.id ?? createLocalId("bdg");

  if (!input.name.trim()) {
    throw new Error("Nama budget wajib diisi.");
  }

  if (input.limit <= 0) {
    throw new Error("Limit budget harus lebih dari 0.");
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
