import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { Article } from "@/lib/api";
import { categoryOf, colors, fonts, radius, space, timeAgo } from "@/lib/theme";

import { Tap, Txt } from "./ui";

/** Indicatore di importanza 1-5: cinque tacche, come l'eco di un radar. */
export function Importance({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.meter} accessible accessibilityLabel={`Importanza ${value} su 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.tick, { height: 4 + i * 2.5, backgroundColor: i <= value ? color : colors.line }]} />
      ))}
    </View>
  );
}

export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  const cat = categoryOf(article.category);
  const tint = cat?.color ?? colors.accent;
  const hot = (article.importance ?? 0) >= 4;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).springify().damping(18)}>
      <Tap
        onPress={() => router.push(`/article/${article.id}`)}
        label={`${article.title_it ?? article.title}. ${article.source}, ${timeAgo(article.published_at)}`}
        accessibilityHint="Apre il riassunto"
      >
        <LinearGradient
          colors={[`${tint}${hot ? "30" : "14"}`, colors.surface]}
          start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 0.9 }}
          style={[styles.card, hot && { borderColor: `${tint}66` }]}
        >
          <View style={styles.row}>
            <Txt v="label" color={tint}>{cat?.label ?? "Notizia"}</Txt>
            <Importance value={article.importance ?? 1} color={tint} />
          </View>
          <Txt v={hot ? "title" : "heading"}>{article.title_it ?? article.title}</Txt>
          {!!article.summary_it && <Txt dim numberOfLines={hot ? 4 : 3}>{article.summary_it}</Txt>}
          <Txt v="small" dim style={{ fontFamily: fonts.medium }}>
            {article.source} · {timeAgo(article.published_at)}
          </Txt>
        </LinearGradient>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm,
    marginHorizontal: space.lg, marginBottom: space.md, overflow: "hidden",
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meter: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  tick: { width: 4, borderRadius: 2 },
});
