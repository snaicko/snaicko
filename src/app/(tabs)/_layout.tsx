import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type IconName, Txt } from "@/components/ui";
import { colors, fonts, radius } from "@/lib/theme";

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Radar", icon: "radio-outline" },
  models: { label: "Modelli", icon: "cube-outline" },
  chat: { label: "Chiedi", icon: "sparkles-outline" },
  saved: { label: "Salvati", icon: "bookmark-outline" },
};

function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const { label, icon } = TABS[name];
  const pill = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0),
    transform: [{ scale: withSpring(focused ? 1 : 0.6, { damping: 16 }) }],
  }));
  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={[styles.pill, pill]} />
      <Ionicons name={icon} size={22} color={focused ? colors.onAccent : colors.dim} />
      <Txt v="small" maxFontSizeMultiplier={1.2} color={focused ? colors.onAccent : colors.dim}
        style={{ fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={({ state, navigateToTab }) => (
        <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
          <View style={styles.bar}>
            {state.routes.filter((r) => TABS[r.name]).map((route) => {
              const focused = state.routes[state.index].key === route.key;
              return (
                <TabItem
                  key={route.key}
                  name={route.name}
                  focused={focused}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    if (!focused) navigateToTab(route.key);
                  }}
                />
              );
            })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="models" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="saved" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.line, padding: 6,
  },
  item: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2 },
  pill: { ...StyleSheet.absoluteFill, backgroundColor: colors.accent, borderRadius: radius.pill },
});
