import { Pressable, Text, View } from "react-native";

import type { Budget } from "@/types/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

type BudgetCardProps = {
  budget: Budget;
  onPress?: () => void;
};

export function BudgetCard({ budget, onPress }: BudgetCardProps) {
  const progress = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;
  const remainingText = isOverBudget
    ? `${budget.category} - Lewat ${formatCurrency(Math.abs(remaining), true)}`
    : `${budget.category} - Sisa ${formatCurrency(remaining, true)}`;

  return (
    <Pressable onPress={onPress}>
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="gap-1">
            <Text className="font-semibold text-ink">{budget.name}</Text>
            <Text className="text-xs font-medium text-muted">{remainingText}</Text>
          </View>
          <Text className={`font-bold ${isOverBudget ? "text-coral" : "text-ink"}`} selectable>
            {formatPercent(progress)}
          </Text>
        </View>
        <ProgressBar accent={budget.accent} value={progress} />
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-muted">{formatCurrency(budget.spent, true)} terpakai</Text>
          <Text className="text-xs font-medium text-muted">Limit {formatCurrency(budget.limit, true)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}
