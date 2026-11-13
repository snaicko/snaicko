import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from "react-native";

import { Interests } from "@/components/Interests";
import { Button, type IconName, IconButton, Tap, Txt } from "@/components/ui";
import { SUPPORT_EMAIL } from "@/content/legal";
import { useStore } from "@/lib/store";
import { colors, radius, space } from "@/lib/theme";

function Row({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} style={styles.row} label={label}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Txt style={{ flex: 1 }}>{label}</Txt>
      <Ionicons name="chevron-forward" size={18} color={colors.dim} />
    </Tap>
  );
}

function SwitchRow({ label, text, value, onChange }:
  { label: string; text: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        <Txt v="small" dim>{text}</Txt>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
        trackColor={{ true: colors.accent, false: colors.line }} thumbColor={colors.text} />
    </View>
  );
}

export default function Settings() {
  const { prefs, setPrefs, wipe } = useStore();

  const confirmWipe = () =>
    Alert.alert(
      "Cancellare tutti i dati?",
      "Elimino preferiti, interessi e impostazioni da questo dispositivo e tutto ciò che il server associa a te (notifiche e contatori della chat). Non si può annullare.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Cancella", style: "destructive",
          onPress: async () => {
            try {
              await wipe();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch {
              Alert.alert("Operazione non riuscita", "Serve una connessione per cancellare anche i dati sul server. Riprova.");
            }
          },
        },
      ],
    );

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.xl }}>
      <View style={styles.section}>
        <Txt v="title" accessibilityRole="header">I tuoi interessi</Txt>
        <Interests companies={prefs.companies} topics={prefs.topics} onChange={(p) => setPrefs(p)} />
      </View>

      <View style={styles.section}>
        <Txt v="title" accessibilityRole="header">Notifiche</Txt>
        <SwitchRow label="Alert immediati" text="Solo notizie ad alta importanza sui tuoi temi."
          value={prefs.alerts} onChange={(alerts) => setPrefs({ alerts }, { askPush: alerts })} />
        <SwitchRow label="Digest giornaliero" text="Le tre notizie principali, una volta al giorno."
          value={prefs.digest} onChange={(digest) => setPrefs({ digest }, { askPush: digest })} />
        {prefs.digest && (
          <View style={styles.row}>
            <Txt style={{ flex: 1 }}>Orario del digest</Txt>
            <IconButton icon="remove" label="Un'ora prima"
              onPress={() => setPrefs({ digestHour: (prefs.digestHour + 23) % 24 })} />
            <Txt v="heading" style={{ minWidth: 56, textAlign: "center" }}
              accessibilityLabel={`Ore ${prefs.digestHour}`}>{String(prefs.digestHour).padStart(2, "0")}:00</Txt>
            <IconButton icon="add" label="Un'ora dopo"
              onPress={() => setPrefs({ digestHour: (prefs.digestHour + 1) % 24 })} />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Txt v="title" accessibilityRole="header">Informazioni</Txt>
        <Row icon="lock-closed-outline" label="Informativa sulla privacy" onPress={() => router.push("/legal/privacy")} />
        <Row icon="help-buoy-outline" label="Supporto e domande frequenti" onPress={() => router.push("/legal/support")} />
        <Row icon="mail-outline" label="Scrivici" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})} />
      </View>

      <View style={styles.section}>
        <Txt v="title" accessibilityRole="header">I tuoi dati</Txt>
        <Txt dim>Nessun account: i tuoi dati sono legati solo a questo dispositivo.</Txt>
        <Button label="Cancella i miei dati" icon="trash-outline" kind="danger" onPress={confirmWipe} />
      </View>

      <Txt v="small" dim style={{ textAlign: "center" }}>AI Radar {Constants.expoConfig?.version ?? ""}</Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  row: {
    flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 56, padding: space.lg,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
  },
});
