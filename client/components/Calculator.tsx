import React, { useState, useMemo, useRef } from "react";
import { View, StyleSheet, useWindowDimensions, Text, Pressable, FlatList } from "react-native";
import { KeyButton } from "./KeyButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, KeyboardSizes, BorderRadius } from "@/constants/theme";
import { generateGraphPoints, GraphPoint } from "@/lib/calculator";
import * as Haptics from "expo-haptics";

const basicButtons = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", ".", "="],
  ["+", "-", "×"],
  ["÷", "(", ")"],
  ["C", "DEL", "^"],
];

const scientificButtons = [
  ["sin", "cos", "tan"],
  ["asin", "acos", "atan"],
  ["log", "ln", "e"],
  ["√", "∛", "π"],
  ["abs", "!", "%"],
  ["mod", "x", "y"],
];

const advancedButtons = [
  ["sinh", "cosh", "tanh"],
  ["exp", "floor", "ceil"],
  ["round", ",", "ANS"],
];

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
  const [currentPage, setCurrentPage] = useState(0);
  const [showGraph, setShowGraph] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const keyboardHeight = height * KeyboardSizes[keyboardSize];
  const numColumns = 3;
  const buttonWidth = width / numColumns;
  const buttonHeight = showGraph ? 40 : (keyboardHeight - 40) / 7;

  const graphPoints = useMemo(() => {
    if (!showGraph || !expression.toLowerCase().includes('x')) {
      return [];
    }
    return generateGraphPoints(expression, -10, 10, 100);
  }, [expression, showGraph]);

  const handleButtonPress = (btn: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const toggleGraph = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowGraph(!showGraph);
  };

  const goToPage = (page: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPage(page);
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
  };

  const pages = [
    { id: "basic", label: "123", buttons: basicButtons },
    { id: "scientific", label: "f(x)", buttons: scientificButtons },
    { id: "advanced", label: "More", buttons: advancedButtons },
  ];

  const renderPage = ({ item }: { item: typeof pages[0] }) => (
    <View style={[styles.page, { width }]}>
      {item.buttons.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((btn) => (
            <Pressable
              key={btn}
              onPress={() => handleButtonPress(btn)}
              style={[
                styles.gridButton,
                { 
                  width: buttonWidth,
                  height: buttonHeight,
                  backgroundColor: btn === "C" || btn === "DEL" ? theme.specialKey : 
                                   btn === "=" ? theme.primary : theme.backgroundSecondary,
                  borderColor: "#000000",
                },
              ]}
            >
              <Text style={[
                styles.gridButtonText, 
                { 
                  color: btn === "=" ? "#FFFFFF" : theme.text,
                  fontSize: btn.length > 3 ? 24 : btn.length > 1 ? 36 : 48,
                }
              ]}>
                {btn}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { height: keyboardHeight }]}>
      <View style={styles.tabBar}>
        {pages.map((page, index) => (
          <Pressable
            key={page.id}
            onPress={() => goToPage(index)}
            style={[
              styles.tab,
              { 
                backgroundColor: currentPage === index ? theme.primary : theme.backgroundSecondary,
                borderColor: theme.keyBorder,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: currentPage === index ? "#FFFFFF" : theme.text }]}>
              {page.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={toggleGraph}
          style={[
            styles.tab,
            { 
              backgroundColor: showGraph ? theme.primary : theme.backgroundSecondary,
              borderColor: theme.keyBorder,
            },
          ]}
        >
          <Text style={[styles.tabText, { color: showGraph ? "#FFFFFF" : theme.text }]}>
            Graph
          </Text>
        </Pressable>
      </View>

      {showGraph ? (
        <SimpleGraph 
          points={graphPoints} 
          width={width - Spacing.md * 2} 
          height={120} 
        />
      ) : null}

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        style={styles.pagerContainer}
      />

      <View style={styles.pageIndicator}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: currentPage === index ? theme.primary : theme.tabIconDefault },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pagerContainer: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 0,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridButton: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
  },
  gridButtonText: {
    fontWeight: "600",
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  graphContainer: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
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
