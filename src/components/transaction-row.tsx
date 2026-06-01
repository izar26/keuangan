import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import type { Transaction } from "@/types/finance";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCategoryEmoji } from "@/constants/categories";

type TransactionRowProps = {
  onPress?: () => void;
  transaction: Transaction;
};

export function TransactionRow({ onPress, transaction }: TransactionRowProps) {
  const isIncome = transaction.flow === "income";
  const emoji = getCategoryEmoji(transaction.category, isIncome);

  return (
    <Pressable className="flex-row items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3" onPress={onPress}>
      <View className="flex-row flex-1 items-center gap-3">
        <View className={cn("h-11 w-11 items-center justify-center rounded-lg", isIncome ? "bg-mint" : "bg-canvas")}>
          <Text className="text-xl">{emoji}</Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-ink">{transaction.title}</Text>
          <Text className="text-xs font-medium text-muted">
            {transaction.category} • {transaction.merchant} • {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
      <Text className={cn("font-bold", isIncome ? "text-emerald" : "text-ink")} selectable>
        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, true)}
      </Text>
    </Pressable>
  );
}
