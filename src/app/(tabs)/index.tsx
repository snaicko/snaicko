import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArticleCard } from "@/components/ArticleCard";
import { Radar } from "@/components/Radar";
import { Banner, Button, Chip, Empty, IconButton, Txt } from "@/components/ui";
import { type Article, configured, FEED_PAGE, fetchFeed, type FeedFilter } from "@/lib/api";
import { useStore } from "@/lib/store";
import { CATEGORIES, colors, space } from "@/lib/theme";

export default function Feed() {
  const insets = useSafeAreaInsets();
  const { prefs } = useStore();
  const hasInterests = prefs.companies.length + prefs.topics.length > 0;
  const [tab, setTab] = useState<string>(hasInterests ? "foryou" : "all");
  const [items, setItems] = useState<Article[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [more, setMore] = useState(true);
  const busy = useRef(false);

  const filterFor = useCallback((): FeedFilter => {
    if (tab === "foryou") return { companies: prefs.companies, categories: prefs.topics };
    if (tab === "all") return {};
    return { categories: [tab] };
  }, [tab, prefs.companies, prefs.topics]);

  const load = useCallback(async (mode: "reset" | "more") => {
    if (busy.current) return;
    busy.current = true;
    try {
      const before = mode === "more" ? items[items.length - 1]?.published_at : undefined;
      const { data, offline: off } = await fetchFeed({ ...filterFor(), before }, `airadar:feed:${tab}`);
      setItems((prev) => (mode === "more" ? [...prev, ...data] : data));
      setOffline(off);
      setMore(!off && data.length === FEED_PAGE);
      setStatus("ready");
    } catch {
      if (mode === "reset") setStatus("error");
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [filterFor, items, tab]);

  useEffect(() => {
    setStatus("loading");
    setItems([]);
    load("reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, prefs.companies, prefs.topics]);

  const chips = [
    ...(hasInterests ? [{ id: "foryou", label: "Per te", color: colors.accent }] : []),
    { id: "all", label: "Tutte", color: colors.accent },
    ...CATEGORIES,
  ];

  return (
    <View style={{ flex: 1, paddingTop: insets.top + space.sm }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Txt v="label" color={colors.accent}>
            {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </Txt>
          <Txt v="display" accessibilityRole="header">AI Radar</Txt>
        </View>
        <IconButton icon="options-outline" label="Impostazioni" onPress={() => router.push("/settings")} />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((c) => (
            <Chip key={c.id} label={c.label} color={c.color} selected={tab === c.id} onPress={() => setTab(c.id)} />
          ))}
        </ScrollView>
      </View>

      {offline && <Banner text="Sei offline: ti mostro le ultime notizie salvate." />}

      {status === "loading" ? (
        <View style={styles.center}><Radar size={160} /></View>
      ) : status === "error" ? (
        <Empty
          icon="cloud-offline-outline"
          title={configured ? "Nessuna connessione" : "Backend non configurato"}
          text={configured
            ? "Non riesco a raggiungere il radar. Controlla la rete e riprova."
            : "Imposta EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (vedi SETUP.md)."}
        >
          <Button label="Riprova" icon="refresh" kind="ghost" onPress={() => { setStatus("loading"); load("reset"); }} />
        </Empty>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={({ item, index }) => <ArticleCard article={item} index={index} />}
          contentContainerStyle={{ paddingTop: space.sm, paddingBottom: space.xl, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={colors.accent}
              onRefresh={() => { setRefreshing(true); load("reset"); }} />
          }
          onEndReachedThreshold={0.6}
          onEndReached={() => { if (more) load("more"); }}
          ListFooterComponent={more ? <ActivityIndicator color={colors.accent} style={{ margin: space.lg }} /> : undefined}
          ListEmptyComponent={
            <Empty icon="radio-outline" title="Radar silenzioso"
              text="Nessuna notizia per questo filtro, per ora. Tira giù per aggiornare." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: space.lg, marginBottom: space.md },
  chips: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
