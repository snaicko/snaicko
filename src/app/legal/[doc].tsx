import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { Txt } from "@/components/ui";
import { privacy, support } from "@/content/legal";
import { space } from "@/lib/theme";

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = doc === "support" ? support : privacy;
  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.lg }}>
      <Txt v="display" accessibilityRole="header">{d.title}</Txt>
      <Txt dim selectable>{d.intro}</Txt>
      {d.sections.map((s) => (
        <View key={s.h} style={{ gap: space.sm }}>
          <Txt v="heading" accessibilityRole="header">{s.h}</Txt>
          {s.p.map((p) => <Txt key={p} dim selectable>{p}</Txt>)}
        </View>
      ))}
    </ScrollView>
  );
}
