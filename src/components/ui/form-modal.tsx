import type { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { X } from "lucide-react-native";

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
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[88%] rounded-t-2xl bg-canvas">
          <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-surface" onPress={onClose}>
              <X color={colors.ink} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="gap-4 px-5 py-5" keyboardShouldPersistTaps="handled">
            {children}
            {error ? <Text className="text-sm font-semibold text-coral">{error}</Text> : null}
            <Button disabled={isSaving} label={isSaving ? "Menyimpan..." : submitLabel} onPress={onSubmit} />
          </ScrollView>
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
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              className={cn(
                "h-11 flex-1 items-center justify-center rounded-lg border px-3",
                selected ? "border-emerald bg-mint" : "border-line bg-surface",
              )}
              key={option.value}
              onPress={() => onValueChange(option.value)}
            >
              <Text className={cn("font-semibold", selected ? "text-emerald" : "text-muted")}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
