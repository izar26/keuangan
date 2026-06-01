import { Tabs } from "expo-router";
import { ChartNoAxesColumnIncreasing, House, ReceiptText, Target, UserRound } from "lucide-react-native";

import { colors } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ringkasan",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.3} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transaksi",
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} strokeWidth={2.3} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} strokeWidth={2.3} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insight",
          tabBarIcon: ({ color, size }) => <ChartNoAxesColumnIncreasing color={color} size={size} strokeWidth={2.3} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2.3} />,
        }}
      />
    </Tabs>
  );
}
