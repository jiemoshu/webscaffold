'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import katex from 'katex';
import type { OperationType } from './Calculator';

interface ALayerProps {
  num1: number;
  num2: number;
  operation: OperationType;
  result: number | null;
  animationPhase: 'idle' | 'showing-first' | 'showing-second' | 'showing-result';
  onInteract?: () => void;
}

const operatorColors: Record<OperationType, string> = {
  add: '#22c55e',
  subtract: '#ef4444',
  multiply: '#3b82f6',
  divide: '#eab308',
};

const operatorSymbols: Record<OperationType, string> = {
  add: '+',
  subtract: '-',
  multiply: '\\times',
  divide: '\\div',
};

interface MathDisplayProps {
  latex: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
  onClick?: () => void;
}

function MathDisplay({ latex, color = '#333', size = 'medium', delay = 0, onClick }: MathDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    small: '1.2rem',
    medium: '2rem',
    large: '2.8rem',
  };

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
      } catch (e) {
        console.error('KaTeX render error:', e);
        containerRef.current.textContent = latex;
      }
    }
  }, [latex]);

  return (
    <motion.div
      ref={containerRef}
      onClick={onClick}
      style={{
        fontSize: sizeMap[size],
        color: color,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: '"KaTeX_Main", "Times New Roman", serif',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: delay,
      }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    />
  );
}

interface StepDisplayProps {
  step: number;
  total: number;
  label: string;
  isActive: boolean;
}

function StepDisplay({ step, total, label, isActive }: StepDisplayProps) {
  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: isActive ? 'linear-gradient(135deg, #667eea20, #764ba220)' : 'rgba(0,0,0,0.03)',
        border: isActive ? '2px solid #667eea' : '2px solid transparent',
      }}
      animate={{
        scale: isActive ? 1.05 : 1,
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isActive ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e5e7eb',
          color: isActive ? '#fff' : '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {step}
      </div>
      <span
        style={{
          fontSize: '12px',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#667eea' : '#666',
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export default function ALayer({
  num1,
  num2,
  operation,
  result,
  animationPhase,
  onInteract,
}: ALayerProps) {
  const color = operatorColors[operation];
  const opSymbol = operatorSymbols[operation];

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: color,
    fontWeight: 600,
    fontSize: '14px',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    flex: 1,
    padding: '12px 0',
  };

  const equationContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 32px',
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    borderRadius: '16px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15)',
    minWidth: '280px',
  };

  const stepsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const showFirst = animationPhase !== 'idle';
  const showSecond = animationPhase === 'showing-second' || animationPhase === 'showing-result';
  const showResult = animationPhase === 'showing-result';

  const getCurrentStep = () => {
    switch (animationPhase) {
      case 'idle':
        return 0;
      case 'showing-first':
        return 1;
      case 'showing-second':
        return 2;
      case 'showing-result':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

  // Build the LaTeX expression progressively
  const buildLatex = () => {
    if (animationPhase === 'idle') {
      return '?';
    }

    let latex = `\\color{white}{${num1}}`;

    if (showSecond) {
      latex += ` \\color{${color}}{${opSymbol}} \\color{white}{${num2}}`;
    }

    if (showResult && result !== null) {
      latex += ` \\color{#94a3b8}{=} \\color{#22c55e}{${result}}`;

      // Show remainder for division
      if (operation === 'divide' && num2 > 0 && num1 % num2 !== 0) {
        const remainder = num1 % num2;
        latex += `\\color{#94a3b8}{\\text{ R }}\\color{#f59e0b}{${remainder}}`;
      }
    }

    return latex;
  };

  // Explanation text based on operation
  const getExplanation = () => {
    if (!showResult || result === null) return null;

    switch (operation) {
      case 'add':
        return `${num1} 加上 ${num2} 等于 ${result}`;
      case 'subtract':
        return `${num1} 减去 ${num2} 等于 ${Math.max(0, result)}`;
      case 'multiply':
        return `${num1} 乘以 ${num2} 等于 ${result}`;
      case 'divide':
        if (num2 === 0) return '不能除以零';
        const quotient = Math.floor(num1 / num2);
        const remainder = num1 % num2;
        return remainder > 0
          ? `${num1} 除以 ${num2} 等于 ${quotient} 余 ${remainder}`
          : `${num1} 除以 ${num2} 等于 ${quotient}`;
      default:
        return null;
    }
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div style={headerStyle}>
        <Icon icon="mdi:function-variant" width={20} />
        <span>抽象 (Abstract)</span>
        <motion.div
          style={{
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Step indicators */}
      <div style={stepsContainerStyle}>
        <StepDisplay step={1} total={3} label="第一个数" isActive={currentStep === 1} />
        <StepDisplay step={2} total={3} label="运算" isActive={currentStep === 2} />
        <StepDisplay step={3} total={3} label="结果" isActive={currentStep === 3} />
      </div>

      <div style={contentStyle}>
        {/* Main equation display */}
        <motion.div
          style={equationContainerStyle}
          onClick={onInteract}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            <MathDisplay
              key={`${num1}-${num2}-${operation}-${animationPhase}`}
              latex={buildLatex()}
              size="large"
              onClick={onInteract}
            />
          </AnimatePresence>
        </motion.div>

        {/* Explanation text */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              style={{
                padding: '12px 20px',
                background: `${color}15`,
                borderRadius: '12px',
                border: `2px solid ${color}30`,
                color: '#333',
                fontSize: '16px',
                fontWeight: 500,
                textAlign: 'center',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.3 }}
            >
              <Icon
                icon="mdi:lightbulb-on"
                width={20}
                style={{ marginRight: '8px', verticalAlign: 'middle', color: color }}
              />
              {getExplanation()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mathematical representation for special cases */}
        {showResult && operation === 'multiply' && result !== null && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '14px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>也可以写成：</span>
            <MathDisplay
              latex={`\\underbrace{${num2} + ${num2} + \\cdots + ${num2}}_{${num1}\\text{ 个}} = ${result}`}
              size="small"
              color="#666"
            />
          </motion.div>
        )}

        {showResult && operation === 'divide' && num2 > 0 && result !== null && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '14px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>验算：</span>
            <MathDisplay
              latex={`${Math.floor(num1 / num2)} \\times ${num2}${num1 % num2 > 0 ? ` + ${num1 % num2}` : ''} = ${num1}`}
              size="small"
              color="#666"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
