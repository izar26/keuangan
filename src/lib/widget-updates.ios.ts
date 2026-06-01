import BudgetPulseWidget from "@/widgets/budget-pulse-widget";
import type { FinanceSnapshot } from "@/db/finance-repository";
import { getMonthKey } from "@/lib/forms";
import { formatCurrency } from "@/lib/format";

export function updateBudgetPulseWidget(snapshot: FinanceSnapshot) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = getMonthKey();
  const todaySpent = snapshot.transactions
    .filter((transaction) => transaction.flow === "expense" && transaction.date === todayKey)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthSpent = snapshot.transactions
    .filter((transaction) => transaction.flow === "expense" && transaction.date.startsWith(monthKey))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBudget = snapshot.budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const remainingBudget = totalBudget - monthSpent;
  const progress = totalBudget > 0 ? monthSpent / totalBudget : 0;
  const dailyStatus =
    totalBudget <= 0 ? "Budget belum aktif" : remainingBudget >= 0 ? "Sisa budget bulan ini" : "Overbudget bulan ini";

  BudgetPulseWidget.updateSnapshot({
    dailyStatus,
    progress,
    remainingBudget: formatCurrency(Math.max(remainingBudget, 0), true),
    todaySpent: formatCurrency(todaySpent, true),
  });
}
