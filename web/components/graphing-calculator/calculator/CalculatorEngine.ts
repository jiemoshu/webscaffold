/**
 * CalculatorEngine - mathjs wrapper with precision handling
 * Solves JavaScript floating-point issues (e.g., 0.1 + 0.2 = 0.3)
 */

import { create, all, MathJsInstance } from 'mathjs';

// Create mathjs instance with BigNumber for precision
const math: MathJsInstance = create(all);

math.config({
  number: 'BigNumber',
  precision: 64,
});

// Import custom functions
math.import(
  {
    // Extended trigonometric functions
    sec: function (x: number) {
      return 1 / Math.cos(x);
    },
    csc: function (x: number) {
      return 1 / Math.sin(x);
    },
    cot: function (x: number) {
      return 1 / Math.tan(x);
    },

    // Inverse extended trigonometric functions
    asec: function (x: number) {
      return Math.acos(1 / x);
    },
    acsc: function (x: number) {
      return Math.asin(1 / x);
    },
    acot: function (x: number) {
      return Math.PI / 2 - Math.atan(x);
    },

    // Hyperbolic extended functions
    sech: function (x: number) {
      return 1 / Math.cosh(x);
    },
    csch: function (x: number) {
      return 1 / Math.sinh(x);
    },
    coth: function (x: number) {
      return 1 / Math.tanh(x);
    },

    // Inverse hyperbolic extended functions
    asech: function (x: number) {
      return Math.log(1 / x + Math.sqrt(1 / (x * x) - 1));
    },
    acsch: function (x: number) {
      return Math.log(1 / x + Math.sqrt(1 / (x * x) + 1));
    },
    acoth: function (x: number) {
      return 0.5 * Math.log((x + 1) / (x - 1));
    },

    // Combinatorics (use mathjs built-in)
    nCr: function (n: number, r: number) {
      return math.combinations(n, r);
    },
    nPr: function (n: number, r: number) {
      return math.permutations(n, r);
    },

    // Logarithms with custom base
    logBase: function (x: number, base: number) {
      return Math.log(x) / Math.log(base);
    },

    // Percentage functions
    percent: function (x: number) {
      return x / 100;
    },
    permille: function (x: number) {
      return x / 1000;
    },
    permyriad: function (x: number) {
      return x / 10000;
    },
  },
  { override: true }
);

export interface CalculationResult {
  value: string;
  numericValue: number;
  isComplex: boolean;
  error?: string;
}

export interface EvaluationScope {
  x?: number;
  y?: number;
  [key: string]: number | undefined;
}

/**
 * Safely evaluate a mathematical expression
 */
export function evaluate(
  expression: string,
  scope: EvaluationScope = {}
): CalculationResult {
  try {
    // Preprocess expression for user-friendly input
    const processedExpr = preprocessExpression(expression);

    // Evaluate
    const result = math.evaluate(processedExpr, scope);

    // Format result
    const formatted = formatResult(result);

    return {
      value: formatted,
      numericValue: typeof result === 'number' ? result : math.number(result),
      isComplex: math.typeOf(result) === 'Complex',
    };
  } catch (error) {
    return {
      value: 'Error',
      numericValue: NaN,
      isComplex: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Compile expression for repeated evaluation (e.g., graphing)
 */
export function compile(expression: string) {
  const processedExpr = preprocessExpression(expression);
  return math.compile(processedExpr);
}

// Type for compiled expression
interface CompiledExpression {
  evaluate: (scope?: Record<string, unknown>) => unknown;
}

/**
 * Evaluate a compiled expression with a scope
 */
export function evaluateCompiled(
  compiled: CompiledExpression,
  scope: EvaluationScope
): number {
  try {
    const result = compiled.evaluate(scope);
    return typeof result === 'number' ? result : math.number(result as number);
  } catch {
    return NaN;
  }
}

/**
 * Preprocess expression for user-friendly input
 */
function preprocessExpression(expr: string): string {
  let processed = expr;

  // Replace display symbols with math operators
  processed = processed.replace(/×/g, '*');
  processed = processed.replace(/÷/g, '/');
  processed = processed.replace(/−/g, '-');

  // Replace power notation
  processed = processed.replace(/\^/g, '^');

  // Replace tau with 2*pi
  processed = processed.replace(/\btau\b/g, '(2*pi)');

  // Replace ln with log (mathjs uses log for natural log)
  processed = processed.replace(/\bln\(/g, 'log(');

  // Replace log10 notation
  processed = processed.replace(/\blog10\(/g, 'log10(');

  // Handle implicit multiplication: 2pi -> 2*pi, 3x -> 3*x
  processed = processed.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
  processed = processed.replace(/(\))(\d)/g, '$1*$2');
  processed = processed.replace(/(\))([a-zA-Z(])/g, '$1*$2');

  // Handle factorial with proper function call
  processed = processed.replace(/(\d+)!/g, 'factorial($1)');

  return processed;
}

/**
 * Format result for display
 */
function formatResult(value: unknown): string {
  if (value === undefined || value === null) {
    return '0';
  }

  const type = math.typeOf(value);

  if (type === 'Complex') {
    const complex = value as { re: number; im: number };
    const re = formatNumber(complex.re);
    const im = formatNumber(Math.abs(complex.im));
    if (complex.im === 0) return re;
    if (complex.re === 0) return complex.im < 0 ? `-${im}i` : `${im}i`;
    return complex.im < 0 ? `${re} - ${im}i` : `${re} + ${im}i`;
  }

  if (type === 'BigNumber' || type === 'number') {
    const num =
      typeof value === 'number'
        ? value
        : math.number(value as Parameters<typeof math.number>[0]);
    return formatNumber(num as number);
  }

  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

/**
 * Format a number, removing unnecessary trailing zeros
 */
function formatNumber(num: number): string {
  if (!isFinite(num)) {
    if (num === Infinity) return '∞';
    if (num === -Infinity) return '-∞';
    return 'NaN';
  }

  // Use toPrecision for very large or small numbers
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(10).replace(/\.?0+e/, 'e');
  }

  // Regular formatting with precision
  const precision = 14;
  let str = num.toPrecision(precision);

  // Remove trailing zeros after decimal point
  if (str.includes('.')) {
    str = str.replace(/\.?0+$/, '');
  }

  // Handle scientific notation edge cases
  if (str.includes('e')) {
    str = str.replace(/\.?0+e/, 'e');
  }

  return str;
}

/**
 * Parse expression to LaTeX for display
 */
export function toLatex(expression: string): string {
  try {
    const processed = preprocessExpression(expression);
    const node = math.parse(processed);
    return node.toTex();
  } catch {
    return expression;
  }
}

/**
 * Get list of available constants
 */
export function getConstants(): Record<string, number> {
  return {
    pi: Math.PI,
    e: Math.E,
    tau: 2 * Math.PI,
    phi: (1 + Math.sqrt(5)) / 2, // Golden ratio
  };
}

/**
 * Validate if expression is syntactically correct
 */
export function validate(expression: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const processed = preprocessExpression(expression);
    math.parse(processed);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid expression',
    };
  }
}

// Export the math instance for advanced usage
export { math };
