import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type KeyboardLayout = "abc" | "qwerty";
export type SizeOption = "small" | "medium" | "large";
export type AppMode = "keyboard" | "calculator";

interface Preferences {
  keyboardLayout: KeyboardLayout;
  keyboardSize: SizeOption;
  typingAreaSize: SizeOption;
  displayName: string;
  avatarId: string;
  isLoading: boolean;
}

interface PreferencesContextType extends Preferences {
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setKeyboardSize: (size: SizeOption) => void;
  setTypingAreaSize: (size: SizeOption) => void;
  setDisplayName: (name: string) => void;
  setAvatarId: (id: string) => void;
}

const defaultPreferences: Preferences = {
  keyboardLayout: "abc",
  keyboardSize: "medium",
  typingAreaSize: "medium",
  displayName: "Young Writer",
  avatarId: "robot",
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
        setPreferences({ ...parsed, isLoading: false });
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

  return (
    <PreferencesContext.Provider
      value={{
        ...preferences,
        setKeyboardLayout,
        setKeyboardSize,
        setTypingAreaSize,
        setDisplayName,
        setAvatarId,
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
