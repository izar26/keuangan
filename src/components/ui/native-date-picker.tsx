import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";

type NativeDatePickerProps = {
  accentColor?: string;
  display?: string;
  mode?: string;
  onDismiss?: () => void;
  onValueChange?: (event: { nativeEvent: { timestamp: number; utcOffset: number } }, date: Date) => void;
  value: Date;
};

export default function NativeDatePicker({ onDismiss, onValueChange, value }: NativeDatePickerProps) {
  const [text, setText] = useState(value.toISOString().slice(0, 10));

  function commit(nextText = text) {
    const parsed = new Date(`${nextText}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      onValueChange?.({ nativeEvent: { timestamp: parsed.getTime(), utcOffset: 0 } }, parsed);
    }
    onDismiss?.();
  }

  return (
    <View className="gap-2 rounded-lg border border-line bg-surface p-3">
      <TextInput
        className="h-11 rounded-lg border border-line bg-canvas px-3 text-base text-ink"
        onChangeText={setText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.muted}
        value={text}
      />
      <Pressable className="items-center rounded-lg bg-ink px-3 py-2" onPress={() => commit()}>
        <Text className="font-bold text-white">Pakai tanggal</Text>
      </Pressable>
    </View>
  );
}
