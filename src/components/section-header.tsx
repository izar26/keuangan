import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, type LucideProps } from "lucide-react-native";

import { colors } from "@/constants/theme";

type SectionHeaderProps = {
  actionLabel?: string;
  icon?: ComponentType<LucideProps>;
  onActionPress?: () => void;
  title: string;
};

export function SectionHeader({ actionLabel, icon: Icon, onActionPress, title }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {Icon ? <Icon color={colors.ink} size={18} strokeWidth={2.4} /> : null}
        <Text className="text-lg font-semibold text-ink">{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable className="flex-row items-center gap-1 rounded-full py-1 pl-2" onPress={onActionPress}>
          <Text className="text-sm font-semibold text-emerald">{actionLabel}</Text>
          <ChevronRight color={colors.emerald} size={16} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}
