import { Pressable, Text, View } from "react-native";
import { Target } from "lucide-react-native";

import { colors } from "@/constants/theme";
import type { Goal } from "@/types/finance";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

type GoalCardProps = {
  goal: Goal;
  onPress?: () => void;
};

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const progress = (goal.saved / goal.target) * 100;

  return (
    <Pressable onPress={onPress}>
    <Card className="gap-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-mint">
            <Target color={colors.emerald} size={19} strokeWidth={2.3} />
          </View>
          <View className="gap-1">
            <Text className="font-semibold text-ink">{goal.name}</Text>
            <Text className="text-xs font-medium text-muted">Target {formatDate(goal.dueDate)}</Text>
          </View>
        </View>
        <Text className="font-bold text-ink">{formatPercent(progress)}</Text>
      </View>
      <ProgressBar value={progress} />
      <Text className="text-xs font-medium text-muted">
        {formatCurrency(goal.saved, true)} dari {formatCurrency(goal.target, true)}
      </Text>
    </Card>
    </Pressable>
  );
}
