import "@/styles/global.css";

import { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/error-boundary";
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
      <SafeAreaProvider>
        <ErrorBoundary>
          <Suspense fallback={<DatabaseFallback />}>
            <SQLiteProvider databaseName="keuangan.db" onInit={migrateDatabase} useSuspense>
              <StatusBar style="dark" />
              <Stack screenOptions={{ contentStyle: { backgroundColor: "#F7F8F3" }, headerShown: false }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </SQLiteProvider>
          </Suspense>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

