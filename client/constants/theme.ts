import { Platform } from "react-native";

const tintColorLight = "#4A90E2";
const tintColorDark = "#5A9FF2";

export const Colors = {
  light: {
    text: "#2C3E50",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#4A90E2",
    backgroundRoot: "#F8F9FA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E8F4F8",
    backgroundTertiary: "#D9D9D9",
    primary: "#4A90E2",
    secondary: "#F5A623",
    success: "#7ED321",
    keyBackground: "#FFFFFF",
    keyBorder: "#E1E4E8",
    keyPressed: "#F0F0F0",
    specialKey: "#E8F4F8",
    suggestionBg: "#E8F4F8",
    suggestionBorder: "#4A90E2",
    typingAreaBg: "#FFFFFF",
    typingAreaBorder: "#E1E4E8",
    calculatorDisplay: "#1C1C1E",
  },
  dark: {
    text: "#ECEDEE",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#5A9FF2",
    backgroundRoot: "#1C1C1E",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    primary: "#5A9FF2",
    secondary: "#F5A623",
    success: "#7ED321",
    keyBackground: "#353739",
    keyBorder: "#404244",
    keyPressed: "#2A2C2E",
    specialKey: "#404244",
    suggestionBg: "#353739",
    suggestionBorder: "#5A9FF2",
    typingAreaBg: "#2A2C2E",
    typingAreaBorder: "#404244",
    calculatorDisplay: "#ECEDEE",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  keyboard: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  typing: {
    fontSize: 22,
    fontWeight: "400" as const,
  },
  calculator: {
    fontSize: 28,
    fontWeight: "500" as const,
  },
  suggestion: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const KeyboardSizes = {
  small: 0.45,
  medium: 0.55,
  large: 0.65,
};

export const TypingAreaSizes = {
  small: 0.25,
  medium: 0.35,
  large: 0.45,
};
