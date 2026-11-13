import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, Tap, Txt } from "@/components/ui";
import { askChat, type ChatSource } from "@/lib/api";
import { useStore } from "@/lib/store";
import { colors, formatDate, radius, space } from "@/lib/theme";

type Msg = { role: "user" | "assistant"; content: string; sources?: ChatSource[]; unknown?: boolean };

const SUGGESTIONS = [
  "Quali novità ci sono questa settimana?",
  "Come vengono usati i miei dati dai modelli Claude?",
  "Quanto costa Claude Opus rispetto a Haiku?",
  "Ci sono notizie recenti sulla sicurezza dei modelli?",
];

const ERRORS: Record<string, string> = {
  rate_limited: "Hai raggiunto il limite di domande per oggi. Riprova domani.",
  server_error: "Non riesco a rispondere in questo momento. Controlla la connessione e riprova.",
};

function Dot({ delay }: { delay: number }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
  }, [delay, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

function SourceCard({ s }: { s: ChatSource }) {
  const open = () => {
    if (s.kind === "model") router.push(`/model/${s.id}`);
    else if (s.url) WebBrowser.openBrowserAsync(s.url).catch(() => {});
  };
  return (
    <Tap onPress={open} style={styles.source} accessibilityRole="link"
      label={`Fonte ${s.n}: ${s.title}, ${s.source}, ${formatDate(s.date)}`}>
      <Txt v="label" color={colors.accent}>[{s.n}]</Txt>
      <View style={{ flex: 1 }}>
        <Txt v="small" numberOfLines={2}>{s.title}</Txt>
        <Txt v="small" dim>{s.source} · {formatDate(s.date)}</Txt>
      </View>
      <Ionicons name={s.kind === "model" ? "cube-outline" : "open-outline"} size={16} color={colors.dim} />
    </Tap>
  );
}

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await askChat(q, history, deviceId);
      setMessages((m) => [...m, { role: "assistant", content: r.answer, sources: r.sources, unknown: r.unknown }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      const msg = ERRORS[(e as Error).message] ?? ERRORS.server_error;
      setMessages((m) => [...m, { role: "assistant", content: msg, unknown: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top + space.sm }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Txt v="display" accessibilityRole="header">Chiedi</Txt>
        <Txt dim>Rispondo solo con le notizie e le schede del radar, citando le fonti.</Txt>
      </View>

      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: space.lg, gap: space.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={{ flex: 1, justifyContent: "flex-end", gap: space.sm }}>
            <Txt v="label" dim>Prova con</Txt>
            {SUGGESTIONS.map((s) => (
              <Tap key={s} onPress={() => send(s)} style={styles.suggestion} label={s}>
                <Txt style={{ flex: 1 }}>{s}</Txt>
                <Ionicons name="arrow-up-outline" size={18} color={colors.accent} />
              </Tap>
            ))}
            <Txt v="small" dim>
              Le domande vengono inviate al nostro server ed elaborate da Claude (Anthropic) per generare la
              risposta. Non vengono salvate. Non inserire dati personali.
            </Txt>
          </View>
        )}
        {messages.map((m, i) => (
          <Animated.View key={i} entering={FadeInDown.springify().damping(18)}
            style={m.role === "user" ? styles.user : styles.bot}>
            <Txt color={m.role === "user" ? colors.onAccent : colors.text} selectable>{m.content}</Txt>
            {!!m.sources?.length && (
              <View style={{ gap: space.sm, marginTop: space.sm }}>
                <Txt v="label" dim>Fonti</Txt>
                {m.sources.map((s) => <SourceCard key={s.n} s={s} />)}
              </View>
            )}
            {m.role === "assistant" && m.unknown && !m.sources?.length && (
              <Chip label="Nessuna fonte disponibile" icon="help-circle-outline" color={colors.dim} />
            )}
          </Animated.View>
        ))}
        {busy && (
          <View style={[styles.bot, styles.typing]} accessibilityLabel="AI Radar sta cercando nelle fonti" accessible>
            <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Fai una domanda su modelli e aziende AI"
          placeholderTextColor={colors.dim}
          style={styles.input}
          multiline
          maxLength={600}
          accessibilityLabel="Domanda"
          keyboardAppearance="dark"
        />
        <Tap onPress={() => send(input)} disabled={busy || !input.trim()} label="Invia domanda"
          style={[styles.send, (busy || !input.trim()) && { opacity: 0.4 }]}>
          <Ionicons name="arrow-up" size={22} color={colors.onAccent} />
        </Tap>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, gap: space.xs },
  suggestion: {
    flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
  },
  user: {
    alignSelf: "flex-end", maxWidth: "86%", backgroundColor: colors.accent,
    borderRadius: radius.lg, borderBottomRightRadius: 6, padding: space.md,
  },
  bot: {
    alignSelf: "flex-start", maxWidth: "94%", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, borderBottomLeftRadius: 6, padding: space.md, gap: space.sm,
  },
  typing: { flexDirection: "row", gap: 6, paddingVertical: space.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  source: {
    flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md,
    backgroundColor: colors.surface2, borderRadius: radius.sm,
  },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: space.sm, padding: space.md,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  input: {
    flex: 1, minHeight: 48, maxHeight: 130, color: colors.text, fontSize: 16, lineHeight: 22,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: space.lg, paddingTop: 12, paddingBottom: 12,
  },
  send: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
});
