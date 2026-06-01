import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { CalendarCheck2, Coffee, Sparkles } from "lucide-react-native";

import { Card } from "@/components/ui/card";
import { colors } from "@/constants/theme";
import { getMonthKey } from "@/lib/forms";
import { formatCurrency } from "@/lib/format";
import type { Budget, Transaction } from "@/types/finance";

type DailyMoneyPulseProps = {
  budgets: Budget[];
  transactions: Transaction[];
};

export function DailyMoneyPulse({ budgets, transactions }: DailyMoneyPulseProps) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = getMonthKey();
  const todayExpense = transactions
    .filter((transaction) => transaction.flow === "expense" && transaction.date === todayKey)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpense = transactions
    .filter((transaction) => transaction.flow === "expense" && transaction.date.startsWith(monthKey))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const remainingBudget = totalBudget - monthlyExpense;
  const daysLeft = Math.max(daysRemainingInMonth(), 1);
  const dailyRoom = totalBudget > 0 ? (remainingBudget / daysLeft) : 0;
  const pressure = dailyRoom > 0 ? todayExpense / dailyRoom : 0;
  const isOverbudget = remainingBudget < 0;
  const status =
    totalBudget <= 0
      ? "Budget belum diatur"
      : isOverbudget
        ? "Bulan ini overbudget!"
        : pressure <= 0.75
          ? "Budget hari ini aman"
          : pressure <= 1
            ? "Budget hari ini mulai tipis"
            : "Budget hari ini kebobolan";
  const caption =
    totalBudget <= 0
      ? "Budget adalah jatah belanja per kategori. Setelah dibuat, beranda bisa menghitung batas aman harian."
      : isOverbudget
        ? `Pengeluaran bulan ini sudah melebihi limit. Anda defisit ${formatCurrency(Math.abs(remainingBudget), true)} dari total budget.`
        : `Hari ini sudah keluar ${formatCurrency(todayExpense, true)}. Jatah aman harian dihitung dari sisa budget bulan ini: ${formatCurrency(dailyRoom, true)}.`;

  return (
    <Animated.View entering={FadeInUp.duration(360).springify()}>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className={`text-sm font-bold ${isOverbudget ? "text-coral" : "text-emerald"}`}>{status}</Text>
            <Text className={`text-2xl font-bold ${isOverbudget ? "text-coral" : "text-ink"}`} selectable>
              {totalBudget <= 0 ? "Belum ada jatah" : isOverbudget ? formatCurrency(remainingBudget, true) : formatCurrency(dailyRoom, true)}
            </Text>
            <Text className="text-sm leading-5 text-muted">{caption}</Text>
          </View>
          <View className={`h-12 w-12 items-center justify-center rounded-xl ${isOverbudget || pressure > 1 ? "bg-coral/10" : "bg-mint"}`}>
            {isOverbudget || pressure > 1 ? (
              <Coffee color={colors.coral} size={24} strokeWidth={2.3} />
            ) : totalBudget <= 0 ? (
              <Sparkles color={colors.emerald} size={24} strokeWidth={2.3} />
            ) : (
              <CalendarCheck2 color={colors.emerald} size={24} strokeWidth={2.3} />
            )}
          </View>
        </View>

        <View className="h-2 overflow-hidden rounded-full bg-canvas">
          <View
            className={isOverbudget || pressure > 1 ? "h-full rounded-full bg-coral" : "h-full rounded-full bg-emerald"}
            style={{ width: `${isOverbudget ? 100 : Math.min(Math.max(pressure * 100, totalBudget > 0 ? 8 : 0), 100)}%` }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

function daysRemainingInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return lastDay - now.getDate() + 1;
}
