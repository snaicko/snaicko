import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Interests } from "@/components/Interests";
import { Radar } from "@/components/Radar";
import { Button, type IconName, Tap, Txt } from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, radius, space } from "@/lib/theme";

function Step({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? 28 : 8, { damping: 16 }),
    backgroundColor: active ? colors.accent : colors.line,
  }));
  return <Animated.View style={[styles.step, style]} />;
}

function Toggle({ icon, title, text, value, onChange }:
  { icon: IconName; title: string; text: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Tap onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }}
      label={`${title}. ${text}`} style={[styles.toggle, value && { borderColor: colors.accent }]}>
      <Ionicons name={icon} size={24} color={value ? colors.accent : colors.dim} />
      <View style={{ flex: 1 }}>
        <Txt v="heading">{title}</Txt>
        <Txt v="small" dim>{text}</Txt>
      </View>
      <Ionicons name={value ? "checkmark-circle" : "ellipse-outline"} size={26} color={value ? colors.accent : colors.line} />
    </Tap>
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setPrefs } = useStore();
  const [step, setStep] = useState(0);
  const [companies, setCompanies] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [alerts, setAlerts] = useState(true);
  const [digest, setDigest] = useState(true);

  const finish = () => setPrefs({ onboarded: true, companies, topics, alerts, digest }, { askPush: alerts || digest });

  return (
    <View style={{ flex: 1, paddingTop: insets.top + space.lg, paddingBottom: Math.max(insets.bottom, space.lg) }}>
      <View style={styles.steps} accessible accessibilityLabel={`Passo ${step + 1} di 3`}>
        {[0, 1, 2].map((i) => <Step key={i} active={i === step} />)}
      </View>

      <Animated.View key={step} entering={FadeInRight.springify().damping(20)} exiting={FadeOutLeft.duration(150)} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.page}>
          {step === 0 && (
            <>
              <View style={{ alignItems: "center", marginVertical: space.xl }}><Radar size={230} /></View>
              <Txt v="display" accessibilityRole="header">Tutto ciò che si muove nell’AI, in tre righe.</Txt>
              <Txt dim>
                AI Radar raccoglie le novità dalle fonti ufficiali, le riassume in italiano e ti dice quanto contano.
                Niente account, niente rumore.
              </Txt>
            </>
          )}
          {step === 1 && (
            <>
              <Txt v="display" accessibilityRole="header">Cosa vuoi tenere d’occhio?</Txt>
              <Txt dim>Lo usiamo per la sezione “Per te” e per le notifiche. Puoi cambiarlo quando vuoi.</Txt>
              <Interests companies={companies} topics={topics}
                onChange={(p) => { if (p.companies) setCompanies(p.companies); if (p.topics) setTopics(p.topics); }} />
            </>
          )}
          {step === 2 && (
            <>
              <Txt v="display" accessibilityRole="header">Ti avviso solo quando serve.</Txt>
              <Txt dim>Scegli tu. Se attivi almeno una voce, iOS ti chiederà il permesso per le notifiche.</Txt>
              <Toggle icon="flash-outline" title="Alert immediati" value={alerts} onChange={setAlerts}
                text="Solo per le notizie ad alta importanza sui temi che segui." />
              <Toggle icon="sunny-outline" title="Digest giornaliero" value={digest} onChange={setDigest}
                text="Una notifica al mattino con le tre notizie principali." />
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        {step > 0 && <Button label="Indietro" kind="ghost" onPress={() => setStep(step - 1)} />}
        <View style={{ flex: 1 }}>
          <Button label={step === 2 ? "Inizia" : "Avanti"} icon="arrow-forward"
            onPress={() => (step === 2 ? finish() : setStep(step + 1))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", gap: 6, paddingHorizontal: space.xl },
  step: { height: 8, borderRadius: 4 },
  page: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: "flex-end" },
  footer: { flexDirection: "row", gap: space.md, paddingHorizontal: space.xl, paddingTop: space.md },
  toggle: {
    flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
  },
});
