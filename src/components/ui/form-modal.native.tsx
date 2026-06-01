import type { PropsWithChildren } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { X } from "lucide-react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

type FormModalProps = PropsWithChildren<{
  error?: string | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  title: string;
  visible: boolean;
}>;

type FormFieldProps = {
  keyboardType?: "default" | "number-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedFieldProps<T extends string> = {
  label: string;
  onValueChange: (value: T) => void;
  options: Option<T>[];
  value: T;
};

export function FormModal({
  children,
  error,
  isSaving = false,
  onClose,
  onSubmit,
  submitLabel = "Simpan",
  title,
  visible,
}: FormModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="overflow-hidden rounded-t-2xl bg-canvas" style={{ height: "94%" }}>
          <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-surface" onPress={onClose}>
              <X color={colors.ink} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            bottomOffset={132 + insets.bottom}
            contentContainerStyle={{ gap: 16, paddingBottom: 144 + insets.bottom, paddingHorizontal: 20, paddingTop: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {children}
          </KeyboardAwareScrollView>

          <KeyboardStickyView offset={{ closed: 0, opened: -8 }}>
            <View className="gap-3 border-t border-line bg-canvas px-5 pt-3" style={{ paddingBottom: 20 + insets.bottom }}>
              {error ? <Text className="text-sm font-semibold text-coral">{error}</Text> : null}
              <Button disabled={isSaving} label={isSaving ? "Menyimpan..." : submitLabel} onPress={onSubmit} />
            </View>
          </KeyboardStickyView>
        </View>
      </View>
    </Modal>
  );
}

export function FormField({ keyboardType = "default", label, onChangeText, placeholder, value }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        className="h-12 rounded-lg border border-line bg-surface px-4 text-base text-ink"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
      />
    </View>
  );
}

export function SegmentedField<T extends string>({ label, onValueChange, options, value }: SegmentedFieldProps<T>) {
  const compactGrid = options.length > 2;

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              className={cn(
                "min-h-11 items-center justify-center rounded-lg border px-3 py-2",
                selected ? "border-emerald bg-mint" : "border-line bg-surface",
              )}
              key={option.value}
              onPress={() => onValueChange(option.value)}
              style={compactGrid ? { flexBasis: "47%", flexGrow: 1 } : { flex: 1 }}
            >
              <Text
                adjustsFontSizeToFit
                className={cn("text-center font-bold", selected ? "text-emerald" : "text-ink")}
                minimumFontScale={0.86}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MoneyField({ label, onChangeText, value, placeholder }: Omit<FormFieldProps, "keyboardType">) {
  const handleChange = (text: string) => {
    const numeric = text.replace(/[^\d]/g, "");
    if (!numeric) {
      onChangeText("");
      return;
    }
    onChangeText(numeric.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const appendZeros = (count: number) => {
    const numeric = value.replace(/[^\d]/g, "");
    const base = numeric === "" ? "1" : numeric;
    const result = base + "0".repeat(count);
    onChangeText(result.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        className="h-12 rounded-lg border border-line bg-surface px-4 text-base text-ink"
        keyboardType="number-pad"
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
      />
      <View className="flex-row gap-2">
        <Pressable className="rounded-full border border-line bg-surface px-3 py-1.5" onPress={() => appendZeros(3)}>
          <Text className="text-xs font-semibold text-ink">+000</Text>
        </Pressable>
        <Pressable className="rounded-full border border-line bg-surface px-3 py-1.5" onPress={() => appendZeros(6)}>
          <Text className="text-xs font-semibold text-ink">+000.000</Text>
        </Pressable>
      </View>
    </View>
  );
}
