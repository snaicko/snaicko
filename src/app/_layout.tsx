import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold, useFonts } from "@expo-google-fonts/space-grotesk";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { StoreProvider, useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Screens() {
  const { prefs } = useStore();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Tap su una notifica: apre la notizia.
  useEffect(() => {
    const open = (r: Notifications.NotificationResponse | null) => {
      const id = r?.notification.request.content.data?.articleId;
      if (typeof id === "string") router.push(`/article/${id}`);
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={prefs.onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="article/[id]" options={{ title: "" }} />
        <Stack.Screen name="model/[id]" options={{ title: "" }} />
        <Stack.Screen name="compare" options={{ title: "Confronto" }} />
        <Stack.Screen name="settings" options={{ title: "Impostazioni" }} />
      </Stack.Protected>
      <Stack.Protected guard={!prefs.onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      </Stack.Protected>
      <Stack.Screen name="legal/[doc]" options={{ title: "" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  if (!loaded && !error) return null;
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Screens />
    </StoreProvider>
  );
}
