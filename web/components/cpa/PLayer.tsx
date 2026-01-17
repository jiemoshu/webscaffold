'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { OperationType } from './Calculator';

interface PLayerProps {
  num1: number;
  num2: number;
  operation: OperationType;
  result: number | null;
  animationPhase: 'idle' | 'showing-first' | 'showing-second' | 'showing-result';
  onInteract?: () => void;
}

const operatorColors: Record<OperationType, { primary: string; secondary: string; gradient: string }> = {
  add: {
    primary: '#22c55e',
    secondary: '#86efac',
    gradient: 'linear-gradient(180deg, #22c55e, #16a34a)',
  },
  subtract: {
    primary: '#ef4444',
    secondary: '#fca5a5',
    gradient: 'linear-gradient(180deg, #ef4444, #dc2626)',
  },
  multiply: {
    primary: '#3b82f6',
    secondary: '#93c5fd',
    gradient: 'linear-gradient(180deg, #3b82f6, #2563eb)',
  },
  divide: {
    primary: '#eab308',
    secondary: '#fde047',
    gradient: 'linear-gradient(180deg, #eab308, #ca8a04)',
  },
};

interface BarProps {
  value: number;
  maxValue: number;
  color: string;
  gradient: string;
  label?: string;
  delay: number;
  isReducing?: boolean;
  reduceAmount?: number;
  onClick?: () => void;
}

