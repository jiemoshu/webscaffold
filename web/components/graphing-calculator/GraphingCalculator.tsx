'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

import ExpressionDisplay from './calculator/ExpressionDisplay';
import ScientificKeyboard from './calculator/ScientificKeyboard';
import { evaluate, CalculationResult } from './calculator/CalculatorEngine';
import FunctionTable from './tables/FunctionTable';
import EquationSolver from './solver/EquationSolver';
import GeometryCalculator from './geometry/GeometryCalculator';
import type { FunctionConfig } from './graphing/Graph2D';

// Dynamic imports for heavy components
const Graph2D = dynamic(() => import('./graphing/Graph2D'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Icon icon="mdi:loading" width={32} className="animate-spin" />
    </div>
  ),
});

const Graph3D = dynamic(() => import('./graphing/Graph3D'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Icon icon="mdi:loading" width={32} className="animate-spin" />
    </div>
  ),
});

type TabType = 'calculator' | 'graph2d' | 'graph3d' | 'table' | 'solver' | 'geometry';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'calculator', label: 'Calculator', icon: 'mdi:calculator' },
  { id: 'graph2d', label: '2D Graph', icon: 'mdi:chart-line' },
  { id: 'graph3d', label: '3D Graph', icon: 'mdi:cube-outline' },
  { id: 'table', label: 'Table', icon: 'mdi:table' },
  { id: 'solver', label: 'Solver', icon: 'mdi:function' },
  { id: 'geometry', label: 'Geometry', icon: 'mdi:shape' },
];

export default function GraphingCalculator() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<CalculationResult>({
    value: '0',
    numericValue: 0,
    isComplex: false,
  });
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [functions, setFunctions] = useState<FunctionConfig[]>([
    { id: 'f1', expression: 'sin(x)', color: '#ef4444', visible: true, name: 'y1' },
  ]);
  const [expression3d, setExpression3d] = useState('sin(sqrt(x^2 + y^2))');
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard input
  const handleInput = useCallback((value: string) => {
    setExpression((prev) => prev + value);
  }, []);

  const handleClear = useCallback(() => {
    setExpression('');
    setResult({ value: '0', numericValue: 0, isComplex: false });
  }, []);

  const handleBackspace = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
  }, []);

  const handleEquals = useCallback(() => {
    if (!expression.trim()) return;

    const calcResult = evaluate(expression);
    setResult(calcResult);

    if (!calcResult.error) {
      setHistory((prev) => [
        { expr: expression, result: calcResult.value },
        ...prev.slice(0, 49),
      ]);
    }
  }, [expression]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fef7ff 50%, #fff7ed 100%)',
    padding: isMobile ? '12px' : '24px',
  };

  const calculatorContainerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'linear-gradient(145deg, #2c3e50, #34495e)',
    borderRadius: '24px',
    padding: isMobile ? '16px' : '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#fff',
  };

  const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.1)',
    padding: '4px',
    borderRadius: '12px',
    overflowX: 'auto',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: isMobile ? '8px 12px' : '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: active
      ? 'linear-gradient(135deg, #667eea, #764ba2)'
      : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  });

  const contentStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: activeTab === 'calculator' && !isMobile ? 'minmax(280px, 380px) 1fr' : '1fr',
    gap: '20px',
    minHeight: isMobile ? '500px' : '600px',
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle}>
      <div style={calculatorContainerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <Icon icon="mdi:calculator-variant" width={32} />
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: 600 }}>
                Graphing Calculator
              </h1>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
                Advanced scientific computing
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={tabContainerStyle}>
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                style={tabStyle(activeTab === tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon icon={tab.icon} width={18} />
                {!isMobile && tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <AnimatePresence mode="wait">
            {activeTab === 'calculator' && (
              <>
                {/* Calculator Panel */}
                <motion.div
                  key="calc-keyboard"
                  style={panelStyle}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExpressionDisplay
                    expression={expression}
                    result={result.value}
                    error={result.error}
                    onExpressionChange={setExpression}
                    onSubmit={handleEquals}
                  />
                  <ScientificKeyboard
                    onInput={handleInput}
                    onClear={handleClear}
                    onBackspace={handleBackspace}
                    onEquals={handleEquals}
                    angleMode={angleMode}
                    onAngleModeChange={setAngleMode}
                  />
                </motion.div>

                {/* History Panel */}
                {!isMobile && (
                  <motion.div
                    key="calc-history"
                    style={panelStyle}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3
                      style={{
                        margin: '0 0 12px 0',
                        color: '#fff',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Icon icon="mdi:history" width={20} />
                      History
                    </h3>
                    <div
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {history.length === 0 ? (
                        <div
                          style={{
                            color: 'rgba(255,255,255,0.5)',
                            textAlign: 'center',
                            padding: '40px',
                          }}
                        >
                          <Icon icon="mdi:calculator" width={48} />
                          <p>Your calculations will appear here</p>
                        </div>
                      ) : (
                        history.map((item, index) => (
                          <motion.div
                            key={index}
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              padding: '12px',
                              cursor: 'pointer',
                            }}
                            whileHover={{ background: 'rgba(255,255,255,0.15)' }}
                            onClick={() => setExpression(item.expr)}
                          >
                            <div
                              style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                fontFamily: '"SF Mono", monospace',
                              }}
                            >
                              {item.expr}
                            </div>
                            <div
                              style={{
                                color: '#22c55e',
                                fontSize: '18px',
                                fontWeight: 600,
                                fontFamily: '"SF Mono", monospace',
                                marginTop: '4px',
                              }}
                            >
                              = {item.result}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {activeTab === 'graph2d' && (
              <motion.div
                key="graph2d"
                style={panelStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Graph2D functions={functions} onFunctionsChange={setFunctions} />
              </motion.div>
            )}

            {activeTab === 'graph3d' && (
              <motion.div
                key="graph3d"
                style={panelStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Graph3D expression={expression3d} onExpressionChange={setExpression3d} />
              </motion.div>
            )}

            {activeTab === 'table' && (
              <motion.div
                key="table"
                style={panelStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <FunctionTable functions={functions} />
              </motion.div>
            )}

            {activeTab === 'solver' && (
              <motion.div
                key="solver"
                style={panelStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <EquationSolver />
              </motion.div>
            )}

            {activeTab === 'geometry' && (
              <motion.div
                key="geometry"
                style={panelStyle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <GeometryCalculator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
          }}
        >
          <span>Precision: 64-bit</span>
          <span>Mode: {angleMode.toUpperCase()}</span>
          <span>Powered by mathjs</span>
        </div>
      </div>
    </div>
  );
}
