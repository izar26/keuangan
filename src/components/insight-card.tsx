import { Pressable, Text, View } from "react-native";
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react-native";

import { colors } from "@/constants/theme";
import type { Insight } from "@/types/finance";
import { Card } from "@/components/ui/card";

type InsightCardProps = {
  insight: Insight;
  onPress?: () => void;
};

const trendIcon = {
  down: ArrowDownRight,
  flat: Minus,
  up: ArrowUpRight,
};

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const TrendIcon = trendIcon[insight.trend];

  return (
    <Pressable onPress={onPress}>
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-canvas">
          <Activity color={colors.charcoal} size={18} strokeWidth={2.3} />
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-mint px-2 py-1">
          <TrendIcon color={colors.emerald} size={14} strokeWidth={2.4} />
          <Text className="text-xs font-bold text-emerald">{insight.value}</Text>
        </View>
      </View>
      <View className="gap-1">
        <Text className="font-semibold text-ink">{insight.title}</Text>
        <Text className="text-sm leading-5 text-muted">{insight.caption}</Text>
      </View>
    </Card>
    </Pressable>
  );
}
