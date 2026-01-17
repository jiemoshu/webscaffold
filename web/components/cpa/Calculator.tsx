'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

interface CalculatorProps {
  onNumberPress: (num: number) => void;
  onOperatorPress: (op: OperationType) => void;
  onEquals: () => void;
  onClear: () => void;
  currentExpression: string;
  isUserMode: boolean;
}

const operatorColors: Record<OperationType, string> = {
  add: '#22c55e',      // Green
  subtract: '#ef4444', // Red
  multiply: '#3b82f6', // Blue
  divide: '#eab308',   // Yellow
};

const operatorIcons: Record<OperationType, string> = {
  add: 'mdi:plus',
  subtract: 'mdi:minus',
  multiply: 'mdi:close',
  divide: 'mdi:division',
};

const operatorSymbols: Record<OperationType, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

export default function Calculator({
  onNumberPress,
  onOperatorPress,
  onEquals,
  onClear,
  currentExpression,
  isUserMode,
}: CalculatorProps) {
  const buttonVariants = {
    tap: { scale: 0.9 },
    hover: { scale: 1.05, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' },
  };

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
    width: '100%',
    maxWidth: '320px',
    margin: '0 auto',
  };

  const displayStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '16px',
    minHeight: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
  };

  const displayTextStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 600,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(255,255,255,0.3)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  };

  const numberButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
    border: 'none',
    borderRadius: '14px',
    padding: '16px',
    fontSize: '22px',
    fontWeight: 600,
    color: '#333',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '56px',
  };

  const operatorButtonStyle = (op: OperationType): React.CSSProperties => ({
    background: `linear-gradient(145deg, ${operatorColors[op]}, ${operatorColors[op]}dd)`,
    border: 'none',
    borderRadius: '14px',
    padding: '16px',
    fontSize: '22px',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: `0 4px 12px ${operatorColors[op]}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '56px',
  });

  const clearButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #6b7280, #4b5563)',
    border: 'none',
    borderRadius: '14px',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(107,114,128,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '56px',
  };

  const equalsButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #667eea, #764ba2)',
    border: 'none',
    borderRadius: '14px',
    padding: '16px',
    fontSize: '22px',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102,126,234,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '56px',
  };

  const modeIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px 16px',
    borderRadius: '20px',
    background: isUserMode
      ? 'linear-gradient(135deg, #22c55e20, #16a34a20)'
      : 'linear-gradient(135deg, #3b82f620, #2563eb20)',
    color: isUserMode ? '#16a34a' : '#2563eb',
    fontSize: '13px',
    fontWeight: 500,
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={modeIndicatorStyle}>
        <Icon
          icon={isUserMode ? 'mdi:hand-pointing-up' : 'mdi:play-circle'}
          width={18}
        />
        <span>{isUserMode ? '互动模式' : '自动演示'}</span>
      </div>

      <div style={displayStyle}>
        <motion.span
          style={displayTextStyle}
          key={currentExpression}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentExpression || '0'}
        </motion.span>
      </div>

      <div style={gridStyle}>
        {/* Row 1: 7 8 9 ÷ */}
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(7)}
        >
          7
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(8)}
        >
          8
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(9)}
        >
          9
        </motion.button>
        <motion.button
          style={operatorButtonStyle('divide')}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onOperatorPress('divide')}
        >
          <Icon icon={operatorIcons.divide} width={24} />
        </motion.button>

        {/* Row 2: 4 5 6 × */}
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(4)}
        >
          4
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(5)}
        >
          5
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(6)}
        >
          6
        </motion.button>
        <motion.button
          style={operatorButtonStyle('multiply')}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onOperatorPress('multiply')}
        >
          <Icon icon={operatorIcons.multiply} width={24} />
        </motion.button>

        {/* Row 3: 1 2 3 - */}
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(1)}
        >
          1
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(2)}
        >
          2
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(3)}
        >
          3
        </motion.button>
        <motion.button
          style={operatorButtonStyle('subtract')}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onOperatorPress('subtract')}
        >
          <Icon icon={operatorIcons.subtract} width={24} />
        </motion.button>

        {/* Row 4: C 0 = + */}
        <motion.button
          style={clearButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onClear}
        >
          <Icon icon="mdi:backspace" width={24} />
        </motion.button>
        <motion.button
          style={numberButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onNumberPress(0)}
        >
          0
        </motion.button>
        <motion.button
          style={equalsButtonStyle}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={onEquals}
        >
          <Icon icon="mdi:equal" width={28} />
        </motion.button>
        <motion.button
          style={operatorButtonStyle('add')}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          onClick={() => onOperatorPress('add')}
        >
          <Icon icon={operatorIcons.add} width={24} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export { operatorColors, operatorSymbols };
