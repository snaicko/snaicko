import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { FIELDS, MISSING, useModels } from "@/components/models";
import { Radar } from "@/components/Radar";
import { Chip, Empty, Txt } from "@/components/ui";
import type { ModelCard } from "@/lib/api";
import { colors, formatDate, radius, space } from "@/lib/theme";

const SIDES = [colors.accent, colors.violet];

function Cell({ children, missing }: { children: string; missing?: boolean }) {
  return <Txt v="small" dim={missing} style={styles.cell}>{children}</Txt>;
}

export default function Compare() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { models, error } = useModels();
  const [picked, setPicked] = useState<string[]>([params.a, params.b].filter((x): x is string => !!x));

  if (error) return <Empty icon="cloud-offline-outline" title="Schede non disponibili" text="Controlla la connessione e riprova." />;
  if (!models) return <View style={styles.center}><Radar size={140} /></View>;

  // Tocca per scegliere; con due già scelti, il nuovo sostituisce il più vecchio.
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));
  const pair = picked.map((id) => models.find((m) => m.id === id)).filter((m): m is ModelCard => !!m);

  const rows: { label: string; values: (string | null)[] }[] = pair.length === 2 ? [
    ...FIELDS.map((f) => ({ label: f.label, values: pair.map((m) => m[f.key]) })),
    { label: "Punti di forza", values: pair.map((m) => (m.strengths.length ? m.strengths.map((s) => `+ ${s}`).join("\n") : null)) },
    { label: "Limiti", values: pair.map((m) => (m.limits.length ? m.limits.map((s) => `– ${s}`).join("\n") : null)) },
    { label: "Aggiornata il", values: pair.map((m) => formatDate(m.updated_at)) },
  ] : [];

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.lg }}>
      <Txt dim>Scegli due modelli.</Txt>
      <View style={styles.chips}>
        {models.map((m) => {
          const i = picked.indexOf(m.id);
          return <Chip key={m.id} label={m.name} selected={i >= 0} color={SIDES[i] ?? colors.accent} onPress={() => toggle(m.id)} />;
        })}
      </View>

      {pair.length === 2 && (
        <Animated.View entering={FadeIn} style={{ gap: space.md }}>
          <View style={styles.row}>
            {pair.map((m, i) => (
              <View key={m.id} style={[styles.head, { borderTopColor: SIDES[i] }]}>
                <Txt v="heading" accessibilityRole="header">{m.name}</Txt>
              </View>
            ))}
          </View>
          {rows.map((r) => (
            <View key={r.label} style={styles.block}
              accessible accessibilityLabel={`${r.label}. ${pair[0].name}: ${r.values[0] ?? MISSING}. ${pair[1].name}: ${r.values[1] ?? MISSING}.`}>
              <Txt v="label" dim>{r.label}</Txt>
              <View style={styles.row}>
                {r.values.map((v, i) => <Cell key={i} missing={!v}>{v ?? MISSING}</Cell>)}
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { flexDirection: "row", gap: space.md },
  head: { flex: 1, borderTopWidth: 3, paddingTop: space.sm },
  cell: { flex: 1, fontSize: 14, lineHeight: 20 },
  block: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    padding: space.md, gap: space.sm,
  },
});
