// SafeAppleHello.tsx
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import AppleHello from "@/components/AppleHello";

export default function SafeAppleHello({
  onAnimationComplete,
  speed = 1.8,
}: {
  onAnimationComplete: () => void;
  speed?: number;
}) {
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    // Fallback timeout - if animation doesn't complete in 8 seconds, force completion
    const fallbackTimer = setTimeout(() => {
      console.log('⏰ Animation fallback timeout - forcing completion');
      onAnimationComplete();
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [onAnimationComplete]);

  if (hasError) {
    // Simple fallback animation
    console.log('⚠️ Using fallback animation');
    useEffect(() => {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#000', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>Elmadrasa</Text>
      </View>
    );
  }

  return (
    <AppleHello
      speed={speed}
      onAnimationComplete={() => {
        console.log('✅ AppleHello completed successfully');
        onAnimationComplete();
      }}
    />
  );
}
