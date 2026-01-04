import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { KeyButton } from "./KeyButton";
import { Spacing } from "@/constants/theme";

const calculatorButtons = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "=", "+"],
];

const scientificButtons = [
  ["(", ")", "^", "√"],
  ["sin", "cos", "tan", "π"],
];

const controlButtons = ["C", "DEL"];

interface CalculatorProps {
  onCharacter: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEvaluate: () => void;
}

export function Calculator({ onCharacter, onBackspace, onClear, onEvaluate }: CalculatorProps) {
  const { width } = useWindowDimensions();
  const numColumns = 4;
  const buttonWidth = (width - Spacing.md * 2 - (numColumns - 1) * Spacing.xs) / numColumns;

  const handleButtonPress = (btn: string) => {
    switch (btn) {
      case "C":
        onClear();
        break;
      case "DEL":
        onBackspace();
        break;
      case "=":
        onEvaluate();
        break;
      case "sin":
      case "cos":
      case "tan":
        onCharacter(btn + "(");
        break;
      case "√":
        onCharacter("√(");
        break;
      case "π":
        onCharacter("3.14159");
        break;
      default:
        onCharacter(btn);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlRow}>
        {controlButtons.map((btn) => (
          <KeyButton
            key={btn}
            label={btn}
            onPress={() => handleButtonPress(btn)}
            width={(width - Spacing.md * 2 - Spacing.xs) / 2}
            height={50}
            isSpecial
          />
        ))}
      </View>

      <View style={styles.scientificSection}>
        {scientificButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <KeyButton
                key={btn}
                label={btn}
                onPress={() => handleButtonPress(btn)}
                width={buttonWidth}
                height={50}
                fontSize={14}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.mainSection}>
        {calculatorButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <KeyButton
                key={btn}
                label={btn}
                onPress={() => handleButtonPress(btn)}
                width={buttonWidth}
                height={50}
                isSpecial={btn === "="}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  scientificSection: {
    marginBottom: Spacing.xs,
  },
  mainSection: {
    flex: 1,
    justifyContent: "space-evenly",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
});
