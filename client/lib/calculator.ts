export function evaluateExpression(expression: string): string {
  try {
    let sanitized = expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, Math.PI.toString())
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/\^/g, "**");

    if (!/^[\d\s+\-*/().Math\sqrtsinctanlog\^e,]+$/.test(sanitized.replace(/Math\.\w+/g, ""))) {
      return "Error";
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
  ["log", "ln", "π", "^"],
];

export function isOperator(char: string): boolean {
  return ["+", "-", "×", "÷", "^", "(", ")"].includes(char);
}

export function isFunction(char: string): boolean {
  return ["sin", "cos", "tan", "√", "log", "ln"].includes(char);
}
