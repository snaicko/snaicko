import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArticleCard } from "@/components/ArticleCard";
import { Empty, Txt } from "@/components/ui";
import { useStore } from "@/lib/store";
import { space } from "@/lib/theme";

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { favorites } = useStore();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + space.sm }}>
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.md, gap: space.xs }}>
        <Txt v="display" accessibilityRole="header">Salvati</Txt>
        <Txt dim>Restano sul tuo dispositivo, anche offline.</Txt>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(a) => a.id}
        renderItem={({ item, index }) => <ArticleCard article={item} index={index} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: space.xl }}
        ListEmptyComponent={
          <Empty icon="bookmark-outline" title="Ancora niente"
            text="Apri una notizia e tocca il segnalibro per ritrovarla qui." />
        }
      />
    </View>
  );
}
