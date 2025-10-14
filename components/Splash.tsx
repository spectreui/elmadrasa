import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Example paths for letters H E L L O (simplified, you can adjust)
const LETTER_PATHS = [
  "M10 80 L10 10 L30 10 L30 80", // H
  "M40 10 L70 10 L70 40 L40 40 L70 40 L70 80 L40 80", // E
  "M80 80 L80 10 L100 10 L100 80", // L
  "M110 80 L110 10 L130 10 L130 80", // L
  "M140 80 L140 10 L170 10 L170 40 L170 10 L190 10 L190 80", // O
];

export default function Splash({ onFinish }: { onFinish: () => void }) {
  const animations = useRef(LETTER_PATHS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate each letter stroke sequentially
    const sequence = LETTER_PATHS.map((_, i) =>
      Animated.timing(animations[i], {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    );

    Animated.stagger(300, sequence).start(() => {
      // Hold briefly then fade out entire splash
      setTimeout(onFinish, 1000);
    });
  }, []);

  return (
    <View style={styles.container}>
      {LETTER_PATHS.map((d, i) => (
        <Svg key={i} height="100" width="60" style={{ marginHorizontal: 2 }}>
          <AnimatedPath
            d={d}
            stroke="#fff"
            strokeWidth={4}
            strokeDasharray={100}
            strokeDashoffset={animations[i].interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            })}
          />
        </Svg>
      ))}
    </View>
  );
}

// Animated version of Path
const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width,
    height,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    zIndex: 1000,
  },
});
