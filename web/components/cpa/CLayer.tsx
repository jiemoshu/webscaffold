'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { OperationType } from './Calculator';

interface CLayerProps {
  num1: number;
  num2: number;
  operation: OperationType;
  result: number | null;
  animationPhase: 'idle' | 'showing-first' | 'showing-second' | 'showing-result';
  onInteract?: () => void;
}

const operatorColors: Record<
  OperationType,
  { primary: string; secondary: string; glowPrimary: string; glowSecondary: string }
> = {
  add: {
    primary: '#3b82f6',
    secondary: '#f59e0b',
    glowPrimary: 'rgba(59, 130, 246, 0.3)',
    glowSecondary: 'rgba(245, 158, 11, 0.3)',
  }, // Blue and Orange for clear distinction
  subtract: {
    primary: '#ef4444',
    secondary: '#fca5a5',
    glowPrimary: 'rgba(239, 68, 68, 0.3)',
    glowSecondary: 'rgba(252, 165, 165, 0.3)',
  },
  multiply: {
    primary: '#3b82f6',
    secondary: '#93c5fd',
    glowPrimary: 'rgba(59, 130, 246, 0.3)',
    glowSecondary: 'rgba(147, 197, 253, 0.3)',
  },
  divide: {
    primary: '#eab308',
    secondary: '#fde047',
    glowPrimary: 'rgba(234, 179, 8, 0.3)',
    glowSecondary: 'rgba(253, 224, 71, 0.3)',
  },
};

const operatorIcons: Record<OperationType, string> = {
  add: 'mdi:plus-circle',
  subtract: 'mdi:minus-circle',
  multiply: 'mdi:close-circle',
  divide: 'mdi:division',
};

interface DotProps {
  index: number;
  color: string;
  glow: string;
  delay: number;
  isRemoving?: boolean;
  isFaded?: boolean;
  onClick?: () => void;
  label?: string;
}

function Dot({ index, color, glow, delay, isRemoving, isFaded, onClick, label }: DotProps) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color}ee, ${color})`,
        boxShadow: `0 4px 12px ${glow}, inset 0 2px 4px rgba(255,255,255,0.4)`,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={
        isRemoving
          ? { scale: 0, opacity: 0, rotate: 180, y: -20 }
          : isFaded
          ? { scale: 1, opacity: 0.3, rotate: 0, y: 0 }
          : { scale: 1, opacity: 1, rotate: 0, y: 0 }
      }
      exit={{ scale: 0, opacity: 0, rotate: 180 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: delay,
      }}
      whileHover={onClick ? { scale: 1.15 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <motion.div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          position: 'relative',
          top: '-6px',
          left: '-6px',
        }}
      />
      {label && (
        <motion.span
          style={{
            position: 'absolute',
            fontSize: '10px',
            fontWeight: 600,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {label}
        </motion.span>
      )}
      {isFaded && (
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '2px',
            background: '#ef4444',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + 0.2 }}
        />
      )}
    </motion.div>
  );
}

interface BlockProps {
  index: number;
  color: string;
  glow: string;
  delay: number;
  onClick?: () => void;
}

function Block({ index, color, glow, delay, onClick }: BlockProps) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${color}ee, ${color})`,
        boxShadow: `0 4px 12px ${glow}, inset 0 2px 4px rgba(255,255,255,0.3)`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      initial={{ scale: 0, opacity: 0, rotateX: -90 }}
      animate={{ scale: 1, opacity: 1, rotateX: 0 }}
      exit={{ scale: 0, opacity: 0, rotateX: 90 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: delay,
      }}
      whileHover={onClick ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={onClick ? { scale: 0.9 } : undefined}
    />
  );
}

