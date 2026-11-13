import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { type Article, configured, deleteDevice, syncDevice } from "./api";
import { getPushToken } from "./push";

const KEY = "airadar:state";

export type Prefs = {
  onboarded: boolean; companies: string[]; topics: string[];
  alerts: boolean; digest: boolean; digestHour: number;
};
type State = { deviceId: string; prefs: Prefs; favorites: Article[] };

const DEFAULT_PREFS: Prefs = {
  onboarded: false, companies: [], topics: [], alerts: false, digest: false, digestHour: 8,
};
const fresh = (): State => ({ deviceId: Crypto.randomUUID(), prefs: DEFAULT_PREFS, favorites: [] });

type Store = State & {
  ready: boolean;
  setPrefs: (patch: Partial<Prefs>, opts?: { askPush?: boolean }) => Promise<void>;
  toggleFavorite: (a: Article) => boolean;
  isFavorite: (id: string) => boolean;
  wipe: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const ref = useRef<State | null>(null);

  const commit = useCallback((next: State) => {
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as State) : null;
        commit(saved ? { ...saved, prefs: { ...DEFAULT_PREFS, ...saved.prefs } } : fresh());
      })
      .catch(() => commit(fresh()));
  }, [commit]);

  const store = useMemo<Store | null>(() => {
    if (!state) return null;
    return {
      ...state,
      ready: true,
      setPrefs: async (patch, opts) => {
        const cur = ref.current!;
        const prefs = { ...cur.prefs, ...patch };
        commit({ ...cur, prefs });
        // Il server conosce il dispositivo solo se l'utente attiva le notifiche.
        if (!configured || !(prefs.alerts || prefs.digest || patch.alerts === false || patch.digest === false)) return;
        const token = await getPushToken(!!opts?.askPush);
        await syncDevice(cur.deviceId, token, prefs).catch(() => {});
      },
      toggleFavorite: (a) => {
        const cur = ref.current!;
        const has = cur.favorites.some((f) => f.id === a.id);
        commit({ ...cur, favorites: has ? cur.favorites.filter((f) => f.id !== a.id) : [a, ...cur.favorites] });
        return !has;
      },
      isFavorite: (id) => state.favorites.some((f) => f.id === id),
      wipe: async () => {
        const cur = ref.current!;
        if (configured) await deleteDevice(cur.deviceId);
        await AsyncStorage.clear();
        commit(fresh());
      },
    };
  }, [state, commit]);

  if (!store) return null;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider mancante");
  return s;
};
