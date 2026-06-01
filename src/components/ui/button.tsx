import type { ComponentType } from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideProps } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  icon?: ComponentType<LucideProps>;
  label: string;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  ghost: "bg-transparent",
  primary: "bg-ink",
  secondary: "border border-line bg-surface",
};

const labelVariants: Record<ButtonVariant, string> = {
  ghost: "text-ink",
  primary: "text-white",
  secondary: "text-ink",
};

export function Button({ className, disabled, icon: Icon, label, onPress, variant = "primary", ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        "h-12 flex-row items-center justify-center gap-2 rounded-lg px-4",
        variants[variant],
        disabled && "opacity-50",
        className,
      )}
      disabled={disabled}
      onPress={(event) => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.(event);
      }}
      {...props}
    >
      {Icon ? <Icon color={variant === "primary" ? colors.surface : colors.ink} size={18} strokeWidth={2.3} /> : null}
      <Text adjustsFontSizeToFit className={cn("font-semibold", labelVariants[variant])} minimumFontScale={0.82} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