function Bar({ value, maxValue, color, gradient, label, delay, isReducing, reduceAmount = 0, onClick }: BarProps) {
  const height = maxValue > 0 ? (value / maxValue) * 120 : 0;
  const reducedHeight = maxValue > 0 ? ((value - reduceAmount) / maxValue) * 120 : 0;

  return (
    <motion.div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <div
        style={{
          width: '48px',
          height: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: '12px',
          padding: '8px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Bar - always maintains original height */}
        <motion.div
          style={{
            width: '32px',
            borderRadius: '8px 8px 4px 4px',
            boxShadow: `0 4px 12px ${color}40`,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          initial={{ height: 0 }}
          animate={{ height: height }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: delay,
          }}
        >
          {/* Top part - remaining (solid) */}
          {isReducing && reduceAmount > 0 ? (
            <>
              <motion.div
                style={{
                  flex: 1,
                  background: gradient,
                  borderRadius: '8px 8px 0 0',
                  position: 'relative',
                }}
                initial={{ height: 0 }}
                animate={{ height: reducedHeight }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: delay + 0.4,
                }}
              >
                {/* Shine effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '8px',
                    height: '60%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
                    borderRadius: '4px',
                  }}
                />
              </motion.div>

              {/* Bottom part - removed (faded) */}
              <motion.div
                style={{
                  flex: 1,
                  background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.15), rgba(239,68,68,0.15) 4px, rgba(239,68,68,0.25) 4px, rgba(239,68,68,0.25) 8px)',
                  borderRadius: '0 0 4px 4px',
                  border: '2px dashed rgba(239,68,68,0.5)',
                  borderTop: 'none',
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: (reduceAmount / maxValue) * 120,
                  opacity: 0.6,
                }}
                transition={{ delay: delay + 0.4 }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: gradient,
                borderRadius: '8px 8px 4px 4px',
                position: 'relative',
              }}
            >
              {/* Shine effect */}
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  width: '8px',
                  height: '60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Value label inside bar */}
        <motion.span
          style={{
            position: 'absolute',
            bottom: isReducing && reduceAmount > 0
              ? `calc(${(reduceAmount / maxValue) * 120}px + ${reducedHeight / 2}px)`
              : height > 30 ? '50%' : height + 20,
            transform: 'translateY(50%)',
            color: height > 30 ? '#fff' : color,
            fontWeight: 700,
            fontSize: '14px',
            textShadow: height > 30 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            zIndex: 10,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.5 }}
        >
          {isReducing ? value - reduceAmount : value}
        </motion.span>

        {/* Label for reduced amount (in faded area) */}
        {isReducing && reduceAmount > 0 && (
          <motion.span
            style={{
              position: 'absolute',
              bottom: `calc(${((reduceAmount / maxValue) * 120) / 2}px)`,
              transform: 'translateY(50%)',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: '12px',
              textDecoration: 'line-through',
              zIndex: 10,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: delay + 0.6 }}
          >
            -{reduceAmount}
          </motion.span>
        )}
      </div>

      {/* Label */}
      {label && (
        <motion.span
          style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: 500,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

interface StackedBarProps {
  values: { value: number; color: string }[];
  maxValue: number;
  delay: number;
  onClick?: () => void;
}

function StackedBar({ values, maxValue, delay, onClick }: StackedBarProps) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
    >
      <div
        style={{
          width: '56px',
          height: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: '12px',
          padding: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px' }}>
          {values.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 120 : 0;
            return (
              <motion.div
                key={index}
                style={{
                  width: '40px',
                  borderRadius: index === values.length - 1 ? '8px 8px 4px 4px' : '4px',
                  background: item.color,
                  boxShadow: `0 2px 8px ${item.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: delay + index * 0.15,
                }}
              >
                {height > 20 && (
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>
                    {item.value}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
        = {values.reduce((sum, v) => sum + v.value, 0)}
      </span>
    </motion.div>
  );
}

interface GridVisualizationProps {
  rows: number;
  cols: number;
  color: string;
  delay: number;
  onClick?: () => void;
}

function GridVisualization({ rows, cols, color, delay, onClick }: GridVisualizationProps) {
  const displayRows = Math.min(rows, 5);
  const displayCols = Math.min(cols, 5);

  return (
    <motion.div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${displayCols}, 24px)`,
          gap: '4px',
          padding: '12px',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: '12px',
        }}
      >
        {Array.from({ length: displayRows * displayCols }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: color,
              boxShadow: `0 2px 6px ${color}30`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: delay + i * 0.03,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
        {rows} × {cols} = {rows * cols}
      </span>
    </motion.div>
  );
}

interface PieChartProps {
  total: number;
  parts: number;
  color: string;
  secondaryColor: string;
  delay: number;
  showResult?: boolean;
  onClick?: () => void;
}

function PieChart({ total, parts, color, secondaryColor, delay, showResult, onClick }: PieChartProps) {
  const partSize = parts > 0 ? total / parts : 0;
  const displayParts = Math.min(parts, 8);
  const radius = 50;
  const strokeWidth = 24;

  return (
    <motion.div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
    >
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {Array.from({ length: displayParts }).map((_, i) => {
          const circumference = 2 * Math.PI * radius;
          const segmentLength = circumference / displayParts;
          const offset = (i * segmentLength) - (circumference / 4);

          return (
            <motion.circle
              key={i}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={showResult && i === 0 ? color : secondaryColor}
              strokeWidth={strokeWidth - 4}
              strokeDasharray={`${segmentLength - 4} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: delay + i * 0.1,
              }}
            />
          );
        })}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '14px', fontWeight: 600, fill: '#333' }}
        >
          {total}÷{parts}
        </text>
      </svg>
      <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
        每份 = {partSize.toFixed(parts > 0 && total % parts !== 0 ? 1 : 0)}
      </span>
    </motion.div>
  );
}

export default function PLayer({
  num1,
  num2,
  operation,
  result,
  animationPhase,
  onInteract,
}: PLayerProps) {
  const colors = operatorColors[operation];

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: colors.primary,
    fontWeight: 600,
    fontSize: '14px',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '24px',
    flex: 1,
    padding: '12px 0',
  };

  const maxValue = Math.max(num1, num2, result || 0, num1 + num2);

  const showFirst = animationPhase !== 'idle';
  const showSecond = animationPhase === 'showing-second' || animationPhase === 'showing-result';
  const showResult = animationPhase === 'showing-result';

  const renderAddition = () => (
    <div style={contentStyle}>
      <AnimatePresence>
        {showFirst && (
          <Bar
            value={num1}
            maxValue={maxValue}
            color={colors.primary}
            gradient={colors.gradient}
            label="第一个数"
            delay={0}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showFirst && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{ alignSelf: 'center', color: colors.primary }}
        >
          <Icon icon="mdi:plus" width={28} />
        </motion.div>
      )}

      <AnimatePresence>
        {showSecond && (
          <Bar
            value={num2}
            maxValue={maxValue}
            color={colors.secondary}
            gradient={`linear-gradient(180deg, ${colors.secondary}, ${colors.primary})`}
            label="第二个数"
            delay={0.2}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showSecond && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ alignSelf: 'center', color: '#666' }}
        >
          <Icon icon="mdi:equal" width={28} />
        </motion.div>
      )}

      <AnimatePresence>
        {showResult && result !== null && (
          <StackedBar
            values={[
              { value: num1, color: colors.primary },
              { value: num2, color: colors.secondary },
            ]}
            maxValue={maxValue}
            delay={0.4}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const renderSubtraction = () => (
    <div style={contentStyle}>
      <AnimatePresence>
        {showFirst && (
          <Bar
            value={num1}
            maxValue={Math.max(num1, num2)}
            color={colors.primary}
            gradient={colors.gradient}
            label="原来"
            delay={0}
            isReducing={showResult}
            reduceAmount={showResult ? num2 : 0}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showFirst && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{ alignSelf: 'center', color: colors.primary }}
        >
          <Icon icon="mdi:minus" width={28} />
        </motion.div>
      )}

      <AnimatePresence>
        {showSecond && (
          <Bar
            value={num2}
            maxValue={Math.max(num1, num2)}
            color={colors.secondary}
            gradient={`linear-gradient(180deg, ${colors.secondary}, ${colors.primary})`}
            label="减去"
            delay={0.2}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ alignSelf: 'center', color: '#666' }}
        >
          <Icon icon="mdi:equal" width={28} />
        </motion.div>
      )}

      <AnimatePresence>
        {showResult && result !== null && (
          <Bar
            value={Math.max(0, result)}
            maxValue={Math.max(num1, num2)}
            color="#10b981"
            gradient="linear-gradient(180deg, #10b981, #059669)"
            label="剩余"
            delay={0.6}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const renderMultiplication = () => (
    <div style={contentStyle}>
      <AnimatePresence>
        {showFirst && (
          <GridVisualization
            rows={Math.min(num1, 5)}
            cols={Math.min(num2, 5)}
            color={colors.primary}
            delay={0}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showResult && result !== null && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              background: `${colors.primary}15`,
              borderRadius: '12px',
              border: `2px solid ${colors.primary}`,
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 700, color: colors.primary }}>
              {result}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>总数</span>
        </motion.div>
      )}
    </div>
  );

  const renderDivision = () => (
    <div style={contentStyle}>
      <AnimatePresence>
        {showFirst && num2 > 0 && (
          <PieChart
            total={num1}
            parts={num2}
            color={colors.primary}
            secondaryColor={colors.secondary}
            delay={0}
            showResult={showResult}
            onClick={onInteract}
          />
        )}
      </AnimatePresence>

      {showResult && result !== null && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              background: `${colors.primary}15`,
              borderRadius: '12px',
              border: `2px solid ${colors.primary}`,
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 700, color: colors.primary }}>
              {result}
            </span>
            {num2 > 0 && num1 % num2 !== 0 && (
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
                余 {num1 % num2}
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>商</span>
        </motion.div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (operation) {
      case 'add':
        return renderAddition();
      case 'subtract':
        return renderSubtraction();
      case 'multiply':
        return renderMultiplication();
      case 'divide':
        return renderDivision();
      default:
        return null;
    }
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div style={headerStyle}>
        <Icon icon="mdi:chart-bar" width={20} />
        <span>图像 (Pictorial)</span>
        <motion.div
          style={{
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.primary,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>
      {renderContent()}
    </motion.div>
  );
}
