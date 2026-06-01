import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { MonthlySpendingPoint } from "@/db/finance-repository";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/constants/theme";

type SpendingChartProps = {
  data: MonthlySpendingPoint[];
  onPointPress?: (point: MonthlySpendingPoint) => void;
};

export function SpendingChart({ data, onPointPress }: SpendingChartProps) {
  const { width } = useWindowDimensions();
  const max = Math.max(...data.map((item) => item.amount), 0);
  const periodLabel = `${data.length} bulan terakhir`;
  const chartWidth = Math.min(width - 72, 420);
  const chartHeight = 148;
  const gap = 10;
  const barWidth = data.length > 0 ? Math.max((chartWidth - gap * (data.length - 1)) / data.length, 18) : 18;

  return (
    <Animated.View entering={FadeInUp.duration(360).springify()} className="rounded-lg border border-line bg-surface p-4">
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-ink">Pengeluaran bulanan</Text>
          <Text className="text-xs font-medium text-muted">{periodLabel}</Text>
        </View>
        <Text className="font-bold text-ink" selectable>
          {formatCurrency(data.at(-1)?.amount ?? 0, true)}
        </Text>
      </View>
      <View style={{ height: chartHeight, width: chartWidth }}>
        <Canvas style={{ height: chartHeight, width: chartWidth }}>
          <Group>
            {data.map((item, index) => {
              const height = max > 0 ? Math.max((item.amount / max) * (chartHeight - 18), 18) : 18;
              const x = index * (barWidth + gap);
              const y = chartHeight - height;

              return (
                <Group key={item.month}>
                  <RoundedRect color={colors.canvas} height={chartHeight} r={999} width={barWidth} x={x} y={0} />
                  <RoundedRect color={index === data.length - 1 ? colors.emerald : colors.sky} height={height} r={999} width={barWidth} x={x} y={y} />
                </Group>
              );
            })}
          </Group>
        </Canvas>
        <View className="absolute inset-0 flex-row" style={{ columnGap: gap }}>
          {data.map((item) => (
            <Pressable className="flex-1" key={item.month} onPress={() => onPointPress?.(item)} />
          ))}
        </View>
      </View>
      <View className="mt-2 flex-row" style={{ columnGap: gap, width: chartWidth }}>
        {data.map((item) => {
          return (
            <Pressable className="flex-1 items-center" key={item.month} onPress={() => onPointPress?.(item)}>
              <Text className="text-xs font-semibold text-muted">{item.month}</Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
