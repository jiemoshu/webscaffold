'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ScientificKeyboardProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEquals: () => void;
  angleMode: 'rad' | 'deg';
  onAngleModeChange: (mode: 'rad' | 'deg') => void;
}

type KeyCategory =
  | 'number'
  | 'operator'
  | 'function'
  | 'trig'
  | 'constant'
  | 'control';

interface KeyConfig {
  label: string;
  value: string;
  category: KeyCategory;
  span?: number;
}

const buttonVariants = {
  tap: { scale: 0.92 },
  hover: { scale: 1.03, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' },
};

const categoryColors: Record<KeyCategory, { bg: string; shadow: string }> = {
  number: { bg: '#ffffff', shadow: 'rgba(0,0,0,0.08)' },
  operator: { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.3)' },
  function: { bg: '#8b5cf6', shadow: 'rgba(139,92,246,0.3)' },
  trig: { bg: '#ec4899', shadow: 'rgba(236,72,153,0.3)' },
  constant: { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.3)' },
  control: { bg: '#6b7280', shadow: 'rgba(107,114,128,0.3)' },
};

export default function ScientificKeyboard({
  onInput,
  onClear,
  onBackspace,
  onEquals,
  angleMode,
  onAngleModeChange,
}: ScientificKeyboardProps) {
  const [keyboardPage, setKeyboardPage] = useState<'main' | 'trig' | 'func'>(
    'main'
  );

  const mainKeys: KeyConfig[] = [
    // Row 1
    { label: '7', value: '7', category: 'number' },
    { label: '8', value: '8', category: 'number' },
    { label: '9', value: '9', category: 'number' },
    { label: '÷', value: '/', category: 'operator' },
    { label: '(', value: '(', category: 'operator' },
    { label: ')', value: ')', category: 'operator' },
    // Row 2
    { label: '4', value: '4', category: 'number' },
    { label: '5', value: '5', category: 'number' },
    { label: '6', value: '6', category: 'number' },
    { label: '×', value: '*', category: 'operator' },
    { label: 'x²', value: '^2', category: 'function' },
    { label: '√', value: 'sqrt(', category: 'function' },
    // Row 3
    { label: '1', value: '1', category: 'number' },
    { label: '2', value: '2', category: 'number' },
    { label: '3', value: '3', category: 'number' },
    { label: '−', value: '-', category: 'operator' },
    { label: 'xⁿ', value: '^', category: 'function' },
    { label: 'ⁿ√', value: 'nthRoot(', category: 'function' },
    // Row 4
    { label: '0', value: '0', category: 'number' },
    { label: '.', value: '.', category: 'number' },
    { label: '±', value: '-', category: 'operator' },
    { label: '+', value: '+', category: 'operator' },
    { label: 'log', value: 'log10(', category: 'function' },
    { label: 'ln', value: 'log(', category: 'function' },
    // Row 5
    { label: 'π', value: 'pi', category: 'constant' },
    { label: 'e', value: 'e', category: 'constant' },
    { label: 'x', value: 'x', category: 'constant' },
    { label: ',', value: ',', category: 'operator' },
    { label: 'e^x', value: 'exp(', category: 'function' },
    { label: '10^x', value: '10^', category: 'function' },
  ];

  const trigKeys: KeyConfig[] = [
    // Row 1 - Basic trig
    { label: 'sin', value: 'sin(', category: 'trig' },
    { label: 'cos', value: 'cos(', category: 'trig' },
    { label: 'tan', value: 'tan(', category: 'trig' },
    { label: 'sec', value: 'sec(', category: 'trig' },
    { label: 'csc', value: 'csc(', category: 'trig' },
    { label: 'cot', value: 'cot(', category: 'trig' },
    // Row 2 - Inverse trig
    { label: 'asin', value: 'asin(', category: 'trig' },
    { label: 'acos', value: 'acos(', category: 'trig' },
    { label: 'atan', value: 'atan(', category: 'trig' },
    { label: 'asec', value: 'asec(', category: 'trig' },
    { label: 'acsc', value: 'acsc(', category: 'trig' },
    { label: 'acot', value: 'acot(', category: 'trig' },
    // Row 3 - Hyperbolic
    { label: 'sinh', value: 'sinh(', category: 'trig' },
    { label: 'cosh', value: 'cosh(', category: 'trig' },
    { label: 'tanh', value: 'tanh(', category: 'trig' },
    { label: 'sech', value: 'sech(', category: 'trig' },
    { label: 'csch', value: 'csch(', category: 'trig' },
    { label: 'coth', value: 'coth(', category: 'trig' },
    // Row 4 - Inverse hyperbolic
    { label: 'asinh', value: 'asinh(', category: 'trig' },
    { label: 'acosh', value: 'acosh(', category: 'trig' },
    { label: 'atanh', value: 'atanh(', category: 'trig' },
    { label: 'asech', value: 'asech(', category: 'trig' },
    { label: 'acsch', value: 'acsch(', category: 'trig' },
    { label: 'acoth', value: 'acoth(', category: 'trig' },
  ];

  const funcKeys: KeyConfig[] = [
    // Row 1 - Advanced math
    { label: 'abs', value: 'abs(', category: 'function' },
    { label: 'ceil', value: 'ceil(', category: 'function' },
    { label: 'floor', value: 'floor(', category: 'function' },
    { label: 'round', value: 'round(', category: 'function' },
    { label: 'sign', value: 'sign(', category: 'function' },
    { label: 'mod', value: 'mod(', category: 'function' },
    // Row 2 - Combinatorics
    { label: 'n!', value: '!', category: 'function' },
    { label: 'nCr', value: 'nCr(', category: 'function' },
    { label: 'nPr', value: 'nPr(', category: 'function' },
    { label: 'gcd', value: 'gcd(', category: 'function' },
    { label: 'lcm', value: 'lcm(', category: 'function' },
    { label: 'atan2', value: 'atan2(', category: 'function' },
    // Row 3 - More functions
    { label: 'min', value: 'min(', category: 'function' },
    { label: 'max', value: 'max(', category: 'function' },
    { label: 'cbrt', value: 'cbrt(', category: 'function' },
    { label: 'log₂', value: 'log2(', category: 'function' },
    { label: 'logₐ', value: 'logBase(', category: 'function' },
    { label: 'exp', value: 'exp(', category: 'function' },
    // Row 4 - Constants and special
    { label: 'φ', value: 'phi', category: 'constant' },
    { label: 'τ', value: 'tau', category: 'constant' },
    { label: 'i', value: 'i', category: 'constant' },
    { label: '%', value: '/100', category: 'operator' },
    { label: '‰', value: '/1000', category: 'operator' },
    { label: 'Ans', value: 'ans', category: 'constant' },
  ];

  const keys =
    keyboardPage === 'trig'
      ? trigKeys
      : keyboardPage === 'func'
        ? funcKeys
        : mainKeys;

  const getButtonStyle = (category: KeyCategory): React.CSSProperties => {
    const colors = categoryColors[category];
    const isLight = category === 'number';
    return {
      background: `linear-gradient(145deg, ${colors.bg}, ${colors.bg}dd)`,
      border: 'none',
      borderRadius: '12px',
      padding: '12px 8px',
      fontSize: '14px',
      fontWeight: 600,
      color: isLight ? '#333' : '#fff',
      cursor: 'pointer',
      boxShadow: `0 4px 12px ${colors.shadow}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '44px',
      fontFamily: '"SF Mono", "Fira Code", monospace',
    };
  };

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow:
      '0 10px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: active
      ? 'linear-gradient(135deg, #667eea, #764ba2)'
      : 'transparent',
    color: active ? '#fff' : '#666',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  });

  const controlRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginTop: '12px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
    marginTop: '12px',
  };

  const modeSwitchStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: angleMode === 'rad' ? '#22c55e20' : '#3b82f620',
    color: angleMode === 'rad' ? '#16a34a' : '#2563eb',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '8px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            style={tabStyle(keyboardPage === 'main')}
            onClick={() => setKeyboardPage('main')}
          >
            Main
          </button>
          <button
            style={tabStyle(keyboardPage === 'trig')}
            onClick={() => setKeyboardPage('trig')}
          >
            Trig
          </button>
          <button
            style={tabStyle(keyboardPage === 'func')}
            onClick={() => setKeyboardPage('func')}
          >
            Func
          </button>
        </div>
        <button
          style={modeSwitchStyle}
          onClick={() =>
            onAngleModeChange(angleMode === 'rad' ? 'deg' : 'rad')
          }
        >
          {angleMode === 'rad' ? 'RAD' : 'DEG'}
        </button>
      </div>

      {/* Keyboard Grid */}
      <div style={gridStyle}>
        {keys.map((key, index) => (
          <motion.button
            key={`${keyboardPage}-${index}`}
            style={{
              ...getButtonStyle(key.category),
              gridColumn: key.span ? `span ${key.span}` : undefined,
            }}
            variants={buttonVariants}
            whileTap="tap"
            whileHover="hover"
            onClick={() => onInput(key.value)}
          >
            {key.label}
          </motion.button>
        ))}
      </div>

      {/* Control Row */}
      <div style={controlRowStyle}>
        <motion.button
          style={{
            ...getButtonStyle('control'),
            background: 'linear-gradient(145deg, #ef4444, #dc2626)',
          }}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onClear}
        >
          AC
        </motion.button>
        <motion.button
          style={getButtonStyle('control')}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onBackspace}
        >
          <Icon icon="mdi:backspace" width={20} />
        </motion.button>
        <motion.button
          style={{
            ...getButtonStyle('operator'),
            gridColumn: 'span 2',
            background: 'linear-gradient(145deg, #22c55e, #16a34a)',
            boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
          }}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onEquals}
        >
          <Icon icon="mdi:equal" width={24} />
        </motion.button>
      </div>
    </motion.div>
  );
}
