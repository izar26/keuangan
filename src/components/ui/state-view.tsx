import type { ComponentType } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { LucideProps } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/button";

type StateViewProps = {
  actionLabel?: string;
  caption: string;
  icon?: ComponentType<LucideProps>;
  isLoading?: boolean;
  onActionPress?: () => void;
  title: string;
};

export function StateView({ actionLabel, caption, icon: Icon, isLoading = false, onActionPress, title }: StateViewProps) {
  return (
    <View className="items-center gap-3 rounded-lg border border-line bg-surface p-5">
      <View className="h-12 w-12 items-center justify-center rounded-lg bg-canvas">
        {isLoading ? (
          <ActivityIndicator color={colors.emerald} />
        ) : Icon ? (
          <Icon color={colors.charcoal} size={22} strokeWidth={2.3} />
        ) : null}
      </View>
      <View className="items-center gap-1">
        <Text className="text-base font-bold text-ink" selectable>
          {title}
        </Text>
        <Text className="text-center text-sm leading-5 text-muted">{caption}</Text>
      </View>
      {actionLabel && onActionPress ? <Button label={actionLabel} onPress={onActionPress} variant="secondary" /> : null}
    </View>
  );
}
