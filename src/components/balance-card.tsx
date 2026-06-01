import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownLeft, ArrowUpRight, Plus, WalletCards } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";

type BalanceCardProps = {
  balance: number;
  cashflow: number;
  onAddTransaction?: () => void;
  onTransfer?: () => void;
  savingsRate: number;
};

export function BalanceCard({ balance, cashflow, onAddTransaction, onTransfer, savingsRate }: BalanceCardProps) {
  return (
    <LinearGradient
      colors={["#17211B", "#244236", "#1F8A5B"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ borderRadius: 8, padding: 20 }}
    >
      <View className="gap-5">
        <View className="flex-row items-start justify-between">
          <View className="gap-2">
            <Text className="text-sm font-medium text-white/70">Total aset tersedia</Text>
            <Text className="text-3xl font-bold text-white" selectable>
              {formatCurrency(balance, true)}
            </Text>
          </View>
          <View className="rounded-full bg-white/15 p-3">
            <WalletCards color={colors.surface} size={24} strokeWidth={2.2} />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-lg bg-white/12 p-3">
            <View className="flex-row items-center gap-1">
              <ArrowUpRight color="#DDF4E6" size={15} strokeWidth={2.4} />
              <Text className="text-xs font-semibold text-white/70">Cashflow</Text>
            </View>
            <Text className="mt-2 font-semibold text-white" selectable>
              {formatCurrency(cashflow, true)}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-white/12 p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <ArrowDownLeft color="#F5D99B" size={15} strokeWidth={2.4} />
                <Text className="text-xs font-semibold text-white/70">Tabungan</Text>
              </View>
              <Text className="text-xs font-bold text-amber">
                {savingsRate >= 20 ? "🔥" : ""}
              </Text>
            </View>
            <Text className="mt-2 font-semibold text-white" selectable>
              {formatPercent(savingsRate)}
            </Text>
            <View className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <View className="h-full bg-amber rounded-full" style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Button className="flex-1 bg-white" icon={Plus} label="Tambah" onPress={onAddTransaction} variant="secondary" />
          <Button
            className="flex-1 border-white/25 bg-white/10"
            icon={ArrowUpRight}
            label="Transfer"
            onPress={onTransfer}
            variant="primary"
          />
        </View>
      </View>
    </LinearGradient>
  );
}
