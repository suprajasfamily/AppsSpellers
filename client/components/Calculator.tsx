import React, { useState } from "react";
import { View, StyleSheet, Text, useWindowDimensions, ScrollView } from "react-native";
import { KeyButton } from "./KeyButton";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Spacing, KeyboardSizes, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { evaluateExpression, calculatorButtons, scientificButtons } from "@/lib/calculator";

interface CalculatorProps {
  onResult?: (result: string) => void;
}

export function Calculator({ onResult }: CalculatorProps) {
  const { theme } = useTheme();
  const { keyboardSize } = usePreferences();
  const { width, height } = useWindowDimensions();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const keyboardHeight = height * KeyboardSizes[keyboardSize];
  const buttonWidth = (width - Spacing.lg * 2 - 4 * 8) / 4;

  const handleButtonPress = (btn: string) => {
    switch (btn) {
      case "C":
        setExpression("");
        setResult("");
        break;
      case "=":
        const evalResult = evaluateExpression(expression);
        setResult(evalResult);
        if (onResult && evalResult !== "Error") {
          onResult(evalResult);
        }
        break;
      case "±":
        if (expression.startsWith("-")) {
          setExpression(expression.slice(1));
        } else if (expression) {
          setExpression("-" + expression);
        }
        break;
      case "sin":
      case "cos":
      case "tan":
      case "log":
      case "ln":
        setExpression(expression + btn + "(");
        break;
      case "√":
        setExpression(expression + "√(");
        break;
      default:
        setExpression(expression + btn);
    }
  };

  const handleBackspace = () => {
    if (expression.length > 0) {
      const funcs = ["sin(", "cos(", "tan(", "log(", "ln(", "√("];
      for (const func of funcs) {
        if (expression.endsWith(func)) {
          setExpression(expression.slice(0, -func.length));
          return;
        }
      }
      setExpression(expression.slice(0, -1));
    }
  };

  return (
    <View style={[styles.container, { height: keyboardHeight }]}>
      <View style={[styles.display, { backgroundColor: theme.backgroundSecondary, borderColor: theme.keyBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.expressionContainer}
        >
          <Text
            style={[
              styles.expression,
              { color: theme.text, fontFamily: Fonts?.mono || "monospace" },
            ]}
            numberOfLines={1}
          >
            {expression || "0"}
          </Text>
        </ScrollView>
        {result ? (
          <Text
            style={[
              styles.result,
              { color: theme.primary, fontFamily: Fonts?.mono || "monospace" },
            ]}
            numberOfLines={1}
          >
            = {result}
          </Text>
        ) : null}
      </View>

      <View style={styles.scientificRow}>
        {scientificButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <KeyButton
                key={btn}
                label={btn}
                onPress={() => handleButtonPress(btn)}
                width={buttonWidth}
                fontSize={16}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.keysContainer}>
        {calculatorButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <KeyButton
                key={btn}
                label={btn}
                onPress={() => handleButtonPress(btn)}
                width={buttonWidth}
                isSpecial={btn === "C" || btn === "="}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.backspaceRow}>
        <KeyButton
          label="DEL"
          onPress={handleBackspace}
          width={buttonWidth * 2}
          isSpecial
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  display: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    minHeight: 70,
    justifyContent: "center",
  },
  expressionContainer: {
    alignItems: "flex-end",
  },
  expression: {
    fontSize: Typography.calculator.fontSize,
    fontWeight: Typography.calculator.fontWeight,
    textAlign: "right",
  },
  result: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  scientificRow: {
    marginBottom: Spacing.xs,
  },
  keysContainer: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },
  backspaceRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
});
