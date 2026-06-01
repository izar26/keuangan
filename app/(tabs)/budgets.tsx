import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Target } from "lucide-react-native";

import { BudgetCard } from "@/components/budget-card";
import { BudgetFormModal, GoalFormModal } from "@/components/forms/finance-modals";
import { GoalCard } from "@/components/goal-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateView } from "@/components/ui/state-view";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getMonthKey } from "@/lib/forms";
import type { Budget, Goal } from "@/types/finance";

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return getMonthKey(date);
}

function formatMonthDisplay(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
}

export default function BudgetsScreen() {
  const summary = useFinanceSummary();
  const currentMonthKey = getMonthKey();
  const [budgetMonthKey, setBudgetMonthKey] = useState(currentMonthKey);
  const isCurrentMonth = budgetMonthKey === currentMonthKey;

  // Recalculate budget spent for selected month
  const budgetsForMonth = useMemo(() => {
    return summary.budgets.map((budget) => {
      if (!budget.category) {
        return budget;
      }

      const spent = summary.transactions
        .filter(
          (t) =>
            t.flow === "expense" &&
            t.category.toLowerCase() === budget.category.toLowerCase() &&
            t.date.startsWith(budgetMonthKey),
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });
  }, [budgetMonthKey, summary.budgets, summary.transactions]);

  const totalBudget = budgetsForMonth.reduce((sum, b) => sum + b.limit, 0);
  const spentBudget = budgetsForMonth.reduce((sum, b) => sum + b.spent, 0);
  const progress = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - spentBudget;
  const budgetCaption =
    totalBudget <= 0
      ? "Tambahkan budget untuk mulai memantau batas pengeluaran."
      : remainingBudget < 0
        ? `Pengeluaran melewati limit sebesar ${formatCurrency(Math.abs(remainingBudget), true)}.`
        : `Sisa ruang budget ${formatCurrency(remainingBudget, true)}.`;
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const isInitialLoading = summary.isLoading && summary.budgets.length === 0 && summary.goals.length === 0;

  return (
    <ScreenShell>
      <Card className="gap-4 bg-ink">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-sm font-medium text-white/70">
              {isCurrentMonth ? "Budget bulan ini" : "Budget bulan lalu"}
            </Text>
            <Text className="text-2xl font-bold text-white" selectable>
              {formatCurrency(spentBudget, true)}
            </Text>
          </View>
          <Text className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
            {formatPercent(progress)}
          </Text>
        </View>
        <Text className="text-sm leading-5 text-white/70">Dari total limit {formatCurrency(totalBudget, true)}. {budgetCaption}</Text>

        {/* Month navigation */}
        <View className="flex-row items-center justify-between rounded-lg bg-white/10 px-2 py-2">
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md"
            onPress={() => setBudgetMonthKey(shiftMonth(budgetMonthKey, -1))}
          >
            <ChevronLeft color="#FFFFFF" size={18} strokeWidth={2.5} />
          </Pressable>
          <Text className="text-sm font-semibold text-white">{formatMonthDisplay(budgetMonthKey)}</Text>
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-md"
            disabled={isCurrentMonth}
            onPress={() => setBudgetMonthKey(shiftMonth(budgetMonthKey, 1))}
            style={isCurrentMonth ? { opacity: 0.3 } : undefined}
          >
            <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <Button
            className="flex-1 bg-white"
            icon={Plus}
            label="Budget"
            onPress={() => {
              setSelectedBudget(null);
              setShowBudgetForm(true);
            }}
            variant="secondary"
          />
          <Button
            className="flex-1 border-white/25 bg-white/10"
            icon={Plus}
            label="Tujuan"
            onPress={() => {
              setSelectedGoal(null);
              setShowGoalForm(true);
            }}
          />
        </View>
      </Card>

      <View className="gap-3">
        <SectionHeader icon={Target} title="Kategori budget" />
        {isInitialLoading ? (
          <StateView caption="Membaca budget dari database lokal." isLoading title="Memuat budget" />
        ) : summary.error ? (
          <StateView
            actionLabel="Coba lagi"
            caption={summary.error.message}
            icon={RefreshCw}
            onActionPress={summary.reload}
            title="Budget belum bisa dimuat"
          />
        ) : summary.budgets.length === 0 ? (
          <StateView
            actionLabel="Tambah budget"
            caption="Buat budget pertama untuk memantau batas pengeluaran."
            icon={Target}
            onActionPress={() => {
              setSelectedBudget(null);
              setShowBudgetForm(true);
            }}
            title="Belum ada budget"
          />
        ) : null}
        {budgetsForMonth.map((budget) => (
          <BudgetCard
            budget={budget}
            key={budget.id}
            onPress={() => {
              setSelectedBudget(budget);
              setShowBudgetForm(true);
            }}
          />
        ))}
      </View>

      <View className="gap-3">
        <SectionHeader title="Tujuan tabungan" />
        {!isInitialLoading && !summary.error && summary.goals.length === 0 ? (
          <StateView
            actionLabel="Tambah tujuan"
            caption="Tambahkan tujuan tabungan agar progress dana bisa dipantau."
            icon={Target}
            onActionPress={() => {
              setSelectedGoal(null);
              setShowGoalForm(true);
            }}
            title="Belum ada tujuan"
          />
        ) : null}
        {summary.goals.map((goal) => (
          <GoalCard
            goal={goal}
            key={goal.id}
            onPress={() => {
              setSelectedGoal(goal);
              setShowGoalForm(true);
            }}
          />
        ))}
      </View>

      <BudgetFormModal
        budget={selectedBudget}
        onClose={() => setShowBudgetForm(false)}
        onDelete={async (id) => {
          await summary.removeBudget(id);
          setShowBudgetForm(false);
        }}
        onSave={summary.persistBudget}
        visible={showBudgetForm}
      />
      <GoalFormModal
        goal={selectedGoal}
        onClose={() => setShowGoalForm(false)}
        onDelete={async (id) => {
          await summary.removeGoal(id);
          setShowGoalForm(false);
        }}
        onSave={summary.persistGoal}
        visible={showGoalForm}
      />
    </ScreenShell>
  );
}
