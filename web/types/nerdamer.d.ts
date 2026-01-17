declare module 'nerdamer' {
  interface NerdamerExpression {
    text(type?: string): string;
    evaluate(): NerdamerExpression;
    each(callback: (expr: NerdamerExpression) => void): void;
  }

  interface Nerdamer {
    (expression: string): NerdamerExpression;
    solve(expression: string, variable: string): NerdamerExpression;
  }

  const nerdamer: Nerdamer;
  export default nerdamer;
}

declare module 'nerdamer/Solve' {
  export {};
}
