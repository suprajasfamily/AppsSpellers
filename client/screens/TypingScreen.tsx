import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedView } from "@/components/ThemedView";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { Calculator } from "@/components/Calculator";
import { SuggestionPill } from "@/components/SuggestionPill";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, AppMode } from "@/contexts/PreferencesContext";
import { getSuggestions } from "@/lib/wordSuggestions";
import { Spacing, BorderRadius, Typography, TypingAreaSizes, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Typing">;

export default function TypingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { typingAreaSize } = usePreferences();
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();

  const [mode, setMode] = useState<AppMode>("keyboard");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(["I", "The", "My", "A", "We"]);

  const typingHeight = height * TypingAreaSizes[typingAreaSize];

  const updateSuggestions = useCallback((newText: string) => {
    const newSuggestions = getSuggestions(newText);
    setSuggestions(newSuggestions);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    const newText = text + key.toLowerCase();
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleBackspace = useCallback(() => {
    const newText = text.slice(0, -1);
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleSpace = useCallback(() => {
    const newText = text + " ";
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleEnter = useCallback(() => {
    const newText = text + "\n";
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleSuggestionPress = useCallback((word: string) => {
    const words = text.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || "";
    let newText: string;
    
    if (lastWord && !text.endsWith(" ")) {
      newText = text.slice(0, -lastWord.length) + word + " ";
    } else {
      newText = text + word + " ";
    }
    
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleClear = useCallback(() => {
    Alert.alert(
      "Clear all text?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setText("");
            setSuggestions(["I", "The", "My", "A", "We"]);
          },
        },
      ]
    );
  }, []);

  const handleCalculatorResult = useCallback((result: string) => {
    setText(text + result + " ");
  }, [text]);

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleClear}
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
            accessibilityLabel="Clear text"
          >
            <Feather name="trash-2" size={20} color={theme.text} />
          </Pressable>

          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("keyboard");
              }}
              style={[
                styles.modeButton,
                mode === "keyboard" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="type"
                size={18}
                color={mode === "keyboard" ? "#FFFFFF" : theme.text}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "keyboard" ? "#FFFFFF" : theme.text },
                ]}
              >
                Keyboard
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("calculator");
              }}
              style={[
                styles.modeButton,
                mode === "calculator" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="hash"
                size={18}
                color={mode === "calculator" ? "#FFFFFF" : theme.text}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "calculator" ? "#FFFFFF" : theme.text },
                ]}
              >
                Calculator
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
            accessibilityLabel="Settings"
          >
            <Feather name="settings" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View
          style={[
            styles.typingArea,
            {
              height: typingHeight,
              backgroundColor: theme.typingAreaBg,
              borderColor: theme.typingAreaBorder,
            },
          ]}
        >
          <ScrollView
            style={styles.typingScroll}
            contentContainerStyle={styles.typingContent}
            showsVerticalScrollIndicator={true}
          >
            <Text
              style={[
                styles.typingText,
                {
                  color: theme.text,
                  fontFamily: Fonts?.sans || "System",
                },
              ]}
            >
              {text || "Start typing..."}
            </Text>
          </ScrollView>
        </View>

        {mode === "keyboard" ? (
          <>
            <View style={styles.suggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
              >
                {suggestions.map((word, index) => (
                  <SuggestionPill
                    key={`${word}-${index}`}
                    word={word}
                    onPress={handleSuggestionPress}
                  />
                ))}
              </ScrollView>
            </View>

            <CustomKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onSpace={handleSpace}
              onEnter={handleEnter}
            />
          </>
        ) : (
          <Calculator onResult={handleCalculatorResult} />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginHorizontal: 2,
  },
  modeText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  typingArea: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  typingScroll: {
    flex: 1,
  },
  typingContent: {
    padding: Spacing.md,
    minHeight: "100%",
  },
  typingText: {
    fontSize: Typography.typing.fontSize,
    fontWeight: Typography.typing.fontWeight,
  },
  suggestionsContainer: {
    height: 50,
    marginBottom: Spacing.sm,
  },
  suggestionsScroll: {
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
});
