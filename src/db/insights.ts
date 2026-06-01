import type { Insight } from "@/types/finance";
import { getMonthKey } from "@/lib/forms";
import type { TransactionRow } from "./transaction-repository";

export type MonthlySpendingPoint = {
  amount: number;
  month: string;
};

export function generateAutoInsights(transactions: TransactionRow[], currentMonthKey?: string): Insight[] {
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
      title: "Aktivitas pencatatan",
      value: `${count} transaksi`,
      trend: "up",
      caption: `Tercatat di bulan ini. Teruskan!`,
    });
  }

  return insights;
}

export function calculateMonthlySpending(transactions: TransactionRow[]): MonthlySpendingPoint[] {
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
    .slice(-6); // Ambil 6 bulan terakhir
}
