'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { solve, formatRoots, SolverResult } from './SolverEngine';

export default function EquationSolver() {
  const [equation, setEquation] = useState('');
  const [rangeStart, setRangeStart] = useState(-100);
  const [rangeEnd, setRangeEnd] = useState(100);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolve = useCallback(async () => {
    if (!equation.trim()) return;

    setIsLoading(true);
    try {
      const solution = await solve(equation, {
        rangeStart,
        rangeEnd,
        tolerance: 1e-10,
      });
      setResult(solution);
    } catch (error) {
      setResult({
        roots: [],
        method: 'combined',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [equation, rangeStart, rangeEnd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSolve();
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
  };

  const inputSectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: '"SF Mono", monospace',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const rangeRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const rangeInputStyle: React.CSSProperties = {
    width: '100px',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  };

  const resultSectionStyle: React.CSSProperties = {
    flex: 1,
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'auto',
  };

  const rootCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    borderRadius: '8px',
    marginBottom: '8px',
  };

  const rootValueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    fontFamily: '"SF Mono", monospace',
    color: '#0369a1',
  };

  const methodBadgeStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    background: '#dbeafe',
    color: '#1d4ed8',
  };

  const exampleEquations = [
    { eq: 'x^2 - 4 = 0', desc: 'Simple quadratic' },
    { eq: 'x^3 - x = 0', desc: 'Cubic equation' },
    { eq: 'sin(x) = 0.5', desc: 'Trigonometric' },
    { eq: 'e^x = 10', desc: 'Exponential' },
    { eq: 'x^2 + 2x - 3 = 0', desc: 'Quadratic formula' },
  ];

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Input Section */}
      <div style={inputSectionStyle}>
        <div style={inputRowStyle}>
          <input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter equation, e.g., x^2 - 4 = 0"
            style={inputStyle}
          />
          <motion.button
            style={buttonStyle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSolve}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icon icon="mdi:loading" width={20} className="animate-spin" />
            ) : (
              <Icon icon="mdi:calculator" width={20} />
            )}
            Solve
          </motion.button>
        </div>

        <div style={rangeRowStyle}>
          <span style={labelStyle}>Search range:</span>
          <input
            type="number"
            value={rangeStart}
            onChange={(e) => setRangeStart(parseFloat(e.target.value) || -100)}
            style={rangeInputStyle}
          />
          <span style={labelStyle}>to</span>
          <input
            type="number"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(parseFloat(e.target.value) || 100)}
            style={rangeInputStyle}
          />
        </div>

        {/* Example Equations */}
        <div style={{ marginTop: '16px' }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>
            Try these examples:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {exampleEquations.map((ex) => (
              <motion.button
                key={ex.eq}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: 'white',
                  fontSize: '13px',
                  fontFamily: '"SF Mono", monospace',
                  cursor: 'pointer',
                }}
                whileHover={{ background: '#f9fafb', scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEquation(ex.eq)}
                title={ex.desc}
              >
                {ex.eq}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div style={resultSectionStyle}>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {result.error ? (
                <div
                  style={{
                    padding: '20px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Icon icon="mdi:alert-circle" width={24} />
                  <span>{result.error}</span>
                </div>
              ) : result.roots.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    background: '#fffbeb',
                    borderRadius: '8px',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Icon icon="mdi:information" width={24} />
                  <span>
                    No real roots found in the range [{rangeStart}, {rangeEnd}]
                  </span>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <Icon icon="mdi:check-circle" width={24} color="#22c55e" />
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>
                      Found {result.roots.length} root
                      {result.roots.length > 1 ? 's' : ''}
                    </span>
                    <span style={methodBadgeStyle}>
                      {result.method}
                      {result.iterations ? ` (${result.iterations} iter)` : ''}
                    </span>
                  </div>

                  {formatRoots(result.roots).map((root, index) => (
                    <motion.div
                      key={index}
                      style={rootCardStyle}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Icon icon="mdi:function-variant" width={24} color="#0369a1" />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        x<sub>{index + 1}</sub> =
                      </span>
                      <span style={rootValueStyle}>{root}</span>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                gap: '12px',
              }}
            >
              <Icon icon="mdi:function" width={48} />
              <p>Enter an equation and click Solve</p>
              <p style={{ fontSize: '13px' }}>
                Supports polynomial, trigonometric, exponential equations
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
