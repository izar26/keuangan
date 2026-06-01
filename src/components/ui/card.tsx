import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn("rounded-lg border border-line bg-surface p-4", className)}>
      {children}
    </View>
  );
}
