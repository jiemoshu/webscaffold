/**
 * SolverEngine - Equation solving with multiple methods
 * Supports symbolic (via nerdamer) and numerical methods
 */

import { compile, evaluateCompiled } from '../calculator/CalculatorEngine';

export interface SolverResult {
  roots: number[];
  method: 'symbolic' | 'newton' | 'bisection' | 'combined';
  iterations?: number;
  error?: string;
}

export interface ComplexRoot {
  re: number;
  im: number;
}

// Dynamically import nerdamer to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nerdamer: any = null;

async function loadNerdamer() {
  if (!nerdamer && typeof window !== 'undefined') {
    try {
      const n = await import('nerdamer');
      await import('nerdamer/Solve');
      nerdamer = n.default || n;
    } catch (e) {
      console.warn('Failed to load nerdamer:', e);
    }
  }
  return nerdamer;
}

/**
 * Solve equation symbolically using nerdamer
 */
export async function solveSymbolic(
  equation: string,
  variable = 'x'
): Promise<SolverResult> {
  const n = await loadNerdamer();
  if (!n) {
    return {
      roots: [],
      method: 'symbolic',
      error: 'Symbolic solver not available',
    };
  }

  try {
    // Parse equation: "x^2 - 4 = 0" -> "x^2 - 4"
    let expr = equation;
    if (equation.includes('=')) {
      const [left, right] = equation.split('=');
      expr = `(${left.trim()}) - (${right.trim()})`;
    }

    const solutions = n.solve(expr, variable);
    const roots: number[] = [];

    // Extract numeric roots
    solutions.each((sol: unknown) => {
      try {
        const val = n(sol as string).evaluate().text('decimals');
        const num = parseFloat(val);
        if (isFinite(num) && !roots.includes(num)) {
          roots.push(num);
        }
      } catch {
        // Skip non-numeric roots
      }
    });

    return {
      roots: roots.sort((a, b) => a - b),
      method: 'symbolic',
    };
  } catch (error) {
    return {
      roots: [],
      method: 'symbolic',
      error: error instanceof Error ? error.message : 'Symbolic solve failed',
    };
  }
}

/**
 * Newton-Raphson method for root finding
 */
export function newtonRaphson(
  expression: string,
  initialGuess: number,
  tolerance = 1e-10,
  maxIterations = 100
): SolverResult {
  try {
    const compiled = compile(expression);
    const h = 1e-8; // For numerical derivative

    let x = initialGuess;
    let iterations = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fx = evaluateCompiled(compiled, { x });
      if (!isFinite(fx)) break;

      // Check if we found a root
      if (Math.abs(fx) < tolerance) {
        return {
          roots: [roundToSignificant(x, 10)],
          method: 'newton',
          iterations: i + 1,
        };
      }

      // Numerical derivative: f'(x) ≈ (f(x+h) - f(x-h)) / 2h
      const fxph = evaluateCompiled(compiled, { x: x + h });
      const fxmh = evaluateCompiled(compiled, { x: x - h });
      const dfx = (fxph - fxmh) / (2 * h);

      if (Math.abs(dfx) < tolerance * 0.01) break; // Derivative too small

      // Newton step
      x = x - fx / dfx;
      iterations = i + 1;
    }

    return {
      roots: [],
      method: 'newton',
      iterations,
      error: 'Did not converge',
    };
  } catch (error) {
    return {
      roots: [],
      method: 'newton',
      error: error instanceof Error ? error.message : 'Newton method failed',
    };
  }
}

/**
 * Bisection method for guaranteed convergence
 */
