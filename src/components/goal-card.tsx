import { Text, View } from "react-native";
import { Pencil, PiggyBank, Target } from "lucide-react-native";

import { colors } from "@/constants/theme";
import type { Goal } from "@/types/finance";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

type GoalCardProps = {
  goal: Goal;
  onDepositPress?: () => void;
  onPress?: () => void;
};

export function GoalCard({ goal, onDepositPress, onPress }: GoalCardProps) {
  const progress = (goal.saved / goal.target) * 100;
  const remaining = Math.max(goal.target - goal.saved, 0);

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-mint">
            <Target color={colors.emerald} size={19} strokeWidth={2.3} />
          </View>
          <View className="gap-1">
            <Text className="font-semibold text-ink">{goal.name}</Text>
            <Text className="text-xs font-medium text-muted">Deadline {formatDate(goal.dueDate)}</Text>
          </View>
        </View>
        <Text className="font-bold text-ink">{formatPercent(progress)}</Text>
      </View>
      <ProgressBar value={progress} />
      <View className="gap-1">
        <Text className="text-xs font-medium text-muted">
          Terkumpul {formatCurrency(goal.saved, true)} dari target {formatCurrency(goal.target, true)}
        </Text>
        <Text className="text-xs font-bold text-emerald">
          Sisa yang perlu dikumpulkan {formatCurrency(remaining, true)}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Button className="flex-1" icon={PiggyBank} label="Setor" onPress={onDepositPress} />
        <Button className="flex-1" icon={Pencil} label="Edit" onPress={onPress} variant="secondary" />
      </View>
    </Card>
  );
}
