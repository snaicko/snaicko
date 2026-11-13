import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming,
} from "react-native-reanimated";

import { colors } from "@/lib/theme";

function Ring({ size, delay }: { size: number; delay: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1));
  }, [delay, reduced, t]);
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 0.35 : 0.7 * (1 - t.value),
    transform: [{ scale: reduced ? 1 : 0.25 + t.value * 0.75 }],
  }));
  return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, style]} />;
}

/** Radar animato: anelli che si espandono da un punto. Decorativo, nascosto a VoiceOver. */
export function Radar({ size = 220 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ring size={size} delay={0} />
      <Ring size={size} delay={800} />
      <Ring size={size} delay={1600} />
      <View style={[styles.dot, { width: size * 0.12, height: size * 0.12, borderRadius: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: "absolute", borderWidth: 2, borderColor: colors.accent },
  dot: { backgroundColor: colors.accent },
});
