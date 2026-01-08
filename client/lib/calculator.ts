export function evaluateExpression(expression: string): string {
  try {
    let sanitized = expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, Math.PI.toString())
      .replace(/e(?![a-z])/gi, Math.E.toString())
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/∛\(/g, "Math.cbrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/asin\(/g, "Math.asin(")
      .replace(/acos\(/g, "Math.acos(")
      .replace(/atan\(/g, "Math.atan(")
      .replace(/sinh\(/g, "Math.sinh(")
      .replace(/cosh\(/g, "Math.cosh(")
      .replace(/tanh\(/g, "Math.tanh(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/floor\(/g, "Math.floor(")
      .replace(/ceil\(/g, "Math.ceil(")
      .replace(/round\(/g, "Math.round(")
      .replace(/exp\(/g, "Math.exp(")
      .replace(/(\d+)!/g, "factorial($1)")
      .replace(/\^/g, "**")
      .replace(/mod/g, "%");

    if (sanitized.includes("factorial")) {
      sanitized = `(function(){function factorial(n){if(n<=1)return 1;return n*factorial(n-1);}return ${sanitized}})()`;
    }

    const openParens = (sanitized.match(/\(/g) || []).length;
    const closeParens = (sanitized.match(/\)/g) || []).length;
    for (let i = 0; i < openParens - closeParens; i++) {
      sanitized += ")";
    }

    const result = Function(`"use strict"; return (${sanitized})`)();
    
    if (typeof result !== "number" || !isFinite(result)) {
      return "Error";
    }

    if (Number.isInteger(result)) {
      return result.toString();
    }
    
    const formatted = result.toPrecision(10);
    return parseFloat(formatted).toString();
  } catch {
    return "Error";
  }
}

export const calculatorButtons = [
  ["C", "DEL", "(", ")"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "=", "+"],
];

export const scientificButtons = [
  ["sin", "cos", "tan", "√"],
  ["asin", "acos", "atan", "∛"],
  ["log", "ln", "e", "^"],
  ["π", "!", "mod", "%"],
  ["abs", "floor", "ceil", "round"],
];

export const advancedButtons = [
  ["sinh", "cosh", "tanh", "exp"],
];

export function isOperator(char: string): boolean {
  return ["+", "-", "×", "÷", "^", "(", ")", "%", "mod"].includes(char);
}

export function isFunction(char: string): boolean {
  return ["sin", "cos", "tan", "√", "log", "ln", "asin", "acos", "atan", "sinh", "cosh", "tanh", "abs", "floor", "ceil", "round", "exp", "∛"].includes(char);
}

export interface GraphPoint {
  x: number;
  y: number;
}

export function evaluateForGraph(expression: string, xValue: number): number | null {
  try {
    let sanitized = expression
      .replace(/x/gi, `(${xValue})`)
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, Math.PI.toString())
      .replace(/e(?![a-z])/gi, Math.E.toString())
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/∛\(/g, "Math.cbrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/\^/g, "**");

    const openParens = (sanitized.match(/\(/g) || []).length;
    const closeParens = (sanitized.match(/\)/g) || []).length;
    for (let i = 0; i < openParens - closeParens; i++) {
      sanitized += ")";
    }

    const result = Function(`"use strict"; return (${sanitized})`)();
    
    if (typeof result !== "number" || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
}

export function generateGraphPoints(expression: string, xMin: number, xMax: number, numPoints: number = 100): GraphPoint[] {
  const points: GraphPoint[] = [];
  const step = (xMax - xMin) / numPoints;
  
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + i * step;
    const y = evaluateForGraph(expression, x);
    if (y !== null && Math.abs(y) < 1000000) {
      points.push({ x, y });
    }
  }
  
  return points;
}
