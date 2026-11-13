import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ArticleCard } from "@/components/ArticleCard";
import { FIELDS, MISSING, useModels } from "@/components/models";
import { Radar } from "@/components/Radar";
import { Button, Empty, type IconName, Tap, Txt } from "@/components/ui";
import { type Article, fetchRelated } from "@/lib/api";
import { colors, companyLabel, formatDate, radius, space } from "@/lib/theme";

function Bullets({ title, items, icon, color }: { title: string; items: string[]; icon: IconName; color: string }) {
  return (
    <View style={styles.block}>
      <Txt v="label" dim>{title}</Txt>
      {items.length === 0 ? <Txt dim>{MISSING}</Txt> : items.map((s) => (
        <View key={s} style={styles.bullet}>
          <Ionicons name={icon} size={18} color={color} style={{ marginTop: 3 }} />
          <Txt style={{ flex: 1 }}>{s}</Txt>
        </View>
      ))}
    </View>
  );
}

export default function ModelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { models, error } = useModels();
  const [related, setRelated] = useState<Article[]>([]);
  const model = models?.find((m) => m.id === id);

  useEffect(() => {
    fetchRelated(id).then(setRelated).catch(() => {});
  }, [id]);

  if (!models && !error) return <View style={styles.center}><Radar size={140} /></View>;
  if (!model) return <Empty icon="alert-circle-outline" title="Scheda non disponibile" text="Controlla la connessione e riprova." />;

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: space.lg, paddingBottom: space.xxl, gap: space.lg }}>
      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.pad}>
        <Txt v="label" color={colors.accent}>{companyLabel(model.company) ?? model.company}</Txt>
        <Txt v="display" accessibilityRole="header">{model.name}</Txt>
        {!!model.tagline && <Txt dim>{model.tagline}</Txt>}
        <Txt v="small" dim>Aggiornata il {formatDate(model.updated_at)}</Txt>
      </Animated.View>

      <View style={styles.pad}>
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.block}>
            <View style={styles.bullet}>
              <Ionicons name={f.icon as IconName} size={16} color={colors.dim} />
              <Txt v="label" dim>{f.label}</Txt>
            </View>
            <Txt dim={!model[f.key]}>{model[f.key] ?? MISSING}</Txt>
          </View>
        ))}
        <Bullets title="Punti di forza" items={model.strengths} icon="add-circle-outline" color={colors.accent} />
        <Bullets title="Limiti" items={model.limits} icon="remove-circle-outline" color={colors.danger} />

        <View style={styles.block}>
          <Txt v="label" dim>Fonti</Txt>
          {model.sources.map((s) => (
            <Tap key={s.url} style={styles.bullet} accessibilityRole="link" label={`Fonte: ${s.title}`}
              onPress={() => WebBrowser.openBrowserAsync(s.url).catch(() => {})}>
              <Ionicons name="link-outline" size={18} color={colors.accent} style={{ marginTop: 3 }} />
              <Txt style={{ flex: 1 }} color={colors.accent}>
                {s.title}{s.date ? ` · ${formatDate(s.date)}` : ""}
              </Txt>
            </Tap>
          ))}
        </View>

        <Button label="Confronta con un altro modello" icon="git-compare-outline" kind="ghost"
          onPress={() => router.push(`/compare?a=${model.id}`)} />
      </View>

      {related.length > 0 && (
        <View>
          <Txt v="title" style={[styles.pad, { marginBottom: space.md }]} accessibilityRole="header">Notizie collegate</Txt>
          {related.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pad: { paddingHorizontal: space.lg, gap: space.sm },
  block: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    padding: space.lg, gap: space.sm, marginBottom: space.xs,
  },
  bullet: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
});
