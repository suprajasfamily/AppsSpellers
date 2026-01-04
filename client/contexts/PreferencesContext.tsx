import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type KeyboardLayout = "abc" | "qwerty";
export type SizeOption = "small" | "medium" | "large";
export type AppMode = "keyboard" | "calculator";
export type KeySize = "small" | "medium" | "large";
export type KeySpacing = "tight" | "normal" | "wide";

export const KEY_SPACING_VALUES: Record<KeySpacing, { horizontal: number; vertical: number }> = {
  tight: { horizontal: 2, vertical: 2 },
  normal: { horizontal: 4, vertical: 4 },
  wide: { horizontal: 12, vertical: 10 },
};

export const BUTTON_COLORS = [
  { id: "blue", label: "Blue", value: "#4A90E2" },
  { id: "green", label: "Green", value: "#7ED321" },
  { id: "orange", label: "Orange", value: "#F5A623" },
  { id: "purple", label: "Purple", value: "#9B59B6" },
  { id: "pink", label: "Pink", value: "#E91E63" },
  { id: "teal", label: "Teal", value: "#00BCD4" },
  { id: "red", label: "Red", value: "#E74C3C" },
  { id: "gray", label: "Gray", value: "#95A5A6" },
];

export const SPECIAL_KEYS = {
  SPACE: "SPACE",
  ENTER: "ENTER",
  DELETE: "DELETE",
};

export const DEFAULT_ABC_KEYS = [
  "A", "B", "C", "D", "E",
  "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O",
  "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y",
  "Z", SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER,
];

export const DEFAULT_QWERTY_KEYS = [
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
  "A", "S", "D", "F", "G", "H", "J", "K", "L",
  "Z", "X", "C", "V", "B", "N", "M",
  SPECIAL_KEYS.DELETE, SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER,
];

export const ABC_ROW_SIZES = [5, 5, 5, 5, 5, 3];
export const QWERTY_ROW_SIZES = [10, 9, 7, 3];

export interface KeySizeMap {
  [key: string]: KeySize;
}

interface CustomLayouts {
  abc: string[];
  qwerty: string[];
}

interface KeySizes {
  abc: KeySizeMap;
  qwerty: KeySizeMap;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  voiceId: string | null;
}

interface Preferences {
  keyboardLayout: KeyboardLayout;
  keyboardSize: SizeOption;
  typingAreaSize: SizeOption;
  keySpacing: KeySpacing;
  displayName: string;
  avatarId: string;
  buttonColorId: string;
  customLayouts: CustomLayouts;
  keySizes: KeySizes;
  voiceSettings: VoiceSettings;
  metronomeVolume: number;
  metronomeBpm: number;
  isLoading: boolean;
}

interface PreferencesContextType extends Preferences {
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setKeyboardSize: (size: SizeOption) => void;
  setTypingAreaSize: (size: SizeOption) => void;
  setKeySpacing: (spacing: KeySpacing) => void;
  setDisplayName: (name: string) => void;
  setAvatarId: (id: string) => void;
  setButtonColorId: (id: string) => void;
  getButtonColor: () => string;
  setCustomLayout: (layout: KeyboardLayout, keys: string[]) => void;
  resetCustomLayout: (layout: KeyboardLayout) => void;
  getCustomLayout: (layout: KeyboardLayout) => string[];
  setKeySize: (layout: KeyboardLayout, key: string, size: KeySize) => void;
  getKeySize: (layout: KeyboardLayout, key: string) => KeySize;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  setMetronomeVolume: (volume: number) => void;
  setMetronomeBpm: (bpm: number) => void;
}

