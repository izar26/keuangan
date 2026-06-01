import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { LockKeyhole, ShieldCheck } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { useFinanceSummary } from "@/hooks/use-finance-summary";

type PrivacyState = "checking" | "locked" | "unlocked";

export function PrivacyGate({ children }: PropsWithChildren) {
  const summary = useFinanceSummary();
  const privacyEnabled = summary.settings.localPrivacyMode || summary.settings.securityLock;
  const [state, setState] = useState<PrivacyState>("checking");
  const [message, setMessage] = useState("Mengamankan data lokal...");

  useEffect(() => {
    if (!privacyEnabled) {
      return;
    }

    ScreenCapture.preventScreenCaptureAsync("keuangan-private").catch(() => undefined);
    ScreenCapture.enableAppSwitcherProtectionAsync(0.72).catch(() => undefined);

    return () => {
      ScreenCapture.allowScreenCaptureAsync("keuangan-private").catch(() => undefined);
      ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, [privacyEnabled]);

  const unlock = useCallback(async () => {
    if (!privacyEnabled || !summary.settings.securityLock) {
      setState("unlocked");
      return;
    }

    setState("checking");
    setMessage("Mengecek biometrik perangkat...");

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware || !isEnrolled) {
        setState("unlocked");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        biometricsSecurityLevel: "strong",
        cancelLabel: "Nanti",
        fallbackLabel: "Pakai passcode",
        promptMessage: "Buka Keuangan",
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState("unlocked");
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setMessage("Autentikasi dibatalkan. Tap untuk coba lagi.");
      setState("locked");
    } catch {
      setState("unlocked");
    }
  }, [privacyEnabled, summary.settings.securityLock]);

  useEffect(() => {
    if (!summary.isLoading) {
      unlock();
    }
  }, [summary.isLoading, unlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (!privacyEnabled || !summary.settings.securityLock) {
        return;
      }

      if (nextState !== "active") {
        setState("locked");
        setMessage("Aplikasi dikunci otomatis.");
      } else if (state === "locked") {
        unlock();
      }
    });

    return () => subscription.remove();
  }, [privacyEnabled, state, summary.settings.securityLock, unlock]);

  if (!privacyEnabled || state === "unlocked") {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 items-center justify-center gap-5 bg-canvas px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-mint">
        {state === "checking" ? (
          <ShieldCheck color={colors.emerald} size={30} strokeWidth={2.3} />
        ) : (
          <LockKeyhole color={colors.emerald} size={30} strokeWidth={2.3} />
        )}
      </View>
      <View className="items-center gap-2">
        <Text className="text-xl font-bold text-ink">Data finansial terkunci</Text>
        <Text className="text-center text-sm leading-5 text-muted">{message}</Text>
      </View>
      <Pressable className="rounded-lg bg-ink px-5 py-3" onPress={unlock}>
        <Text className="font-bold text-white">{state === "checking" ? "Membuka..." : "Buka aplikasi"}</Text>
      </Pressable>
    </View>
  );
}
