import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { background, cornerRadius, font, foregroundStyle, frame, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type BudgetPulseWidgetProps = {
  dailyStatus: string;
  progress: number;
  remainingBudget: string;
  todaySpent: string;
};

function BudgetPulseWidget(props: BudgetPulseWidgetProps, environment: WidgetEnvironment) {
  "widget";

  const compact = environment.widgetFamily === "systemSmall";
  const progress = Math.max(0.08, Math.min(props.progress, 1));
  const accent = props.progress > 1 ? "#D96F57" : "#1F8A5B";

  return (
    <VStack
      modifiers={[
        background("#17211B"),
        padding({ all: compact ? 14 : 18 }),
        frame({ maxHeight: Infinity, maxWidth: Infinity, alignment: "topLeading" }),
      ]}
    >
      <Text modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle("#DDF4E6")]}>
        {props.dailyStatus}
      </Text>
      <Text modifiers={[font({ size: compact ? 21 : 26, weight: "bold" }), foregroundStyle("#FFFFFF")]}>
        {props.remainingBudget}
      </Text>
      {!compact ? (
        <Text modifiers={[font({ size: 12, weight: "medium" }), foregroundStyle("#B7C4B9")]}>
          Hari ini: {props.todaySpent}
        </Text>
      ) : null}
      <Spacer />
      <HStack modifiers={[background("#FFFFFF22"), cornerRadius(999), frame({ height: 8, maxWidth: Infinity })]}>
        <HStack modifiers={[background(accent), cornerRadius(999), frame({ height: 8, width: progress * 120 })]}>
          <Spacer />
        </HStack>
      </HStack>
    </VStack>
  );
}

export default createWidget<BudgetPulseWidgetProps>("BudgetPulseWidget", BudgetPulseWidget);
