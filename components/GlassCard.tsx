// components/GlassCard.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import LinearGradient from "react-native-linear-gradient";

export default function GlassCard({ children, intensity = 50 }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.05)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  content: {
    padding: 20,
  },
});
