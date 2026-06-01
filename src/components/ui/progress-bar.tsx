import { View } from "react-native";

import { cn } from "@/lib/cn";

type ProgressBarProps = {
  accent?: "emerald" | "sky" | "amber" | "coral";
  value: number;
};

const accentClasses = {
  amber: "bg-amber",
  coral: "bg-coral",
  emerald: "bg-emerald",
  sky: "bg-sky",
};

export function ProgressBar({ accent = "emerald", value }: ProgressBarProps) {
  const width = `${Math.min(Math.max(value, 0), 100)}%` as `${number}%`;

  return (
    <View className="h-2 overflow-hidden rounded-full bg-line">
      <View className={cn("h-full rounded-full", accentClasses[accent])} style={{ width }} />
    </View>
  );
}