export function bisection(
  expression: string,
  a: number,
  b: number,
  tolerance = 1e-10,
  maxIterations = 100
): SolverResult {
  try {
    const compiled = compile(expression);
    let left = a;
    let right = b;
    let iterations = 0;

    let fa = evaluateCompiled(compiled, { x: left });
    let fb = evaluateCompiled(compiled, { x: right });

    // Check if there's a sign change
    if (fa * fb > 0) {
      return {
        roots: [],
        method: 'bisection',
        error: 'No sign change in interval',
      };
    }

    for (let i = 0; i < maxIterations; i++) {
      const mid = (left + right) / 2;
      const fm = evaluateCompiled(compiled, { x: mid });
      iterations = i + 1;

      if (Math.abs(fm) < tolerance || (right - left) / 2 < tolerance) {
        return {
          roots: [roundToSignificant(mid, 10)],
          method: 'bisection',
          iterations,
        };
      }

      if (fa * fm < 0) {
        right = mid;
        fb = fm;
      } else {
        left = mid;
        fa = fm;
      }
    }

    return {
      roots: [roundToSignificant((left + right) / 2, 10)],
      method: 'bisection',
      iterations,
    };
  } catch (error) {
    return {
      roots: [],
      method: 'bisection',
      error: error instanceof Error ? error.message : 'Bisection failed',
    };
  }
}

/**
 * Find all roots in a given range using interval scanning
 */
export function findAllRoots(
  expression: string,
  rangeStart: number,
  rangeEnd: number,
  tolerance = 1e-10,
  scanResolution = 100
): SolverResult {
  try {
    const compiled = compile(expression);
    const roots: number[] = [];
    const step = (rangeEnd - rangeStart) / scanResolution;

    // Scan for sign changes
    let prevX = rangeStart;
    let prevFx = evaluateCompiled(compiled, { x: prevX });

    for (let i = 1; i <= scanResolution; i++) {
      const x = rangeStart + i * step;
      const fx = evaluateCompiled(compiled, { x });

      // Check for sign change (root between prevX and x)
      if (isFinite(prevFx) && isFinite(fx) && prevFx * fx < 0) {
        // Refine with bisection
        const result = bisection(expression, prevX, x, tolerance);
        if (result.roots.length > 0) {
          const root = result.roots[0];
          // Avoid duplicates
          if (!roots.some((r) => Math.abs(r - root) < tolerance * 100)) {
            roots.push(root);
          }
        }
      }

      // Check for exact zero (or very close)
      if (Math.abs(fx) < tolerance) {
        if (!roots.some((r) => Math.abs(r - x) < tolerance * 100)) {
          roots.push(roundToSignificant(x, 10));
        }
      }

      prevX = x;
      prevFx = fx;
    }

    return {
      roots: roots.sort((a, b) => a - b),
      method: 'combined',
    };
  } catch (error) {
    return {
      roots: [],
      method: 'combined',
      error: error instanceof Error ? error.message : 'Root finding failed',
    };
  }
}

/**
 * Main solve function - combines symbolic and numerical methods
 */
export async function solve(
  equation: string,
  options: {
    rangeStart?: number;
    rangeEnd?: number;
    tolerance?: number;
  } = {}
): Promise<SolverResult> {
  const { rangeStart = -100, rangeEnd = 100, tolerance = 1e-10 } = options;

  // Parse equation to expression (if it has =)
  let expression = equation;
  if (equation.includes('=')) {
    const [left, right] = equation.split('=');
    expression = `(${left.trim()}) - (${right.trim()})`;
  }

  // Try symbolic first
  const symbolicResult = await solveSymbolic(equation);
  if (symbolicResult.roots.length > 0) {
    return symbolicResult;
  }

  // Fall back to numerical
  const numericalResult = findAllRoots(
    expression,
    rangeStart,
    rangeEnd,
    tolerance
  );

  return numericalResult;
}

/**
 * Round to significant figures
 */
function roundToSignificant(num: number, figures: number): number {
  if (num === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(num)));
  const power = figures - d;
  const magnitude = Math.pow(10, power);
  return Math.round(num * magnitude) / magnitude;
}

/**
 * Format roots for display
 */
export function formatRoots(roots: number[]): string[] {
  return roots.map((r) => {
    if (Math.abs(r) < 1e-10) return '0';
    if (Math.abs(r - Math.round(r)) < 1e-10) return String(Math.round(r));
    return r.toPrecision(10).replace(/\.?0+$/, '');
  });
}
