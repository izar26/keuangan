import { Paths, File, Directory } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { FinanceSnapshot } from "@/db/finance-repository";

function escapeCsv(value: string | number) {
  const str = String(value);

  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function buildTransactionsCsv(snapshot: FinanceSnapshot) {
  const header = "Tanggal,Judul,Merchant,Kategori,Nominal,Arus,Rekening";
  const accountMap = new Map(snapshot.accounts.map((a) => [a.id, a.name]));

  const rows = snapshot.transactions.map((t) =>
    [
      t.date,
      escapeCsv(t.title),
      escapeCsv(t.merchant),
      escapeCsv(t.category),
      t.amount,
      t.flow === "income" ? "Masuk" : "Keluar",
      escapeCsv(accountMap.get(t.accountId) ?? t.accountId),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

function buildAccountsCsv(snapshot: FinanceSnapshot) {
  const header = "Nama,Institusi,Saldo,Nomor";

  const rows = snapshot.accounts.map((a) =>
    [escapeCsv(a.name), escapeCsv(a.institution), a.balance, escapeCsv(a.mask)].join(","),
  );

  return [header, ...rows].join("\n");
}

function buildBudgetsCsv(snapshot: FinanceSnapshot) {
  const header = "Nama,Kategori,Limit,Terpakai";

  const rows = snapshot.budgets.map((b) =>
    [escapeCsv(b.name), escapeCsv(b.category), b.limit, b.spent].join(","),
  );

  return [header, ...rows].join("\n");
}

function buildGoalsCsv(snapshot: FinanceSnapshot) {
  const header = "Nama,Target,Terkumpul,Tenggat";

  const rows = snapshot.goals.map((g) =>
    [escapeCsv(g.name), g.target, g.saved, g.dueDate].join(","),
  );

  return [header, ...rows].join("\n");
}

function buildRecurringTransactionsCsv(snapshot: FinanceSnapshot) {
  const header = "Judul,Merchant,Kategori,Nominal,Arus,Rekening,Siklus,Tgl Eksekusi";
  const accountMap = new Map(snapshot.accounts.map((a) => [a.id, a.name]));

  const rows = snapshot.recurringTransactions.map((t) =>
    [
      escapeCsv(t.title),
      escapeCsv(t.merchant),
      escapeCsv(t.category),
      t.amount,
      t.flow === "income" ? "Masuk" : "Keluar",
      escapeCsv(accountMap.get(t.accountId) ?? t.accountId),
      t.frequency,
      t.nextDate,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export async function exportFinanceData(snapshot: FinanceSnapshot) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const exportDir = new Directory(Paths.cache, "export");

  if (!exportDir.exists) {
    exportDir.create();
  }

  const files: File[] = [];

  if (snapshot.transactions.length > 0) {
    const txFile = new File(exportDir, `transaksi_${timestamp}.csv`);
    txFile.write(buildTransactionsCsv(snapshot));
    files.push(txFile);
  }

  if (snapshot.accounts.length > 0) {
    const accFile = new File(exportDir, `rekening_${timestamp}.csv`);
    accFile.write(buildAccountsCsv(snapshot));
    files.push(accFile);
  }

  if (snapshot.budgets.length > 0) {
    const budFile = new File(exportDir, `budget_${timestamp}.csv`);
    budFile.write(buildBudgetsCsv(snapshot));
    files.push(budFile);
  }

  if (snapshot.goals.length > 0) {
    const goalFile = new File(exportDir, `tujuan_${timestamp}.csv`);
    goalFile.write(buildGoalsCsv(snapshot));
    files.push(goalFile);
  }

  if (snapshot.recurringTransactions.length > 0) {
    const recurringFile = new File(exportDir, `transaksi_berulang_${timestamp}.csv`);
    recurringFile.write(buildRecurringTransactionsCsv(snapshot));
    files.push(recurringFile);
  }

  if (files.length === 0) {
    throw new Error("Belum ada data untuk diekspor.");
  }

  const primaryFile = files[0];
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("Sharing tidak didukung di perangkat ini.");
  }

  await Sharing.shareAsync(primaryFile.uri, {
    mimeType: "text/csv",
    dialogTitle: "Ekspor data keuangan",
    UTI: "public.comma-separated-values-text",
  });
}

