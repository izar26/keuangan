import type { SQLiteDatabase } from "expo-sqlite";
import type { Transaction, MoneyFlow, Rupiah } from "@/types/finance";
import { createLocalId } from "@/lib/id";
import { isIsoDate } from "@/lib/forms";
import { assertChanged, applyAccountDelta } from "./account-repository";

export type TransactionRow = {
  id: string;
  title: string;
  merchant: string;
  category: string;
  amount: Rupiah;
  flow: MoneyFlow;
  account_id: string;
  date: string;
};

export type SaveTransactionInput = Omit<Transaction, "id"> & {
  id?: string;
};

export function mapTransaction(row: TransactionRow): Transaction {
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

export async function saveTransaction(db: SQLiteDatabase, input: SaveTransactionInput) {
  const id = input.id ?? createLocalId("trx");

  if (!input.title.trim() || !input.merchant.trim() || !input.category.trim() || input.amount <= 0 || !input.accountId) {
    throw new Error("Judul, merchant, kategori, nominal, dan rekening wajib valid.");
  }

  if (!isIsoDate(input.date)) {
    throw new Error("Tanggal wajib dalam format YYYY-MM-DD.");
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    let balanceDelta = input.flow === "income" ? input.amount : -input.amount;

    if (input.id) {
      const existing = await tx.getFirstAsync<TransactionRow>(
        "SELECT amount, flow, account_id FROM transactions WHERE id = ?",
        input.id,
      );

      if (!existing) {
        throw new Error("Transaksi tidak ditemukan.");
      }

      if (existing.account_id !== input.accountId) {
        const revertOldDelta = existing.flow === "income" ? -existing.amount : existing.amount;
        await applyAccountDelta(tx, existing.account_id, revertOldDelta);
      } else {
        const existingDelta = existing.flow === "income" ? existing.amount : -existing.amount;
        balanceDelta -= existingDelta;
      }
    }

    if (balanceDelta !== 0) {
      await applyAccountDelta(tx, input.accountId, balanceDelta);
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
  });

  return id;
}

export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const existing = await tx.getFirstAsync<TransactionRow>(
      "SELECT amount, flow, account_id FROM transactions WHERE id = ?",
      id,
    );

    if (!existing) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    const revertDelta = existing.flow === "income" ? -existing.amount : existing.amount;
    await applyAccountDelta(tx, existing.account_id, revertDelta);
    
    const result = await tx.runAsync("DELETE FROM transactions WHERE id = ?", id);
    assertChanged(result, "Gagal menghapus transaksi.");
  });
}
