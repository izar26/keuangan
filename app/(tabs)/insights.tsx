import { useMemo } from "react";
import { Text, View } from "react-native";
import { BarChart3, Brain, RefreshCw, TrendingUp } from "lucide-react-native";

import { InsightCard } from "@/components/insight-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionHeader } from "@/components/section-header";
import { SpendingChart } from "@/components/spending-chart";
import { Card } from "@/components/ui/card";
import { StateView } from "@/components/ui/state-view";
import { useFinanceSummary } from "@/hooks/use-finance-summary";

export default function InsightsScreen() {
  const summary = useFinanceSummary();
  const isInitialLoading = summary.isLoading && summary.insights.length === 0 && summary.monthlySpending.length === 0;

  const healthCopy = useMemo(() => {
    if (summary.netCashflow > 0 && summary.savingsRate >= 20) {
      return {
        title: "Kesehatan finansial kuat",
        caption: "Pemasukan masih memimpin pengeluaran, dan alokasi tabungan berada di atas target konservatif.",
      };
    }

    if (summary.netCashflow >= 0) {
      return {
        title: "Kesehatan finansial stabil",
        caption: "Cashflow masih positif. Pantau budget agar tabungan tetap punya ruang.",
      };
    }

    return {
      title: "Cashflow perlu perhatian",
      caption: "Pengeluaran melewati pemasukan bulan ini. Kurangi kategori non-prioritas lebih dulu.",
    };
  }, [summary.netCashflow, summary.savingsRate]);

  return (
    <ScreenShell>
      <Card className="gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-mint">
          <Brain color="#1F8A5B" size={20} strokeWidth={2.3} />
        </View>
        <Text className="text-xl font-bold text-ink">{healthCopy.title}</Text>
        <Text className="text-sm leading-5 text-muted">
          {healthCopy.caption}
        </Text>
      </Card>

      {isInitialLoading ? (
        <StateView caption="Menghitung insight dari transaksi..." isLoading title="Memuat insight" />
      ) : summary.error ? (
        <StateView
          actionLabel="Coba lagi"
          caption={summary.error.message}
          icon={RefreshCw}
          onActionPress={summary.reload}
          title="Insight belum bisa dimuat"
        />
      ) : summary.monthlySpending.length === 0 ? (
        <StateView
          caption="Catat pengeluaran bulan ini untuk melihat chart tren bulanan."
          icon={BarChart3}
          title="Belum ada data pengeluaran"
        />
      ) : (
        <SpendingChart data={summary.monthlySpending} />
      )}

      <View className="gap-3">
        <SectionHeader
          icon={TrendingUp}
          title="Insight & Tren"
        />
        {!isInitialLoading && !summary.error && summary.insights.length === 0 ? (
          <StateView
            caption="Catat transaksi untuk mendapatkan insight otomatis tentang kebiasaan finansialmu."
            icon={TrendingUp}
            title="Insight belum tersedia"
          />
        ) : null}
        {summary.insights.map((insight) => (
          <InsightCard
            insight={insight}
            key={insight.id}
          />
        ))}
      </View>
    </ScreenShell>
  );
}