const defaultPreferences: Preferences = {
  keyboardLayout: "abc",
  keyboardSize: "medium",
  typingAreaSize: "small",
  keySpacing: "normal",
  displayName: "Young Writer",
  avatarId: "robot",
  buttonColorId: "blue",
  customLayouts: {
    abc: DEFAULT_ABC_KEYS,
    qwerty: DEFAULT_QWERTY_KEYS,
  },
  keySizes: {
    abc: {},
    qwerty: {},
  },
  voiceSettings: {
    rate: 0.95,
    pitch: 0.95,
    voiceId: null,
  },
  metronomeVolume: 0.5,
  metronomeBpm: 60,
  isLoading: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = "@typebuddy_preferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let customLayouts = parsed.customLayouts || {
          abc: DEFAULT_ABC_KEYS,
          qwerty: DEFAULT_QWERTY_KEYS,
        };
        if (customLayouts.abc) {
          const abcWithoutDelete = customLayouts.abc.filter((k: string) => k !== SPECIAL_KEYS.DELETE);
          if (!abcWithoutDelete.includes(SPECIAL_KEYS.SPACE) || !abcWithoutDelete.includes(SPECIAL_KEYS.ENTER)) {
            customLayouts.abc = [...abcWithoutDelete.filter((k: string) => !Object.values(SPECIAL_KEYS).includes(k)), SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER];
          } else {
            customLayouts.abc = abcWithoutDelete;
          }
        }
        if (customLayouts.qwerty && !customLayouts.qwerty.includes(SPECIAL_KEYS.SPACE)) {
          customLayouts.qwerty = [...customLayouts.qwerty.filter((k: string) => !Object.values(SPECIAL_KEYS).includes(k)), SPECIAL_KEYS.DELETE, SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER];
        }
        const keySizes = parsed.keySizes || { abc: {}, qwerty: {} };
        setPreferences({ ...defaultPreferences, ...parsed, customLayouts, keySizes, isLoading: false });
      } else {
        setPreferences({ ...defaultPreferences, isLoading: false });
      }
    } catch {
      setPreferences({ ...defaultPreferences, isLoading: false });
    }
  };

  const savePreferences = async (newPrefs: Partial<Preferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    try {
      const { isLoading, ...toSave } = updated;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
    }
  };

  const setKeyboardLayout = (layout: KeyboardLayout) => savePreferences({ keyboardLayout: layout });
  const setKeyboardSize = (size: SizeOption) => savePreferences({ keyboardSize: size });
  const setTypingAreaSize = (size: SizeOption) => savePreferences({ typingAreaSize: size });
  const setKeySpacing = (spacing: KeySpacing) => savePreferences({ keySpacing: spacing });
  const setDisplayName = (name: string) => savePreferences({ displayName: name });
  const setAvatarId = (id: string) => savePreferences({ avatarId: id });
  const setButtonColorId = (id: string) => savePreferences({ buttonColorId: id });
  
  const getButtonColor = () => {
    const color = BUTTON_COLORS.find(c => c.id === preferences.buttonColorId);
    return color ? color.value : BUTTON_COLORS[0].value;
  };

  const setCustomLayout = (layout: KeyboardLayout, keys: string[]) => {
    const newCustomLayouts = {
      ...preferences.customLayouts,
      [layout]: keys,
    };
    savePreferences({ customLayouts: newCustomLayouts });
  };

  const resetCustomLayout = (layout: KeyboardLayout) => {
    const defaultLayout = layout === "abc" ? DEFAULT_ABC_KEYS : DEFAULT_QWERTY_KEYS;
    const newCustomLayouts = {
      ...preferences.customLayouts,
      [layout]: defaultLayout,
    };
    const newKeySizes = {
      ...preferences.keySizes,
      [layout]: {},
    };
    savePreferences({ customLayouts: newCustomLayouts, keySizes: newKeySizes });
  };

  const getCustomLayout = (layout: KeyboardLayout): string[] => {
    return preferences.customLayouts[layout] || (layout === "abc" ? DEFAULT_ABC_KEYS : DEFAULT_QWERTY_KEYS);
  };

  const setKeySize = (layout: KeyboardLayout, key: string, size: KeySize) => {
    const newKeySizes = {
      ...preferences.keySizes,
      [layout]: {
        ...preferences.keySizes[layout],
        [key]: size,
      },
    };
    savePreferences({ keySizes: newKeySizes });
  };

  const getKeySize = (layout: KeyboardLayout, key: string): KeySize => {
    return preferences.keySizes[layout]?.[key] || "medium";
  };

  const setVoiceSettings = (settings: Partial<VoiceSettings>) => {
    const newVoiceSettings = {
      ...preferences.voiceSettings,
      ...settings,
    };
    savePreferences({ voiceSettings: newVoiceSettings });
  };

  const setMetronomeVolume = (volume: number) => {
    savePreferences({ metronomeVolume: Math.max(0, Math.min(1, volume)) });
  };

  const setMetronomeBpm = (bpm: number) => {
    savePreferences({ metronomeBpm: Math.max(30, Math.min(120, bpm)) });
  };

  return (
    <PreferencesContext.Provider
      value={{
        ...preferences,
        setKeyboardLayout,
        setKeyboardSize,
        setTypingAreaSize,
        setKeySpacing,
        setDisplayName,
        setAvatarId,
        setButtonColorId,
        getButtonColor,
        setCustomLayout,
        resetCustomLayout,
        getCustomLayout,
        setKeySize,
        getKeySize,
        setVoiceSettings,
        setMetronomeVolume,
        setMetronomeBpm,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
