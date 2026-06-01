import { Pressable, Text, View } from "react-native";
import { CreditCard } from "lucide-react-native";

import { colors } from "@/constants/theme";
import type { Account } from "@/types/finance";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";

type AccountCardProps = {
  account: Account;
  onPress?: () => void;
};

const accentClasses = {
  amber: "bg-amber/15",
  coral: "bg-coral/15",
  emerald: "bg-emerald/15",
  sky: "bg-sky/15",
};

const iconColors = {
  amber: colors.amber,
  coral: colors.coral,
  emerald: colors.emerald,
  sky: colors.sky,
};

export function AccountCard({ account, onPress }: AccountCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-3">
            <View className={cn("h-11 w-11 items-center justify-center rounded-lg", accentClasses[account.accent])}>
              <CreditCard color={iconColors[account.accent]} size={21} strokeWidth={2.3} />
            </View>
            <View className="gap-1">
              <Text className="font-semibold text-ink">{account.name}</Text>
              <Text className="text-xs font-medium text-muted">
                {account.institution} - {account.mask}
              </Text>
            </View>
          </View>
          <Text className="font-bold text-ink" selectable>
            {formatCurrency(account.balance, true)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
