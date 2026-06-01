import type { SQLiteDatabase } from "expo-sqlite";
import type { Goal, Rupiah } from "@/types/finance";
import { createLocalId } from "@/lib/id";
import { isIsoDate, formatDateInput } from "@/lib/forms";
import { assertChanged, applyAccountDelta } from "./account-repository";

export type GoalRow = {
  id: string;
  name: string;
  target_amount: Rupiah;
  saved_amount: Rupiah;
  due_date: string;
};

export type SaveGoalInput = Omit<Goal, "id" | "saved"> & {
  id?: string;
  saved?: Rupiah;
};

export type DepositGoalInput = {
  goalId: string;
  amount: Rupiah;
  accountId: string;
};

export function mapGoal(row: GoalRow): Goal {
  return {
    dueDate: row.due_date,
    id: row.id,
    name: row.name,
    saved: row.saved_amount,
    target: row.target_amount,
  };
}

export async function saveGoal(db: SQLiteDatabase, input: SaveGoalInput) {
  const id = input.id ?? createLocalId("gol");

  if (!input.name.trim()) {
    throw new Error("Nama tujuan wajib diisi.");
  }

  if (input.target <= 0) {
    throw new Error("Target tabungan harus lebih dari 0.");
  }

  if (!isIsoDate(input.dueDate)) {
    throw new Error("Tanggal target wajib dalam format YYYY-MM-DD.");
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
    input.saved ?? 0,
    input.dueDate,
  );

  return id;
}

export async function deleteGoal(db: SQLiteDatabase, id: string) {
  const result = await db.runAsync("DELETE FROM goals WHERE id = ?", id);
  assertChanged(result, "Tujuan tabungan tidak ditemukan.");
}

export async function depositGoalTransaction(db: SQLiteDatabase, input: DepositGoalInput) {
  if (input.amount <= 0) {
    throw new Error("Nominal setoran harus lebih dari 0.");
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    // 1. Ambil goal saat ini untuk mendapatkan nama celengan dan validasi max deposit
    const goal = await tx.getFirstAsync<GoalRow>("SELECT name, target_amount, saved_amount FROM goals WHERE id = ?", input.goalId);

    if (!goal) {
      throw new Error("Tujuan tabungan tidak ditemukan.");
    }

    const remaining = goal.target_amount - goal.saved_amount;
    if (input.amount > remaining) {
      throw new Error(`Nominal setoran terlalu besar. Sisa target hanya sebesar Rp ${remaining.toLocaleString("id-ID")}`);
    }

    // 2. Tambah saved_amount pada tabel goals
    const updateGoalResult = await tx.runAsync(
      "UPDATE goals SET saved_amount = saved_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      input.amount,
      input.goalId
    );
    assertChanged(updateGoalResult, "Gagal mengupdate progress tabungan.");

    // 3. Catat transaksi pengeluaran
    const dateStr = formatDateInput(new Date());
    await tx.runAsync(
      `INSERT INTO transactions (id, title, merchant, category, amount, flow, account_id, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      createLocalId("trx"),
      `Setor ke ${goal.name}`,
      "Celengan",
      "Tabungan",
      input.amount,
      "expense",
      input.accountId,
      dateStr
    );

    // 4. Potong saldo rekening sumber dana
    await applyAccountDelta(tx, input.accountId, -input.amount);
  });
}
