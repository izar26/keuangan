import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

type ScreenShellProps = PropsWithChildren<{
  compact?: boolean;
}>;

export function ScreenShell({ children, compact = false }: ScreenShellProps) {
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName={compact ? "gap-4 px-5 pb-8 pt-4" : "gap-5 px-5 pb-10 pt-5"}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-5">{children}</View>
    </ScrollView>
  );
}
