import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, StyleSheet, Text, type TextProps, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { colors, fonts, radius, space } from "@/lib/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

const VARIANTS = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: "uppercase" },
} as const;

/** Testo dell'app: segue il Dynamic Type di iOS, con un tetto per non rompere i layout. */
export function Txt({ v = "body", dim, color, style, ...rest }:
  TextProps & { v?: keyof typeof VARIANTS; dim?: boolean; color?: string }) {
  return (
    <Text
      maxFontSizeMultiplier={v === "display" ? 1.4 : 2}
      {...rest}
      style={[{ color: color ?? (dim ? colors.dim : colors.text) }, VARIANTS[v], style]}
    />
  );
}

const APressable = Animated.createAnimatedComponent(Pressable);

/** Pressable con micro-animazione a molla e feedback aptico. */
export function Tap({ children, style, onPress, haptic = "light", label, ...rest }:
  Omit<PressableProps, "style" | "children"> & {
    children: ReactNode; style?: StyleProp<ViewStyle>; haptic?: "light" | "medium" | "none"; label?: string;
  }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <APressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...rest}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 420 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 320 }); }}
      onPress={(e) => {
        if (haptic !== "none") {
          Haptics.impactAsync(haptic === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
}

export function Chip({ label, selected, onPress, color = colors.accent, icon }:
  { label: string; selected?: boolean; onPress?: () => void; color?: string; icon?: IconName }) {
  const body = (
    <View style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}>
      {icon && <Ionicons name={icon} size={15} color={selected ? colors.onAccent : color} />}
      <Txt v="small" style={{ fontFamily: fonts.medium }} color={selected ? colors.onAccent : colors.text}>{label}</Txt>
    </View>
  );
  if (!onPress) return body;
  return (
    <Tap onPress={onPress} label={label} accessibilityState={{ selected: !!selected }}>{body}</Tap>
  );
}

export function Button({ label, onPress, icon, kind = "primary", disabled }:
  { label: string; onPress: () => void; icon?: IconName; kind?: "primary" | "ghost" | "danger"; disabled?: boolean }) {
  const fg = kind === "primary" ? colors.onAccent : kind === "danger" ? colors.danger : colors.text;
  return (
    <Tap onPress={onPress} haptic="medium" disabled={disabled} label={label}
      style={[styles.button, kind === "primary" ? { backgroundColor: colors.accent } : styles.buttonGhost,
        kind === "danger" && { borderColor: colors.danger }, disabled && { opacity: 0.4 }]}>
      {icon && <Ionicons name={icon} size={19} color={fg} />}
      <Txt v="heading" color={fg}>{label}</Txt>
    </Tap>
  );
}

export function IconButton({ icon, onPress, label, color = colors.text }:
  { icon: IconName; onPress: () => void; label: string; color?: string }) {
  return (
    <Tap onPress={onPress} label={label} style={styles.iconButton}>
      <Ionicons name={icon} size={21} color={color} />
    </Tap>
  );
}

export function Empty({ icon, title, text, children }:
  { icon: IconName; title: string; text: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={colors.accent} />
      <Txt v="title" style={{ textAlign: "center" }}>{title}</Txt>
      <Txt dim style={{ textAlign: "center" }}>{text}</Txt>
      {children}
    </View>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.onAccent} />
      <Txt v="small" color={colors.onAccent} style={{ flex: 1, fontFamily: fonts.medium }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, minHeight: 38, paddingHorizontal: 14,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface,
  },
  button: {
    minHeight: 56, borderRadius: radius.pill, paddingHorizontal: space.xl,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm,
  },
  buttonGhost: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  iconButton: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.xxl },
  banner: {
    flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: "#FFC53D",
    marginHorizontal: space.lg, marginBottom: space.sm, padding: space.md, borderRadius: radius.sm,
  },
});
