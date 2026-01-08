import React, { useState, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions, Text, ScrollView, Pressable } from "react-native";
import { KeyButton } from "./KeyButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, KeyboardSizes, BorderRadius } from "@/constants/theme";
import { generateGraphPoints, GraphPoint } from "@/lib/calculator";
import * as Haptics from "expo-haptics";

const calculatorButtons = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "=", "+"],
];

const scientificButtons = [
  ["sin", "cos", "tan", "√"],
  ["asin", "acos", "atan", "∛"],
  ["log", "ln", "e", "^"],
  ["π", "!", "mod", "%"],
  ["abs", "floor", "ceil", "round"],
];

const advancedButtons = [
  ["sinh", "cosh", "tanh", "exp"],
];

const controlButtons = ["C", "DEL", "(", ")"];

interface CalculatorProps {
  onCharacter: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEvaluate: () => void;
  expression?: string;
}

function SimpleGraph({ points, width, height }: { points: GraphPoint[]; width: number; height: number }) {
  const { theme } = useTheme();
  
  if (points.length < 2) {
    return (
      <View style={[styles.graphContainer, { width, height, backgroundColor: theme.backgroundSecondary }]}>
        <Text style={[styles.graphPlaceholder, { color: theme.tabIconDefault }]}>
          Enter an expression with x to see graph (e.g., x^2, sin(x))
        </Text>
      </View>
    );
  }
  
  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const padding = 30;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin || 1)) * graphWidth;
  const scaleY = (y: number) => height - padding - ((y - yMin) / (yMax - yMin || 1)) * graphHeight;
  
  const zeroY = yMin <= 0 && yMax >= 0 ? scaleY(0) : null;
  const zeroX = xMin <= 0 && xMax >= 0 ? scaleX(0) : null;
  
  return (
    <View style={[styles.graphContainer, { width, height, backgroundColor: theme.backgroundSecondary }]}>
      {zeroY !== null ? (
        <View style={[styles.axisLine, { top: zeroY, left: padding, width: graphWidth, height: 1, backgroundColor: theme.tabIconDefault }]} />
      ) : null}
      {zeroX !== null ? (
        <View style={[styles.axisLine, { left: zeroX, top: padding, width: 1, height: graphHeight, backgroundColor: theme.tabIconDefault }]} />
      ) : null}
      
      {points.map((point, index) => {
        if (index === 0) return null;
        const prevPoint = points[index - 1];
        const x1 = scaleX(prevPoint.x);
        const y1 = scaleY(prevPoint.y);
        const x2 = scaleX(point.x);
        const y2 = scaleY(point.y);
        
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        
        if (length > graphWidth / 2) return null;
        
        return (
          <View
            key={index}
            style={[
              styles.graphLine,
              {
                left: x1,
                top: y1,
                width: length,
                backgroundColor: theme.primary,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
      
      <Text style={[styles.axisLabel, { color: theme.tabIconDefault, left: padding, bottom: 5 }]}>
        {xMin.toFixed(1)}
      </Text>
      <Text style={[styles.axisLabel, { color: theme.tabIconDefault, right: padding, bottom: 5 }]}>
        {xMax.toFixed(1)}
      </Text>
      <Text style={[styles.axisLabel, { color: theme.tabIconDefault, left: 5, top: padding }]}>
        {yMax.toFixed(1)}
      </Text>
      <Text style={[styles.axisLabel, { color: theme.tabIconDefault, left: 5, bottom: padding }]}>
        {yMin.toFixed(1)}
      </Text>
    </View>
  );
}

export function Calculator({ onCharacter, onBackspace, onClear, onEvaluate, expression = "" }: CalculatorProps) {
  const { keyboardSize } = usePreferences();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const keyboardHeight = height * KeyboardSizes[keyboardSize];
  const numColumns = 4;
  const buttonWidth = (width - Spacing.md * 2 - (numColumns - 1) * Spacing.xs) / numColumns;
  const buttonHeight = showGraph ? 36 : (keyboardHeight - Spacing.md * 3) / (showAdvanced ? 12 : 10);

  const graphPoints = useMemo(() => {
    if (!showGraph || !expression.toLowerCase().includes('x')) {
      return [];
    }
    return generateGraphPoints(expression, -10, 10, 100);
  }, [expression, showGraph]);

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
      case "asin":
      case "acos":
      case "atan":
      case "sinh":
      case "cosh":
      case "tanh":
      case "log":
      case "ln":
      case "abs":
      case "floor":
      case "ceil":
      case "round":
      case "exp":
        onCharacter(btn + "(");
        break;
      case "√":
        onCharacter("√(");
        break;
      case "∛":
        onCharacter("∛(");
        break;
      case "π":
        onCharacter("π");
        break;
      case "e":
        onCharacter("e");
        break;
      case "!":
        onCharacter("!");
        break;
      default:
        onCharacter(btn);
    }
  };

  const toggleAdvanced = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAdvanced(!showAdvanced);
  };

  const toggleGraph = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowGraph(!showGraph);
  };

  return (
    <ScrollView 
      style={[styles.container, { maxHeight: keyboardHeight }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.modeButtons}>
        <Pressable
          onPress={toggleAdvanced}
          style={[
            styles.modeButton,
            { 
              backgroundColor: showAdvanced ? theme.primary : theme.backgroundSecondary,
              borderColor: theme.keyBorder,
            },
          ]}
        >
          <Text style={[styles.modeButtonText, { color: showAdvanced ? "#FFFFFF" : theme.text }]}>
            {showAdvanced ? "Basic" : "More"}
          </Text>
        </Pressable>
        <Pressable
          onPress={toggleGraph}
          style={[
            styles.modeButton,
            { 
              backgroundColor: showGraph ? theme.primary : theme.backgroundSecondary,
              borderColor: theme.keyBorder,
            },
          ]}
        >
          <Text style={[styles.modeButtonText, { color: showGraph ? "#FFFFFF" : theme.text }]}>
            Graph
          </Text>
        </Pressable>
      </View>

      {showGraph ? (
        <SimpleGraph 
          points={graphPoints} 
          width={width - Spacing.md * 2} 
          height={150} 
        />
      ) : null}

      <View style={styles.controlRow}>
        {controlButtons.map((btn) => (
          <KeyButton
            key={btn}
            label={btn}
            onPress={() => handleButtonPress(btn)}
            width={(width - Spacing.md * 2 - 3 * Spacing.xs) / 4}
            height={buttonHeight}
            isSpecial={btn === "C" || btn === "DEL"}
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
                height={buttonHeight}
                fontSize={12}
              />
            ))}
          </View>
        ))}
      </View>

      {showAdvanced ? (
        <View style={styles.advancedSection}>
          {advancedButtons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((btn) => (
                <KeyButton
                  key={btn}
                  label={btn}
                  onPress={() => handleButtonPress(btn)}
                  width={buttonWidth}
                  height={buttonHeight}
                  fontSize={12}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.mainSection}>
        {calculatorButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <KeyButton
                key={btn}
                label={btn}
                onPress={() => handleButtonPress(btn)}
                width={buttonWidth}
                height={buttonHeight}
                isSpecial={btn === "="}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.variableRow}>
        <KeyButton
          label="x"
          onPress={() => onCharacter("x")}
          width={buttonWidth}
          height={buttonHeight}
          fontSize={16}
        />
        <KeyButton
          label="y"
          onPress={() => onCharacter("y")}
          width={buttonWidth}
          height={buttonHeight}
          fontSize={16}
        />
        <KeyButton
          label=","
          onPress={() => onCharacter(",")}
          width={buttonWidth}
          height={buttonHeight}
          fontSize={16}
        />
        <KeyButton
          label="ANS"
          onPress={() => onCharacter("ANS")}
          width={buttonWidth}
          height={buttonHeight}
          fontSize={12}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  contentContainer: {
    paddingBottom: Spacing.md,
  },
  modeButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
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
  advancedSection: {
    marginBottom: Spacing.xs,
  },
  mainSection: {
    marginBottom: Spacing.xs,
  },
  variableRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  graphContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    position: "relative",
    overflow: "hidden",
  },
  graphPlaceholder: {
    textAlign: "center",
    fontSize: 14,
    padding: Spacing.lg,
  },
  graphLine: {
    position: "absolute",
    height: 2,
    transformOrigin: "left center",
  },
  axisLine: {
    position: "absolute",
  },
  axisLabel: {
    position: "absolute",
    fontSize: 10,
  },
});
