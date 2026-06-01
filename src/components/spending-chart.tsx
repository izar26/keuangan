import { Pressable, Text, View } from "react-native";

import type { MonthlySpendingPoint } from "@/db/finance-repository";
import { formatCurrency } from "@/lib/format";

type SpendingChartProps = {
  data: MonthlySpendingPoint[];
  onPointPress?: (point: MonthlySpendingPoint) => void;
};

export function SpendingChart({ data, onPointPress }: SpendingChartProps) {
  const max = Math.max(...data.map((item) => item.amount), 0);
  const periodLabel = `${data.length} bulan terakhir`;

  return (
    <View className="rounded-lg border border-line bg-surface p-4">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-ink">Pengeluaran bulanan</Text>
          <Text className="text-xs font-medium text-muted">{periodLabel}</Text>
        </View>
        <Text className="font-bold text-ink" selectable>
          {formatCurrency(data.at(-1)?.amount ?? 0, true)}
        </Text>
      </View>
      <View className="h-36 flex-row items-end gap-3">
        {data.map((item) => {
          const height = `${max > 0 ? Math.max((item.amount / max) * 100, 12) : 12}%` as `${number}%`;

          return (
            <Pressable className="flex-1 items-center gap-2" key={item.month} onPress={() => onPointPress?.(item)}>
              <View className="w-full justify-end rounded-full bg-canvas" style={{ height: 120 }}>
                <View className="w-full rounded-full bg-emerald" style={{ height }} />
              </View>
              <Text className="text-xs font-semibold text-muted">{item.month}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
