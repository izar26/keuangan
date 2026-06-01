import "@/styles/global.css";

import { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/error-boundary";
import { PrivacyGate } from "@/components/privacy-gate";
import { AppAlertProvider } from "@/components/ui/app-alert";
import { migrateDatabase } from "@/db/schema";

function DatabaseFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Text className="text-base font-semibold text-ink">Menyiapkan data lokal...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <Suspense fallback={<DatabaseFallback />}>
              <SQLiteProvider databaseName="keuangan.db" onInit={migrateDatabase} useSuspense>
                <AppAlertProvider>
                  <PrivacyGate>
                    <StatusBar style="dark" />
                    <Stack screenOptions={{ contentStyle: { backgroundColor: "#F7F8F3" }, headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                  </PrivacyGate>
                </AppAlertProvider>
              </SQLiteProvider>
            </Suspense>
          </ErrorBoundary>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
