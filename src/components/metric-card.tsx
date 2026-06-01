import type { ComponentType } from "react";
import { Text, View } from "react-native";
import type { LucideProps } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  accent?: "emerald" | "sky" | "amber" | "coral";
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
};

const accentClass = {
  amber: "bg-amber/15",
  coral: "bg-coral/15",
  emerald: "bg-emerald/15",
  sky: "bg-sky/15",
};

const iconColor = {
  amber: colors.amber,
  coral: colors.coral,
  emerald: colors.emerald,
  sky: colors.sky,
};

export function MetricCard({ accent = "emerald", icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="flex-1 gap-3">
      <View className={cn("h-9 w-9 items-center justify-center rounded-lg", accentClass[accent])}>
        <Icon color={iconColor[accent]} size={18} strokeWidth={2.4} />
      </View>
      <View className="gap-1">
        <Text className="text-xs font-medium text-muted">{label}</Text>
        <Text className="text-base font-bold text-ink" selectable>
          {value}
        </Text>
      </View>
    </Card>
  );
}
