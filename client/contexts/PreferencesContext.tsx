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

interface Preferences {
  keyboardLayout: KeyboardLayout;
  keyboardSize: SizeOption;
  typingAreaSize: SizeOption;
  displayName: string;
  avatarId: string;
  buttonColorId: string;
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
}

const defaultPreferences: Preferences = {
  keyboardLayout: "abc",
  keyboardSize: "medium",
  typingAreaSize: "medium",
  displayName: "Young Writer",
  avatarId: "robot",
  buttonColorId: "blue",
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
        setPreferences({ ...defaultPreferences, ...parsed, isLoading: false });
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
