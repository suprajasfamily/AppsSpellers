import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type KeyboardLayout = "abc" | "qwerty";
export type SizeOption = "small" | "medium" | "large";
export type AppMode = "keyboard" | "calculator";

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

export const DEFAULT_ABC_LAYOUT = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
export const DEFAULT_QWERTY_LAYOUT = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Z", "X", "C", "V", "B", "N", "M"];

interface CustomLayouts {
  abc: string[];
  qwerty: string[];
}

interface Preferences {
  keyboardLayout: KeyboardLayout;
  keyboardSize: SizeOption;
  typingAreaSize: SizeOption;
  displayName: string;
  avatarId: string;
  buttonColorId: string;
  customLayouts: CustomLayouts;
  isLoading: boolean;
}

interface PreferencesContextType extends Preferences {
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setKeyboardSize: (size: SizeOption) => void;
  setTypingAreaSize: (size: SizeOption) => void;
  setDisplayName: (name: string) => void;
  setAvatarId: (id: string) => void;
  setButtonColorId: (id: string) => void;
  getButtonColor: () => string;
  setCustomLayout: (layout: KeyboardLayout, keys: string[]) => void;
  resetCustomLayout: (layout: KeyboardLayout) => void;
  getCustomLayout: (layout: KeyboardLayout) => string[];
}

const defaultPreferences: Preferences = {
  keyboardLayout: "abc",
  keyboardSize: "medium",
  typingAreaSize: "medium",
  displayName: "Young Writer",
  avatarId: "robot",
  buttonColorId: "blue",
  customLayouts: {
    abc: DEFAULT_ABC_LAYOUT,
    qwerty: DEFAULT_QWERTY_LAYOUT,
  },
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
        const customLayouts = parsed.customLayouts || {
          abc: DEFAULT_ABC_LAYOUT,
          qwerty: DEFAULT_QWERTY_LAYOUT,
        };
        setPreferences({ ...defaultPreferences, ...parsed, customLayouts, isLoading: false });
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
    const defaultLayout = layout === "abc" ? DEFAULT_ABC_LAYOUT : DEFAULT_QWERTY_LAYOUT;
    const newCustomLayouts = {
      ...preferences.customLayouts,
      [layout]: defaultLayout,
    };
    savePreferences({ customLayouts: newCustomLayouts });
  };

  const getCustomLayout = (layout: KeyboardLayout): string[] => {
    return preferences.customLayouts[layout] || (layout === "abc" ? DEFAULT_ABC_LAYOUT : DEFAULT_QWERTY_LAYOUT);
  };

  return (
    <PreferencesContext.Provider
      value={{
        ...preferences,
        setKeyboardLayout,
        setKeyboardSize,
        setTypingAreaSize,
        setDisplayName,
        setAvatarId,
        setButtonColorId,
        getButtonColor,
        setCustomLayout,
        resetCustomLayout,
        getCustomLayout,
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
