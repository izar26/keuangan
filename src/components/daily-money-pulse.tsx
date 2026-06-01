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
  const dailyRoom = totalBudget > 0 ? Math.max(remainingBudget / daysLeft, 0) : 0;
  const topCategory = getTopTodayCategory(transactions, todayKey);
  const pressure = dailyRoom > 0 ? todayExpense / dailyRoom : 0;
  const status =
    totalBudget <= 0
      ? "Buat budget dulu"
      : pressure <= 0.75
        ? "Hari ini aman"
        : pressure <= 1
          ? "Tipis tapi aman"
          : "Rem hari ini";
  const caption =
    totalBudget <= 0
      ? "Tambahkan budget agar aplikasi bisa kasih batas harian otomatis."
      : `${topCategory.label} ${formatPercent(topCategory.share)} dari belanja hari ini. Sisa ruang harian ${formatCurrency(dailyRoom, true)}.`;

  return (
    <Animated.View entering={FadeInUp.duration(360).springify()}>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-sm font-bold text-emerald">{status}</Text>
            <Text className="text-2xl font-bold text-ink" selectable>
              {formatCurrency(todayExpense, true)}
            </Text>
            <Text className="text-sm leading-5 text-muted">{caption}</Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-mint">
            {pressure > 1 ? (
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
            className={pressure > 1 ? "h-full rounded-full bg-coral" : "h-full rounded-full bg-emerald"}
            style={{ width: `${Math.min(Math.max(pressure * 100, totalBudget > 0 ? 8 : 0), 100)}%` }}
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

function getTopTodayCategory(transactions: Transaction[], todayKey: string) {
  const map = new Map<string, number>();
  let total = 0;

  for (const transaction of transactions) {
    if (transaction.flow !== "expense" || transaction.date !== todayKey) {
      continue;
    }

    total += transaction.amount;
    map.set(transaction.category, (map.get(transaction.category) ?? 0) + transaction.amount);
  }

  if (total <= 0) {
    return { label: "Belanja", share: 0 };
  }

  const [label, amount] = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0] ?? ["Belanja", 0];

  return { label, share: amount / total };
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
