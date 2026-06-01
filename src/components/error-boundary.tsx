import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F7F8F3",
            paddingHorizontal: 32,
            gap: 16,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#FDEAEA",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>⚠️</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#17211B", textAlign: "center" }}>
            Terjadi kesalahan
          </Text>
          <Text
            style={{ fontSize: 14, color: "#667267", textAlign: "center", lineHeight: 20 }}
            selectable
          >
            {this.state.error.message || "Aplikasi mengalami masalah yang tidak terduga."}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              marginTop: 8,
              height: 48,
              paddingHorizontal: 24,
              backgroundColor: "#17211B",
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 15 }}>Coba lagi</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