export default function CLayer({
  num1,
  num2,
  operation,
  result,
  animationPhase,
  onInteract,
}: CLayerProps) {
  const colors = operatorColors[operation];
  const [showingRemoval, setShowingRemoval] = useState(false);

  useEffect(() => {
    if (operation === 'subtract' && animationPhase === 'showing-result') {
      setShowingRemoval(true);
    } else {
      setShowingRemoval(false);
    }
  }, [operation, animationPhase]);

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
    color: colors.primary,
    fontWeight: 600,
    fontSize: '14px',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    flex: 1,
  };

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    maxWidth: '200px',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '16px',
    background: 'rgba(0,0,0,0.02)',
  };

  // Helper function to render dots in groups of 5
  const renderDotsInGroups = (
    count: number,
    color: string,
    glow: string,
    baseDelay: number,
    options?: { isFaded?: boolean; isRemoving?: boolean; showLabels?: boolean; labelColor?: string }
  ) => {
    const groups: JSX.Element[] = [];
    const fullGroups = Math.floor(count / 5);
    const remainder = count % 5;

    // Render full groups of 5
    for (let groupIdx = 0; groupIdx < fullGroups; groupIdx++) {
      const groupDots = [];
      for (let i = 0; i < 5; i++) {
        const globalIdx = groupIdx * 5 + i;
        groupDots.push(
          <Dot
            key={`dot-${globalIdx}`}
            index={globalIdx}
            color={color}
            glow={glow}
            delay={baseDelay + globalIdx * 0.08}
            isFaded={options?.isFaded}
            isRemoving={options?.isRemoving}
            onClick={onInteract}
            label={options?.showLabels ? `${globalIdx}` : undefined}
          />
        );
      }
      groups.push(
        <motion.div
          key={`group-${groupIdx}`}
          style={{
            display: 'flex',
            gap: '6px',
            padding: '8px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.04)',
            border: '2px solid rgba(0,0,0,0.08)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: baseDelay + groupIdx * 0.4 }}
        >
          {groupDots}
        </motion.div>
      );
    }

    // Render remaining dots
    if (remainder > 0) {
      const remainderDots = [];
      for (let i = 0; i < remainder; i++) {
        const globalIdx = fullGroups * 5 + i;
        remainderDots.push(
          <Dot
            key={`dot-${globalIdx}`}
            index={globalIdx}
            color={color}
            glow={glow}
            delay={baseDelay + globalIdx * 0.08}
            isFaded={options?.isFaded}
            isRemoving={options?.isRemoving}
            onClick={onInteract}
            label={options?.showLabels ? `${globalIdx}` : undefined}
          />
        );
      }
      groups.push(
        <motion.div
          key={`group-remainder`}
          style={{
            display: 'flex',
            gap: '6px',
            padding: '8px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.04)',
            border: '2px dashed rgba(0,0,0,0.08)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: baseDelay + fullGroups * 0.4 }}
        >
          {remainderDots}
        </motion.div>
      );
    }

    return groups;
  };

  const operatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.primary,
  };

  const renderAddition = () => {
    const showFirst = animationPhase !== 'idle';
    const showSecond = animationPhase === 'showing-second' || animationPhase === 'showing-result';
    const showResult = animationPhase === 'showing-result';

    // Render colored set notation
    const renderColoredSet = () => {
      if (!showFirst) return null;

      return (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            fontSize: '16px',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* First set */}
          <span style={{ color: '#333' }}>{'{'}</span>
          {Array.from({ length: num1 }, (_, i) => (
            <span key={`first-${i}`}>
              <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
              {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
            </span>
          ))}
          <span style={{ color: '#333' }}>{'}'}</span>

          {/* Plus sign */}
          {showSecond && <span style={{ color: colors.primary, fontSize: '20px' }}>+</span>}

          {/* Second set */}
          {showSecond && (
            <>
              <span style={{ color: '#333' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`second-${i}`}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{i}</span>
                  {i < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#333' }}>{'}'}</span>
            </>
          )}

          {/* Equals and result set */}
          {showResult && result !== null && (
            <>
              <span style={{ color: '#333', fontSize: '20px' }}>=</span>
              <span style={{ color: '#333' }}>{'{'}</span>
              {/* First group elements in primary color */}
              {Array.from({ length: num1 }, (_, i) => (
                <span key={`result-first-${i}`}>
                  <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
                  <span style={{ color: '#666' }}>, </span>
                </span>
              ))}
              {/* Second group elements in secondary color */}
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`result-second-${i}`}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{i}</span>
                  {i < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#333' }}>{'}'}</span>
            </>
          )}
        </motion.div>
      );
    };

    return (
      <div style={{ ...contentStyle, flexDirection: 'column', gap: '20px' }}>
        {/* Visual dots representation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {!showResult && (
            <>
              {/* First group */}
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'center',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: showFirst ? 1 : 0 }}
              >
                <AnimatePresence>
                  {showFirst && renderDotsInGroups(num1, colors.primary, colors.glowPrimary, 0, { showLabels: true })}
                </AnimatePresence>
              </motion.div>

              {/* Operator */}
              <motion.div
                style={operatorStyle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: showFirst ? 1 : 0, scale: showFirst ? 1 : 0 }}
                transition={{ delay: num1 * 0.08 }}
              >
                <Icon icon={operatorIcons.add} width={36} />
              </motion.div>

              {/* Second group */}
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'center',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: showSecond ? 1 : 0 }}
              >
                <AnimatePresence>
                  {showSecond && renderDotsInGroups(num2, colors.secondary, colors.glowSecondary, 0.2, { showLabels: true })}
                </AnimatePresence>
              </motion.div>
            </>
          )}

          {/* Result - combined groups maintaining colors */}
          {showResult && result !== null && (
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                <AnimatePresence>
                  {renderDotsInGroups(num1, colors.primary, colors.glowPrimary, 0, { showLabels: true })}
                  {renderDotsInGroups(num2, colors.secondary, colors.glowSecondary, num1 * 0.08, { showLabels: true })}
                </AnimatePresence>
              </div>
              <span style={{ fontSize: '14px', color: '#333', fontWeight: 600 }}>
                总共 = {result}
              </span>
            </motion.div>
          )}
        </div>

        {/* Colored set notation at bottom */}
        {renderColoredSet()}
      </div>
    );
  };

  const renderSubtraction = () => {
    const showFirst = animationPhase !== 'idle';
    const showRemoving = animationPhase === 'showing-second' || animationPhase === 'showing-result';
    const showResult = animationPhase === 'showing-result';
    const resultNum = Math.max(0, num1 - num2);

    // Render colored set notation for subtraction
    const renderSubtractionSet = () => {
      if (!showFirst) return null;

      return (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            fontSize: '16px',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Initial set */}
          <span style={{ color: '#333' }}>{'{'}</span>
          {Array.from({ length: num1 }, (_, i) => (
            <span key={`initial-${i}`}>
              <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
              {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
            </span>
          ))}
          <span style={{ color: '#333' }}>{'}'}</span>

          {/* Minus sign and second set */}
          {showRemoving && (
            <>
              <span style={{ color: colors.primary, fontSize: '20px' }}>-</span>
              <span style={{ color: '#333' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`subtract-${i}`}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{i}</span>
                  {i < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#333' }}>{'}'}</span>
            </>
          )}

          {/* Result set with strikethrough on removed elements */}
          {showResult && (
            <>
              <span style={{ color: '#333', fontSize: '20px' }}>=</span>
              <span style={{ color: '#333' }}>{'{'}</span>
              {Array.from({ length: num1 }, (_, i) => (
                <span key={`result-${i}`}>
                  <span
                    style={{
                      color: i < num2 ? colors.secondary : colors.primary,
                      fontWeight: 700,
                      textDecoration: i < num2 ? 'line-through' : 'none',
                      opacity: i < num2 ? 0.5 : 1,
                    }}
                  >
                    {i}
                  </span>
                  {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#333' }}>{'}'}</span>
            </>
          )}
        </motion.div>
      );
    };

    return (
      <div style={{ ...contentStyle, flexDirection: 'column', gap: '20px' }}>
        {/* Main group showing all items, with faded items being removed */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showFirst ? 1 : 0 }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <AnimatePresence>
              {showFirst &&
                (() => {
                  const allDots: JSX.Element[] = [];
                  const fullGroups = Math.floor(num1 / 5);
                  const remainder = num1 % 5;

                  for (let groupIdx = 0; groupIdx < fullGroups; groupIdx++) {
                    const groupDots = [];
                    for (let i = 0; i < 5; i++) {
                      const globalIdx = groupIdx * 5 + i;
                      const isFaded = showRemoving && globalIdx >= resultNum;
                      groupDots.push(
                        <Dot
                          key={`dot-${globalIdx}`}
                          index={globalIdx}
                          color={colors.primary}
                          glow={colors.glowPrimary}
                          delay={globalIdx * 0.08}
                          isFaded={isFaded}
                          onClick={onInteract}
                          label={`${globalIdx}`}
                        />
                      );
                    }
                    allDots.push(
                      <motion.div
                        key={`group-${groupIdx}`}
                        style={{
                          display: 'flex',
                          gap: '6px',
                          padding: '8px',
                          borderRadius: '12px',
                          background: 'rgba(0,0,0,0.04)',
                          border: '2px solid rgba(0,0,0,0.08)',
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: groupIdx * 0.4 }}
                      >
                        {groupDots}
                      </motion.div>
                    );
                  }

                  if (remainder > 0) {
                    const remainderDots = [];
                    for (let i = 0; i < remainder; i++) {
                      const globalIdx = fullGroups * 5 + i;
                      const isFaded = showRemoving && globalIdx >= resultNum;
                      remainderDots.push(
                        <Dot
                          key={`dot-${globalIdx}`}
                          index={globalIdx}
                          color={colors.primary}
                          glow={colors.glowPrimary}
                          delay={globalIdx * 0.08}
                          isFaded={isFaded}
                          onClick={onInteract}
                          label={`${globalIdx}`}
                        />
                      );
                    }
                    allDots.push(
                      <motion.div
                        key={`group-remainder`}
                        style={{
                          display: 'flex',
                          gap: '6px',
                          padding: '8px',
                          borderRadius: '12px',
                          background: 'rgba(0,0,0,0.04)',
                          border: '2px dashed rgba(0,0,0,0.08)',
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: fullGroups * 0.4 }}
                      >
                        {remainderDots}
                      </motion.div>
                    );
                  }

                  return allDots;
                })()}
            </AnimatePresence>
          </div>
          <span style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>
            {'{'}
            {Array.from({ length: num1 }, (_, i) => i).join(', ')}
            {'}'}
          </span>
          {showRemoving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '12px',
                color: colors.secondary,
                fontWeight: 600,
                padding: '4px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
              }}
            >
              减去 {num2} 个 (虚化部分)
            </motion.div>
          )}
        </motion.div>

        {/* Colored set notation at bottom */}
        {renderSubtractionSet()}
      </div>
    );
  };

  const renderMultiplication = () => {
    const showFirst = animationPhase !== 'idle';
    const showSecond = animationPhase === 'showing-second' || animationPhase === 'showing-result';
    const showResult = animationPhase === 'showing-result';

    // Render colored set notation for multiplication
    const renderMultiplicationSet = () => {
      if (!showFirst) return null;

      return (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            fontSize: '16px',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* First set (blue) */}
          <span style={{ color: '#666' }}>{'{'}</span>
          {Array.from({ length: num1 }, (_, i) => (
            <span key={`num1-${i}`}>
              <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
              {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
            </span>
          ))}
          <span style={{ color: '#666' }}>{'}'}</span>

          {/* Multiplication sign */}
          {showSecond && <span style={{ color: '#666', margin: '0 8px', fontSize: '20px' }}>×</span>}

          {/* Second set (orange for num2) */}
          {showSecond && (
            <>
              <span style={{ color: '#666' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`num2-${i}`}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{i}</span>
                  {i < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#666' }}>{'}'}</span>
            </>
          )}

          {/* Result: repeated sets */}
          {showResult && result !== null && (
            <>
              <span style={{ color: '#666', margin: '0 8px', fontSize: '20px' }}>=</span>
              <span style={{ color: '#666' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, groupIdx) => (
                <span key={`group-${groupIdx}`}>
                  <span style={{ color: '#666' }}>{'{'}</span>
                  {Array.from({ length: num1 }, (_, i) => (
                    <span key={`result-${groupIdx}-${i}`}>
                      <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
                      {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
                    </span>
                  ))}
                  <span style={{ color: '#666' }}>{'}'}</span>
                  {groupIdx < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#666' }}>{'}'}</span>
            </>
          )}
        </motion.div>
      );
    };

    return (
      <div style={{ ...contentStyle, flexDirection: 'column', gap: '20px' }}>
        {/* Visual dots representation */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showFirst ? 1 : 0 }}
        >
          {/* Show num1 groups, each with num2 items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <AnimatePresence>
              {showFirst &&
                Array.from({ length: Math.min(num1, 6) }).map((_, groupIndex) => (
                  <motion.div
                    key={`mul-group-${groupIndex}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.15 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: `${colors.primary}15`,
                        border: `2px solid ${colors.primary}`,
                      }}
                    >
                      {renderDotsInGroups(num2, colors.secondary, colors.glowSecondary, groupIndex * 0.15, {
                        showLabels: false,
                      })}
                    </div>
                    <span style={{ fontSize: '10px', color: colors.primary, fontWeight: 600 }}>
                      第 {groupIndex + 1} 组
                    </span>
                  </motion.div>
                ))}
            </AnimatePresence>
            {num1 > 6 && showFirst && (
              <motion.span
                style={{ color: colors.primary, fontWeight: 600, fontSize: '12px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ... 共 {num1} 组
              </motion.span>
            )}
          </div>
          {showFirst && (
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>
              {num1} 组 × 每组 {num2} 个 = {num1 * num2}
            </span>
          )}
        </motion.div>

        {/* Colored set notation at bottom */}
        {renderMultiplicationSet()}
      </div>
    );
  };

  const renderDivision = () => {
    const showFirst = animationPhase !== 'idle';
    const showSecond = animationPhase === 'showing-second' || animationPhase === 'showing-result';
    const showResult = animationPhase === 'showing-result';
    const quotient = num2 > 0 ? Math.floor(num1 / num2) : 0;
    const remainder = num2 > 0 ? num1 % num2 : num1;

    // Render colored set notation for division
    const renderDivisionSet = () => {
      if (!showFirst) return null;

      return (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            fontSize: '16px',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Dividend set (blue) */}
          <span style={{ color: '#666' }}>{'{'}</span>
          {Array.from({ length: num1 }, (_, i) => (
            <span key={`num1-${i}`}>
              <span style={{ color: colors.primary, fontWeight: 700 }}>{i}</span>
              {i < num1 - 1 && <span style={{ color: '#666' }}>, </span>}
            </span>
          ))}
          <span style={{ color: '#666' }}>{'}'}</span>

          {/* Division sign */}
          {showSecond && <span style={{ color: '#666', margin: '0 8px', fontSize: '20px' }}>÷</span>}

          {/* Divisor set (orange) */}
          {showSecond && (
            <>
              <span style={{ color: '#666' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`num2-${i}`}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{i}</span>
                  {i < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#666' }}>{'}'}</span>
            </>
          )}

          {/* Result: grouped sets */}
          {showResult && (
            <>
              <span style={{ color: '#666', margin: '0 8px', fontSize: '20px' }}>=</span>
              <span style={{ color: '#666' }}>{'{'}</span>
              {Array.from({ length: num2 }, (_, groupIdx) => (
                <span key={`group-${groupIdx}`}>
                  <span style={{ color: '#666' }}>{'{'}</span>
                  {Array.from({ length: quotient }, (_, i) => {
                    const globalIdx = groupIdx * quotient + i;
                    return (
                      <span key={`result-${groupIdx}-${i}`}>
                        <span style={{ color: colors.primary, fontWeight: 700 }}>{globalIdx}</span>
                        {i < quotient - 1 && <span style={{ color: '#666' }}>, </span>}
                      </span>
                    );
                  })}
                  <span style={{ color: '#666' }}>{'}'}</span>
                  {groupIdx < num2 - 1 && <span style={{ color: '#666' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#666' }}>{'}'}</span>
            </>
          )}
        </motion.div>
      );
    };

    return (
      <div style={{ ...contentStyle, flexDirection: 'column', gap: '20px' }}>
        {/* Visual dots representation */}
        {/* Total items before division */}
        {!showSecond && (
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showFirst ? 1 : 0 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <AnimatePresence>
                {showFirst && renderDotsInGroups(num1, colors.primary, colors.glowPrimary, 0, { showLabels: true })}
              </AnimatePresence>
            </div>
            <span style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>
              总共 {num1} 个,要分成 {num2} 组
            </span>
          </motion.div>
        )}

        {/* Division result - items distributed into groups */}
        {showSecond && (
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: Math.min(num2, 6) }).map((_, groupIndex) => (
                <motion.div
                  key={`div-group-${groupIndex}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: groupIndex * 0.15 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '12px',
                      background: `${colors.primary}15`,
                      border: `2px solid ${colors.primary}`,
                      justifyContent: 'center',
                    }}
                  >
                    {renderDotsInGroups(quotient, colors.secondary, colors.glowSecondary, groupIndex * 0.15, {
                      showLabels: false,
                    })}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.primary, fontWeight: 600 }}>
                    第 {groupIndex + 1} 组
                  </span>
                </motion.div>
              ))}
              {num2 > 6 && (
                <motion.span
                  style={{ color: colors.primary, fontWeight: 600, alignSelf: 'center' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ... 共 {num2} 组
                </motion.span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>
              每组 {quotient} 个
            </span>
            {remainder > 0 && showResult && (
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(156, 163, 175, 0.15)',
                  border: '2px dashed #9ca3af',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  {Array.from({ length: remainder }).map((_, i) => (
                    <Dot
                      key={`remainder-${i}`}
                      index={i}
                      color="#9ca3af"
                      glow="rgba(156, 163, 175, 0.3)"
                      delay={0.5 + i * 0.05}
                      onClick={onInteract}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>余 {remainder} 个</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Colored set notation at bottom */}
        {renderDivisionSet()}
      </div>
    );
  };

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
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div style={headerStyle}>
        <Icon icon="mdi:cube" width={20} />
        <span>具体 (Concrete)</span>
        <motion.div
          style={{
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.primary,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {renderContent()}
    </motion.div>
  );
}
