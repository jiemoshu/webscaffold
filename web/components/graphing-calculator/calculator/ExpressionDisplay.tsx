'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import katex from 'katex';
import { toLatex } from './CalculatorEngine';

interface ExpressionDisplayProps {
  expression: string;
  result: string;
  error?: string;
  onExpressionChange: (expr: string) => void;
  onSubmit: () => void;
}

export default function ExpressionDisplay({
  expression,
  result,
  error,
  onExpressionChange,
  onSubmit,
}: ExpressionDisplayProps) {
  const latexRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Render LaTeX preview
  useEffect(() => {
    if (latexRef.current && expression) {
      try {
        const latex = toLatex(expression);
        katex.render(latex, latexRef.current, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        if (latexRef.current) {
          latexRef.current.textContent = expression;
        }
      }
    } else if (latexRef.current) {
      latexRef.current.textContent = '';
    }
  }, [expression]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '16px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    resize: 'none',
    minHeight: '24px',
    maxHeight: '80px',
  };

  const latexPreviewStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '22px',
    fontFamily: '"KaTeX_Main", serif',
    minHeight: '30px',
    marginTop: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const resultStyle: React.CSSProperties = {
    color: error ? '#ef4444' : '#22c55e',
    fontSize: '28px',
    fontWeight: 600,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    textAlign: 'right',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    textShadow: error ? 'none' : '0 0 10px rgba(34,197,94,0.3)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={labelStyle}>Expression</div>
      <textarea
        ref={inputRef}
        style={inputStyle}
        value={expression}
        onChange={(e) => onExpressionChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter expression, e.g., sin(pi/2) + cos(0)"
        rows={1}
      />

      {expression && (
        <motion.div
          style={latexPreviewStyle}
          ref={latexRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <motion.div
        style={resultStyle}
        key={result}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {error ? `Error: ${error}` : result || '0'}
      </motion.div>
    </motion.div>
  );
}
