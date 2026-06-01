import { useState } from "react";
import { Text, View } from "react-native";
import { Download, RefreshCw, UserRound, Plus, Moon, Sun, LockKeyhole, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { ProfileFormModal, RecurringTransactionFormModal } from "@/components/forms/finance-modals";
import type { RecurringTransaction } from "@/types/finance";
import { ScreenShell } from "@/components/screen-shell";
import { useAppAlert } from "@/components/ui/app-alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/ui/state-view";
import { colors } from "@/constants/theme";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { exportFinanceData } from "@/lib/export";

export default function ProfileScreen() {
  const appAlert = useAppAlert();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const summary = useFinanceSummary();
  const { colorScheme, toggleColorScheme } = useColorScheme();

  async function handleExport() {
    setIsExporting(true);

    try {
      await exportFinanceData({
        accounts: summary.accounts,
        budgets: summary.budgets,
        goals: summary.goals,
        insights: summary.insights,
        monthlySpending: summary.monthlySpending,
        profile: summary.profile,
        settings: summary.settings,
        transactions: summary.transactions,
        recurringTransactions: summary.recurringTransactions,
      });
    } catch (cause) {
      appAlert.show({
        message: cause instanceof Error ? cause.message : "Coba lagi nanti.",
        title: "Ekspor gagal",
        tone: "danger",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScreenShell>
      {summary.error ? (
        <StateView
          actionLabel="Coba lagi"
          caption={summary.error.message}
          icon={RefreshCw}
          onActionPress={summary.reload}
          title="Profil belum bisa dimuat"
        />
      ) : null}
      <Card className="items-center gap-4">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-mint">
          <UserRound color={colors.emerald} size={36} strokeWidth={2.1} />
        </View>
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-ink">{summary.profile.displayName}</Text>
          <Text className="text-sm font-medium text-muted">{summary.profile.planLabel}</Text>
        </View>
        <Button className="w-full" label="Edit profil" onPress={() => setShowProfileForm(true)} variant="secondary" />
      </Card>

      <View className="gap-3">
        <Text className="text-base font-bold text-ink">Tampilan</Text>
        <Button
          icon={colorScheme === "dark" ? Sun : Moon}
          label={colorScheme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          onPress={toggleColorScheme}
          variant="secondary"
        />
      </View>

      <View className="gap-3">
        <Text className="text-base font-bold text-ink">Data</Text>
        <Button
          disabled={isExporting}
          icon={Download}
          label={isExporting ? "Mengekspor..." : "Ekspor data ke CSV"}
          onPress={handleExport}
          variant="secondary"
        />
        <Text className="text-xs leading-4 text-muted">
          Semua data tersimpan lokal di perangkat. Ekspor secara berkala untuk backup.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-base font-bold text-ink">Privasi</Text>
        <Button
          icon={LockKeyhole}
          label={summary.settings.securityLock ? "App lock aktif" : "Aktifkan app lock"}
          onPress={() => summary.persistSettings({ securityLock: !summary.settings.securityLock })}
          variant="secondary"
        />
        <Button
          icon={Shield}
          label={summary.settings.localPrivacyMode ? "Proteksi screenshot aktif" : "Aktifkan proteksi screenshot"}
          onPress={() => summary.persistSettings({ localPrivacyMode: !summary.settings.localPrivacyMode })}
          variant="secondary"
        />
        <Text className="text-xs leading-4 text-muted">
          App lock memakai biometrik perangkat. Proteksi screenshot menyembunyikan data di app switcher dan memblokir screen capture saat aktif.
        </Text>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink">Transaksi Berulang</Text>
          <Button 
            label="Tambah" 
            icon={Plus} 
            variant="secondary" 
            onPress={() => {
              if (summary.accounts.length === 0) {
                appAlert.show({
                  message: "Tambah rekening dulu supaya transaksi berulang punya sumber dana.",
                  title: "Belum ada rekening",
                  tone: "warning",
                });
                return;
              }
              setSelectedRecurring(null);
              setShowRecurringForm(true);
            }} 
          />
        </View>
        
        {summary.recurringTransactions.length === 0 ? (
          <Text className="text-sm text-muted">Belum ada transaksi berulang.</Text>
        ) : (
          summary.recurringTransactions.map(rtx => (
            <View key={rtx.id} className="rounded-lg border border-line bg-surface p-3 flex-row justify-between items-center">
              <View className="gap-1">
                <Text className="font-semibold text-ink">{rtx.title}</Text>
                <Text className="text-xs text-muted">Siklus: {rtx.frequency} • Tgl Eksekusi: {rtx.nextDate}</Text>
              </View>
              <Button 
                label="Edit" 
                variant="secondary" 
                onPress={() => {
                  setSelectedRecurring(rtx);
                  setShowRecurringForm(true);
                }} 
              />
            </View>
          ))
        )}
      </View>

      <View className="rounded-lg border border-line bg-surface p-4">
        <Text className="text-sm font-semibold text-ink">Tentang</Text>
        <Text className="mt-1 text-xs leading-4 text-muted">
          Keuangan v1.0 — Aplikasi pencatatan keuangan pribadi. Semua data disimpan lokal di SQLite, tidak ada data yang dikirim ke server.
        </Text>
      </View>

      <ProfileFormModal
        onClose={() => setShowProfileForm(false)}
        onSave={summary.persistProfile}
        profile={summary.profile}
        visible={showProfileForm}
      />
      <RecurringTransactionFormModal
        accounts={summary.accounts}
        transaction={selectedRecurring}
        visible={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
        onSave={summary.persistRecurringTransaction}
        onDelete={async (id: string) => {
          await summary.removeRecurringTransaction(id);
          setShowRecurringForm(false);
        }}
      />
    </ScreenShell>
  );
}
