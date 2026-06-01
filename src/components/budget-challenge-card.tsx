import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { BadgeCheck, Flame, Target } from "lucide-react-native";

import { Card } from "@/components/ui/card";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/format";
import type { Budget, Transaction } from "@/types/finance";

type BudgetChallengeCardProps = {
  budgets: Budget[];
  transactions: Transaction[];
};

export function BudgetChallengeCard({ budgets, transactions }: BudgetChallengeCardProps) {
  const streak = getTrackingStreak(transactions);
  const riskyBudget = budgets
    .filter((budget) => budget.limit > 0)
    .map((budget) => ({ ...budget, progress: budget.spent / budget.limit }))
    .sort((a, b) => b.progress - a.progress)[0];
  const challenge =
    riskyBudget && riskyBudget.progress >= 0.7
      ? `Tahan ${riskyBudget.category} di bawah ${formatCurrency(Math.max(riskyBudget.limit - riskyBudget.spent, 0), true)} minggu ini.`
      : "Jaga transaksi harian tetap tercatat minimal 5 hari minggu ini.";

  return (
    <Animated.View entering={FadeInUp.delay(80).duration(360).springify()}>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between">
          <View className="gap-1">
            <Text className="text-sm font-bold text-amber">Weekly challenge</Text>
            <Text className="text-xl font-bold text-ink">{streak} hari streak</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-canvas">
            {streak >= 3 ? (
              <Flame color={colors.amber} size={22} strokeWidth={2.3} />
            ) : (
              <Target color={colors.emerald} size={22} strokeWidth={2.3} />
            )}
          </View>
        </View>
        <Text className="text-sm leading-5 text-muted">{challenge}</Text>
        <View className="flex-row items-center gap-2 rounded-lg bg-mint px-3 py-2">
          <BadgeCheck color={colors.emerald} size={16} strokeWidth={2.3} />
          <Text className="flex-1 text-xs font-bold text-emerald">
            Badge aktif: {streak >= 7 ? "Budget Boss" : streak >= 3 ? "Konsisten" : "Mulai rapi"}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

function getTrackingStreak(transactions: Transaction[]) {
  const transactionDays = new Set(transactions.map((transaction) => transaction.date));
  let streak = 0;
  const cursor = new Date();

  while (transactionDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
