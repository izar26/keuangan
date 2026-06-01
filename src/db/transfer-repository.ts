import type { SQLiteDatabase } from "expo-sqlite";
import type { Rupiah } from "@/types/finance";
import { applyAccountDelta } from "./account-repository";

export type TransferInput = {
  amount: Rupiah;
  fromAccountId: string;
  toAccountId: string;
};

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
