import { StyleSheet, View } from "react-native";

import { CATEGORIES, COMPANIES, colors, space } from "@/lib/theme";

import { Chip, type IconName, Txt } from "./ui";

const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Selezione di aziende e temi seguiti, usata in onboarding e impostazioni. */
export function Interests({ companies, topics, onChange }: {
  companies: string[]; topics: string[];
  onChange: (patch: { companies?: string[]; topics?: string[] }) => void;
}) {
  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.group}>
        <Txt v="label" dim>Aziende</Txt>
        <View style={styles.wrap}>
          {COMPANIES.map((c) => (
            <Chip key={c.id} label={c.label} selected={companies.includes(c.id)}
              onPress={() => onChange({ companies: flip(companies, c.id) })} />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Txt v="label" dim>Temi</Txt>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} color={c.color} icon={c.icon as IconName} selected={topics.includes(c.id)}
              onPress={() => onChange({ topics: flip(topics, c.id) })} />
          ))}
        </View>
      </View>
      <Txt v="small" dim color={colors.dim}>Se non scegli nulla, segui tutto.</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
