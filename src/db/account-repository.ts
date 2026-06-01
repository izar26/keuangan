import type { SQLiteDatabase, SQLiteRunResult } from "expo-sqlite";
import type { Account, Rupiah } from "@/types/finance";
import { createLocalId } from "@/lib/id";

export type AccountRow = {
  id: string;
  name: string;
  institution: string;
  balance: Rupiah;
  accent: "emerald" | "sky" | "amber" | "coral";
  mask: string;
};

export type BalanceRow = {
  balance: Rupiah;
};

export type SaveAccountInput = Omit<Account, "id"> & {
  id?: string;
};

export function assertChanged(result: SQLiteRunResult, message: string) {
  if (result.changes < 1) {
    throw new Error(message);
  }
}

export function mapAccount(row: AccountRow): Account {
  return {
    accent: row.accent,
    balance: row.balance,
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    name: row.name,
  };
}

export async function saveAccount(db: SQLiteDatabase, input: SaveAccountInput) {
  const id = input.id ?? createLocalId("acc");

  if (!input.name.trim() || !input.institution.trim()) {
    throw new Error("Nama dan institusi rekening wajib diisi.");
  }

  if (input.balance < 0) {
    throw new Error("Saldo tidak boleh negatif.");
  }

  await db.runAsync(
    `INSERT INTO accounts (id, name, institution, balance, accent, mask)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       institution = excluded.institution,
       balance = excluded.balance,
       accent = excluded.accent,
       mask = excluded.mask,
       updated_at = CURRENT_TIMESTAMP`,
    id,
    input.name,
    input.institution,
    input.balance,
    input.accent,
    input.mask,
  );

  return id;
}

export async function deleteAccount(db: SQLiteDatabase, id: string) {
  try {
    const result = await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
    assertChanged(result, "Rekening tidak ditemukan.");
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("FOREIGN KEY constraint failed")) {
      throw new Error("Rekening tidak bisa dihapus karena masih ada transaksi yang terhubung.");
    }
    throw cause;
  }
}

export async function applyAccountDelta(db: SQLiteDatabase, accountId: string, delta: Rupiah) {
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
