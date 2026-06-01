import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { cn } from "@/lib/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

type AppAlertButton = {
  label: string;
  style?: "default" | "cancel" | "destructive";
  value?: string;
};

type AppAlertOptions = {
  buttons?: AppAlertButton[];
  message?: string;
  title: string;
  tone?: AlertTone;
};

type AppAlertContextValue = {
  confirm: (options: Omit<AppAlertOptions, "buttons"> & { confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
  show: (options: AppAlertOptions) => Promise<string | undefined>;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

const toneMeta: Record<AlertTone, { icon: typeof Info; iconColor: string; softClass: string }> = {
  danger: { icon: ShieldAlert, iconColor: colors.coral, softClass: "bg-coral/10" },
  info: { icon: Info, iconColor: colors.sky, softClass: "bg-sky/10" },
  success: { icon: CheckCircle2, iconColor: colors.emerald, softClass: "bg-mint" },
  warning: { icon: AlertTriangle, iconColor: colors.amber, softClass: "bg-amber/15" },
};

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [current, setCurrent] = useState<AppAlertOptions | null>(null);
  const resolverRef = useRef<((value: string | undefined) => void) | null>(null);

  const close = useCallback((value?: string) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setCurrent(null);
  }, []);

  const show = useCallback((options: AppAlertOptions) => {
    Haptics.notificationAsync(options.tone === "danger" ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );

    return new Promise<string | undefined>((resolve) => {
      resolverRef.current?.(undefined);
      resolverRef.current = resolve;
      setCurrent({
        tone: "info",
        ...options,
        buttons: options.buttons?.length ? options.buttons : [{ label: "Oke", value: "ok" }],
      });
    });
  }, []);

  const confirm = useCallback<AppAlertContextValue["confirm"]>(
    async ({ cancelLabel = "Batal", confirmLabel = "Lanjut", ...options }) => {
      const value = await show({
        ...options,
        buttons: [
          { label: cancelLabel, style: "cancel", value: "cancel" },
          { label: confirmLabel, style: options.tone === "danger" ? "destructive" : "default", value: "confirm" },
        ],
      });

      return value === "confirm";
    },
    [show],
  );

  const contextValue = useMemo(() => ({ confirm, show }), [confirm, show]);
  const tone = current?.tone ?? "info";
  const meta = toneMeta[tone];
  const Icon = meta.icon;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <Modal animationType="fade" onRequestClose={() => close(undefined)} transparent visible={Boolean(current)}>
        <View className="flex-1 justify-end bg-black/45 px-4 pb-6">
          <View className="gap-5 rounded-2xl border border-line bg-surface p-5">
            <View className="flex-row items-start gap-3">
              <View className={cn("h-11 w-11 items-center justify-center rounded-xl", meta.softClass)}>
                <Icon color={meta.iconColor} size={22} strokeWidth={2.4} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-lg font-bold text-ink">{current?.title}</Text>
                {current?.message ? <Text className="text-sm leading-5 text-muted">{current.message}</Text> : null}
              </View>
            </View>

            <View className="gap-2">
              {(current?.buttons ?? []).map((button) => {
                const destructive = button.style === "destructive";
                const cancel = button.style === "cancel";

                return (
                  <Pressable
                    className={cn(
                      "h-12 items-center justify-center rounded-lg border px-4",
                      destructive
                        ? "border-coral/30 bg-coral/10"
                        : cancel
                          ? "border-line bg-canvas"
                          : "border-ink bg-ink",
                    )}
                    key={`${button.label}-${button.value ?? button.label}`}
                    onPress={() => close(button.value ?? button.label)}
                  >
                    <Text className={cn("font-bold", destructive ? "text-coral" : cancel ? "text-ink" : "text-white")}>{button.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error("useAppAlert must be used inside AppAlertProvider.");
  }

  return context;
}
