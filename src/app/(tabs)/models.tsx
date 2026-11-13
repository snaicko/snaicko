import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SectionList, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useModels } from "@/components/models";
import { Radar } from "@/components/Radar";
import { Banner, Button, Empty, Tap, Txt } from "@/components/ui";
import type { ModelCard } from "@/lib/api";
import { colors, companyLabel, formatDate, radius, space } from "@/lib/theme";

export default function Models() {
  const insets = useSafeAreaInsets();
  const { models, offline, error, reload } = useModels();

  const sections = Object.entries(
    (models ?? []).reduce<Record<string, ModelCard[]>>((acc, m) => {
      (acc[m.company] ??= []).push(m);
      return acc;
    }, {}),
  ).map(([company, data]) => ({ title: companyLabel(company) ?? company, data }));

  return (
    <View style={{ flex: 1, paddingTop: insets.top + space.sm }}>
      <View style={styles.header}>
        <Txt v="display" accessibilityRole="header">Modelli</Txt>
        <Txt dim>Schede aggiornate dalle notizie, con le fonti.</Txt>
      </View>
      {offline && <Banner text="Sei offline: schede dall'ultimo aggiornamento salvato." />}
      {error ? (
        <Empty icon="cloud-offline-outline" title="Schede non disponibili" text="Controlla la connessione e riprova.">
          <Button label="Riprova" icon="refresh" kind="ghost" onPress={reload} />
        </Empty>
      ) : !models ? (
        <View style={styles.center}><Radar size={160} /></View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(m) => m.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl }}
          ListHeaderComponent={
            <View style={{ marginBottom: space.md }}>
              <Button label="Confronta due modelli" icon="git-compare-outline" onPress={() => router.push("/compare")} />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Txt v="label" color={colors.accent} style={{ marginTop: space.lg, marginBottom: space.sm }}
              accessibilityRole="header">{section.title}</Txt>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40).springify().damping(18)}>
              <Tap onPress={() => router.push(`/model/${item.id}`)} label={`${item.name}. ${item.tagline ?? ""}`}>
                <LinearGradient colors={[`${colors.violet}26`, colors.surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.card}>
                  <Txt v="title">{item.name}</Txt>
                  {!!item.tagline && <Txt dim numberOfLines={2}>{item.tagline}</Txt>}
                  <View style={styles.facts}>
                    {!!item.pricing && <Txt v="small" numberOfLines={1} style={{ flexShrink: 1 }}>{item.pricing}</Txt>}
                    <Txt v="small" dim>Agg. {formatDate(item.updated_at)}</Txt>
                  </View>
                </LinearGradient>
              </Tap>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, marginBottom: space.md, gap: space.xs },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg,
    gap: space.sm, marginBottom: space.md,
  },
  facts: { flexDirection: "row", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" },
});
