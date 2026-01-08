import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type KeyboardLayout = "abc" | "qwerty" | "grid";
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
  { id: "soft-blue", label: "Soft Blue", value: "#A8C5E2", textColor: "#000000" },
  { id: "mint", label: "Mint", value: "#B8E0D2", textColor: "#000000" },
  { id: "peach", label: "Peach", value: "#F5D5C8", textColor: "#000000" },
  { id: "lavender", label: "Lavender", value: "#D4C5E2", textColor: "#000000" },
  { id: "blush", label: "Blush", value: "#F2D1D9", textColor: "#000000" },
  { id: "sage", label: "Sage", value: "#C5D5C5", textColor: "#000000" },
  { id: "cream", label: "Cream", value: "#F5ECD7", textColor: "#000000" },
  { id: "cloud", label: "Cloud", value: "#E8E8E8", textColor: "#000000" },
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
  "Z", ".", SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER,
];

export const DEFAULT_QWERTY_KEYS = [
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
  "A", "S", "D", "F", "G", "H", "J", "K", "L",
  "Z", "X", "C", "V", "B", "N", "M",
  SPECIAL_KEYS.DELETE, ".", SPECIAL_KEYS.SPACE, SPECIAL_KEYS.ENTER,
];

export const ABC_ROW_SIZES = [5, 5, 5, 5, 5, 4];
export const QWERTY_ROW_SIZES = [10, 9, 7, 4];

export const DEFAULT_GRID_KEYS = [
  "A", "B", "C", "D", "E", SPECIAL_KEYS.DELETE,
  "F", "G", "H", "I", "J", ",",
  "K", "L", "M", "N", "O", "!",
  "P", "Q", "R", "S", "T", "?", ".",
  "U", "V", "W", "X", "Y", "Z", SPECIAL_KEYS.ENTER,
];

export const GRID_ROW_SIZES = [6, 6, 6, 7, 7];

export interface KeySizeMap {
  [key: string]: KeySize;
}

interface CustomLayouts {
  abc: string[];
  qwerty: string[];
  grid: string[];
}

interface KeySizes {
  abc: KeySizeMap;
  qwerty: KeySizeMap;
  grid: KeySizeMap;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  voiceId: string | null;
  speakLettersOnType: boolean;
  speakSentencesOnComplete: boolean;
  sayAndAfterLetters: boolean;
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
  getButtonTextColor: () => string;
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
  buttonColorId: "soft-blue",
  customLayouts: {
    abc: DEFAULT_ABC_KEYS,
    qwerty: DEFAULT_QWERTY_KEYS,
    grid: DEFAULT_GRID_KEYS,
  },
  keySizes: {
    abc: {},
    qwerty: {},
    grid: {},
  },
  voiceSettings: {
    rate: 1.0,
    pitch: 1.0,
    voiceId: null,
    speakLettersOnType: false,
    speakSentencesOnComplete: false,
    sayAndAfterLetters: false,
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
          grid: DEFAULT_GRID_KEYS,
        };
        if (!customLayouts.grid) {
          customLayouts.grid = DEFAULT_GRID_KEYS;
        }
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
        const keySizes = parsed.keySizes || { abc: {}, qwerty: {}, grid: {} };
        if (!keySizes.grid) {
          keySizes.grid = {};
        }
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

  const getButtonTextColor = () => {
    const color = BUTTON_COLORS.find(c => c.id === preferences.buttonColorId);
    return color ? color.textColor : BUTTON_COLORS[0].textColor;
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
    savePreferences({ metronomeBpm: Math.max(10, Math.min(120, bpm)) });
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
        getButtonTextColor,
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
