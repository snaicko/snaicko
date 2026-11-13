import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ScrollView, Share, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Importance } from "@/components/ArticleCard";
import { Radar } from "@/components/Radar";
import { Button, Chip, Empty, IconButton, Txt } from "@/components/ui";
import { type Article, fetchArticle, fetchModels } from "@/lib/api";
import { useStore } from "@/lib/store";
import { categoryOf, colors, companyLabel, formatDate, radius, space } from "@/lib/theme";

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, isFavorite } = useStore();
  const [article, setArticle] = useState<Article | null | undefined>(() => favorites.find((f) => f.id === id));
  const [modelNames, setModelNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchArticle(id).then((a) => setArticle((prev) => a ?? prev ?? null)).catch(() => setArticle((prev) => prev ?? null));
    fetchModels().then(({ data }) => setModelNames(Object.fromEntries(data.map((m) => [m.id, m.name])))).catch(() => {});
  }, [id]);

  if (article === undefined) return <View style={styles.center}><Radar size={140} /></View>;
  if (article === null) {
    return <Empty icon="alert-circle-outline" title="Notizia non disponibile" text="Non riesco a caricarla. Controlla la connessione e riprova." />;
  }

  const cat = categoryOf(article.category);
  const tint = cat?.color ?? colors.accent;
  const saved = isFavorite(article.id);
  const company = companyLabel(article.company);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <IconButton icon="share-outline" label="Condividi"
                onPress={() => Share.share({ message: `${article.title_it ?? article.title}\n${article.url}` })} />
              <IconButton
                icon={saved ? "bookmark" : "bookmark-outline"} color={saved ? colors.accent : colors.text}
                label={saved ? "Rimuovi dai salvati" : "Salva"}
                onPress={() => {
                  toggleFavorite(article);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                }}
              />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 120, gap: space.lg }}>
        <Animated.View entering={FadeInDown.springify().damping(18)} style={{ gap: space.md }}>
          <View style={styles.row}>
            <Txt v="label" color={tint}>{cat?.label ?? "Notizia"}</Txt>
            <Importance value={article.importance ?? 1} color={tint} />
          </View>
          <Txt v="display" accessibilityRole="header">{article.title_it ?? article.title}</Txt>
          <Txt v="small" dim>{article.source} · {formatDate(article.published_at)}</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={[styles.summary, { borderLeftColor: tint }]}>
          <Txt v="label" dim>In breve</Txt>
          <Txt style={{ fontSize: 18, lineHeight: 28 }}>{article.summary_it}</Txt>
        </Animated.View>

        {(company || article.models.length > 0) && (
          <View style={styles.tags}>
            {company && <Chip label={company} icon="business-outline" />}
            {article.models.map((m) =>
              modelNames[m]
                ? <Chip key={m} label={modelNames[m]} icon="cube-outline" onPress={() => router.push(`/model/${m}`)} />
                : <Chip key={m} label={m} icon="cube-outline" />
            )}
          </View>
        )}

        <Txt v="small" dim>
          Titolo originale: “{article.title}”. Il riassunto è generato automaticamente da un modello AI e può
          contenere imprecisioni: per i dettagli leggi l’articolo della fonte.
        </Txt>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={`Leggi su ${article.source}`} icon="open-outline"
          onPress={() => WebBrowser.openBrowserAsync(article.url).catch(() => {})} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summary: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderLeftWidth: 3,
    padding: space.lg, gap: space.sm,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  cta: {
    position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line,
  },
});
