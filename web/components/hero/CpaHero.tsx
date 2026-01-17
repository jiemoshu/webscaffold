'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import Calculator, { OperationType, operatorSymbols } from '../cpa/Calculator';
import CLayer from '../cpa/CLayer';
import PLayer from '../cpa/PLayer';
import ALayer from '../cpa/ALayer';

type AnimationPhase = 'idle' | 'showing-first' | 'showing-second' | 'showing-result';

interface MathExpression {
  num1: number;
  num2: number;
  operation: OperationType;
  result: number;
}

// Generate random expression with educational constraints
function generateRandomExpression(): MathExpression {
  const operations: OperationType[] = ['add', 'subtract', 'multiply', 'divide'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1: number, num2: number, result: number;

  switch (operation) {
    case 'add':
      num1 = Math.floor(Math.random() * 8) + 1; // 1-8
      num2 = Math.floor(Math.random() * (10 - num1)) + 1; // 1 to (10-num1)
      result = num1 + num2;
      break;

    case 'subtract':
      num1 = Math.floor(Math.random() * 9) + 2; // 2-10
      num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1
      result = num1 - num2;
      break;

    case 'multiply':
      // Left operand must be single digit (1-9)
      num1 = Math.floor(Math.random() * 9) + 1; // 1-9
      num2 = Math.floor(Math.random() * 9) + 1; // 1-9
      result = num1 * num2;
      break;

    case 'divide':
      // Dividend (num1) max 2 digits (1-99)
      num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (divisor)
      result = Math.floor(Math.random() * 9) + 1; // 1-9 (quotient)
      num1 = num2 * result; // Ensure clean division, max 81
      break;

    default:
      num1 = 5;
      num2 = 3;
      result = 8;
  }

  return { num1, num2, operation, result };
}

// Calculate result for user input
function calculateResult(num1: number, num2: number, operation: OperationType): number {
  switch (operation) {
    case 'add':
      return num1 + num2;
    case 'subtract':
      return Math.max(0, num1 - num2);
    case 'multiply':
      return num1 * num2;
    case 'divide':
      return num2 !== 0 ? Math.floor(num1 / num2) : 0;
    default:
      return 0;
  }
}

export default function CpaHero() {
  // Mode state
  const [isUserMode, setIsUserMode] = useState(false);

  // Expression state
  const [currentExpression, setCurrentExpression] = useState<MathExpression>(() =>
    generateRandomExpression()
  );

  // Animation phase
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');

  // User input state
  const [userInput, setUserInput] = useState({
    num1: '',
    num2: '',
    operation: null as OperationType | null,
    waitingForSecondNumber: false,
  });

  // Display expression for calculator
  const [displayExpression, setDisplayExpression] = useState('');

  // Refs for timers
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  // Start auto-play animation sequence
  const startAutoPlaySequence = useCallback(() => {
    if (isUserMode) return;

    clearAllTimers();

    // Generate new expression
    const newExpression = generateRandomExpression();
    setCurrentExpression(newExpression);
    setAnimationPhase('idle');

    // Phase 1: Show first number (after 1500ms - 3x slower)
    autoPlayTimerRef.current = setTimeout(() => {
      setAnimationPhase('showing-first');

      // Phase 2: Show operation and second number (after 3.6s - 3x slower)
      phaseTimerRef.current = setTimeout(() => {
        setAnimationPhase('showing-second');

        // Phase 3: Show result (after 3.6s - 3x slower)
        phaseTimerRef.current = setTimeout(() => {
          setAnimationPhase('showing-result');

          // Wait and start next sequence (after 7s - original 2s + 5s extra gap)
          phaseTimerRef.current = setTimeout(() => {
            startAutoPlaySequence();
          }, 7000);
        }, 3600);
      }, 3600);
    }, 1500);
  }, [isUserMode, clearAllTimers]);

  // Switch to user mode
  const switchToUserMode = useCallback(() => {
    clearAllTimers();
    setIsUserMode(true);
    setAnimationPhase('idle');
    setUserInput({
      num1: '',
      num2: '',
      operation: null,
      waitingForSecondNumber: false,
    });
    setDisplayExpression('');
  }, [clearAllTimers]);

  // Switch back to auto-play mode
  const switchToAutoMode = useCallback(() => {
    setIsUserMode(false);
    setUserInput({
      num1: '',
      num2: '',
      operation: null,
      waitingForSecondNumber: false,
    });
    setDisplayExpression('');
  }, []);

  // Handle number press (user mode)
  const handleNumberPress = useCallback(
    (num: number) => {
      if (!isUserMode) {
        switchToUserMode();
        setUserInput((prev) => ({
          ...prev,
          num1: num.toString(),
        }));
        setDisplayExpression(num.toString());
        setAnimationPhase('showing-first');
        setCurrentExpression((prev) => ({
          ...prev,
          num1: num,
          num2: 0,
          result: num,
        }));
        return;
      }

      setUserInput((prev) => {
        if (!prev.waitingForSecondNumber) {
          // Building first number
          // For division: allow max 2 digits
          const maxDigits = prev.operation === 'divide' ? 2 : 2;
          const newNum1 = prev.num1.length < maxDigits ? prev.num1 + num : prev.num1;
          setDisplayExpression(newNum1);
          setCurrentExpression((exp) => ({
            ...exp,
            num1: parseInt(newNum1) || 0,
          }));
          setAnimationPhase('showing-first');
          return { ...prev, num1: newNum1 };
        } else {
          // Building second number
          // For multiplication: left operand is num1, it should be single digit
          const maxDigits = 2;
          const newNum2 = prev.num2.length < maxDigits ? prev.num2 + num : prev.num2;
          const opSymbol = prev.operation ? operatorSymbols[prev.operation] : '';
          setDisplayExpression(`${prev.num1} ${opSymbol} ${newNum2}`);
          setCurrentExpression((exp) => ({
            ...exp,
            num2: parseInt(newNum2) || 0,
          }));
          setAnimationPhase('showing-second');
          return { ...prev, num2: newNum2 };
        }
      });
    },
    [isUserMode, switchToUserMode]
  );

  // Handle operator press (user mode)
  const handleOperatorPress = useCallback(
    (op: OperationType) => {
      if (!isUserMode) {
        switchToUserMode();
        return;
      }

      if (userInput.num1) {
        const num1Value = parseInt(userInput.num1);

        // Validate constraints
        if (op === 'multiply' && num1Value > 9) {
          // Multiplication: left operand must be single digit
          return;
        }
        if (op === 'divide' && num1Value > 99) {
          // Division: dividend must be max 2 digits
          return;
        }

        const opSymbol = operatorSymbols[op];
        setDisplayExpression(`${userInput.num1} ${opSymbol}`);
        setUserInput((prev) => ({
          ...prev,
          operation: op,
          waitingForSecondNumber: true,
        }));
        setCurrentExpression((exp) => ({
          ...exp,
          operation: op,
        }));
        setAnimationPhase('showing-first');
      }
    },
    [isUserMode, switchToUserMode, userInput.num1]
  );

  // Handle equals press (user mode)
  const handleEquals = useCallback(() => {
    if (!isUserMode) {
      switchToUserMode();
      return;
    }

    const { num1, num2, operation } = userInput;
    if (num1 && num2 && operation) {
      const n1 = parseInt(num1);
      const n2 = parseInt(num2);
      const result = calculateResult(n1, n2, operation);

      setCurrentExpression({
        num1: n1,
        num2: n2,
        operation,
        result,
      });
      setAnimationPhase('showing-result');

      const opSymbol = operatorSymbols[operation];
      setDisplayExpression(`${num1} ${opSymbol} ${num2} = ${result}`);
    }
  }, [isUserMode, switchToUserMode, userInput]);

  // Handle clear
  const handleClear = useCallback(() => {
    if (isUserMode) {
      setUserInput({
        num1: '',
        num2: '',
        operation: null,
        waitingForSecondNumber: false,
      });
      setDisplayExpression('');
      setAnimationPhase('idle');
      setCurrentExpression(generateRandomExpression());
    }
  }, [isUserMode]);

  // Handle interaction with CPA layers
  const handleLayerInteract = useCallback(() => {
    if (!isUserMode) {
      switchToUserMode();
    }
  }, [isUserMode, switchToUserMode]);

  // Start auto-play on mount and when switching modes
  useEffect(() => {
    if (!isUserMode) {
      startAutoPlaySequence();
    }

    return () => {
      clearAllTimers();
    };
  }, [isUserMode, startAutoPlaySequence, clearAllTimers]);

  // Update display expression for auto-play mode
  useEffect(() => {
    if (!isUserMode) {
      const { num1, num2, operation, result } = currentExpression;
      const opSymbol = operatorSymbols[operation];

      switch (animationPhase) {
        case 'idle':
          setDisplayExpression('');
          break;
        case 'showing-first':
          setDisplayExpression(`${num1}`);
          break;
        case 'showing-second':
          setDisplayExpression(`${num1} ${opSymbol} ${num2}`);
          break;
        case 'showing-result':
          setDisplayExpression(`${num1} ${opSymbol} ${num2} = ${result}`);
          break;
      }
    }
  }, [isUserMode, currentExpression, animationPhase]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fef7ff 50%, #fff7ed 100%)',
    position: 'relative',
    overflow: 'hidden',
  };

  const backgroundDecorationStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  const contentWrapperStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
    paddingTop: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'clamp(28px, 5vw, 48px)',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'clamp(14px, 2.5vw, 18px)',
    color: '#64748b',
    fontWeight: 500,
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 350px) 1fr',
    gap: '32px',
    alignItems: 'start',
  };

  const mobileContentStyle: React.CSSProperties = {
    ...mainContentStyle,
    gridTemplateColumns: '1fr',
  };

  const calculatorSectionStyle: React.CSSProperties = {
    position: 'sticky',
    top: '24px',
  };

  const visualizationSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const modeToggleStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '16px',
  };

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '25px',
    border: 'none',
    background: active
      ? 'linear-gradient(135deg, #667eea, #764ba2)'
      : 'rgba(255,255,255,0.8)',
    color: active ? '#fff' : '#666',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: active
      ? '0 4px 15px rgba(102, 126, 234, 0.4)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  });

  // Check if mobile layout
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Background decorations */}
      <div style={backgroundDecorationStyle}>
        {/* Floating shapes */}
        <motion.div
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '120px',
            height: '120px',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            top: '60%',
            right: '8%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
          }}
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '15%',
            width: '60px',
            height: '60px',
            borderRadius: '20%',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(202, 138, 4, 0.1))',
            transform: 'rotate(45deg)',
          }}
          animate={{
            rotate: [45, 55, 45],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            width: '100px',
            height: '100px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.08))',
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />

        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div style={contentWrapperStyle}>
        {/* Header */}
        <motion.header
          style={headerStyle}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={titleStyle}>
            <Icon icon="mdi:calculator-variant" style={{ verticalAlign: 'middle', marginRight: '12px' }} />
            CPA 数学可视化
          </h1>
          <p style={subtitleStyle}>
            具体 (Concrete) → 图像 (Pictorial) → 抽象 (Abstract)
          </p>

          {/* Mode toggle */}
          <div style={modeToggleStyle}>
            <motion.button
              style={toggleButtonStyle(!isUserMode)}
              onClick={switchToAutoMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon icon="mdi:play-circle" width={18} />
              自动演示
            </motion.button>
            <motion.button
              style={toggleButtonStyle(isUserMode)}
              onClick={switchToUserMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon icon="mdi:hand-pointing-up" width={18} />
              互动模式
            </motion.button>
          </div>
        </motion.header>

        {/* Main content */}
        <div style={isMobile ? mobileContentStyle : mainContentStyle}>
          {/* Calculator section */}
          <motion.section
            style={calculatorSectionStyle}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Calculator
              onNumberPress={handleNumberPress}
              onOperatorPress={handleOperatorPress}
              onEquals={handleEquals}
              onClear={handleClear}
              currentExpression={displayExpression}
              isUserMode={isUserMode}
            />

            {/* Instruction card */}
            <motion.div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon icon="mdi:information" width={18} color="#667eea" />
                <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                  {isUserMode ? '互动模式说明' : '自动演示说明'}
                </span>
              </div>
              <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {isUserMode
                  ? '点击数字和运算符按钮输入算式，观察 CPA 三层同步变化。点击等号查看结果。'
                  : '系统正在自动播放随机算式动画。点击任意按钮或动画元素即可切换到互动模式。'}
              </p>
            </motion.div>
          </motion.section>

          {/* Visualization section */}
          <section style={visualizationSectionStyle}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentExpression.num1}-${currentExpression.num2}-${currentExpression.operation}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* C Layer - Concrete */}
                <CLayer
                  num1={currentExpression.num1}
                  num2={currentExpression.num2}
                  operation={currentExpression.operation}
                  result={animationPhase === 'showing-result' ? currentExpression.result : null}
                  animationPhase={animationPhase}
                  onInteract={handleLayerInteract}
                />

                {/* P Layer - Pictorial */}
                <PLayer
                  num1={currentExpression.num1}
                  num2={currentExpression.num2}
                  operation={currentExpression.operation}
                  result={animationPhase === 'showing-result' ? currentExpression.result : null}
                  animationPhase={animationPhase}
                  onInteract={handleLayerInteract}
                />

                {/* A Layer - Abstract */}
                <ALayer
                  num1={currentExpression.num1}
                  num2={currentExpression.num2}
                  operation={currentExpression.operation}
                  result={animationPhase === 'showing-result' ? currentExpression.result : null}
                  animationPhase={animationPhase}
                  onInteract={handleLayerInteract}
                />
              </motion.div>
            </AnimatePresence>
          </section>
        </div>

        {/* Footer info */}
        <motion.footer
          style={{
            textAlign: 'center',
            padding: '24px',
            marginTop: 'auto',
            color: '#94a3b8',
            fontSize: '13px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon icon="mdi:cube" width={16} color="#22c55e" />
              具体：圆点和方块
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon icon="mdi:chart-bar" width={16} color="#3b82f6" />
              图像：条形图和饼图
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon icon="mdi:function-variant" width={16} color="#764ba2" />
              抽象：数学公式
            </span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
