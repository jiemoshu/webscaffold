'use client';

import React, { useMemo, useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { compile, evaluateCompiled } from '../calculator/CalculatorEngine';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface FunctionConfig {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  name: string;
}

interface Graph2DProps {
  functions: FunctionConfig[];
  onFunctionsChange: (functions: FunctionConfig[]) => void;
}

const COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export default function Graph2D({
  functions,
  onFunctionsChange,
}: Graph2DProps) {
  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);
  const [yRange, setYRange] = useState<[number, number]>([-10, 10]);
  const [resolution, setResolution] = useState(500);
  const newFunctionRef = useRef<HTMLInputElement>(null);

  // Generate plot data for all functions
  const plotData = useMemo(() => {
    return functions
      .filter((f) => f.visible && f.expression.trim())
      .map((func) => {
        const xValues: number[] = [];
        const yValues: number[] = [];

        try {
          const compiled = compile(func.expression);
          const step = (xRange[1] - xRange[0]) / resolution;

          for (let x = xRange[0]; x <= xRange[1]; x += step) {
            const y = evaluateCompiled(compiled, { x });
            if (isFinite(y) && Math.abs(y) < 1e10) {
              xValues.push(x);
              yValues.push(y);
            } else {
              // Add NaN to break the line at discontinuities
              xValues.push(x);
              yValues.push(NaN);
            }
          }
        } catch {
          // Invalid expression
        }

        return {
          x: xValues,
          y: yValues,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: func.name || func.expression,
          line: { color: func.color, width: 2 },
          hovertemplate: `${func.name || 'y'}: %{y:.4f}<extra></extra>`,
        };
      });
  }, [functions, xRange, resolution]);

  const layout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 50, r: 20, t: 20, b: 50 },
      xaxis: {
        range: xRange,
        zeroline: true,
        zerolinecolor: '#888',
        gridcolor: '#e5e7eb',
        title: { text: 'x' },
      },
      yaxis: {
        range: yRange,
        zeroline: true,
        zerolinecolor: '#888',
        gridcolor: '#e5e7eb',
        title: { text: 'y' },
        scaleanchor: 'x' as const,
        scaleratio: 1,
      },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white',
      showlegend: functions.length > 1,
      legend: { x: 0, y: 1, bgcolor: 'rgba(255,255,255,0.8)' },
      dragmode: 'pan' as const,
    }),
    [xRange, yRange, functions.length]
  );

  const config = {
    responsive: true,
    scrollZoom: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'select2d',
      'lasso2d',
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
    ] as (
      | 'select2d'
      | 'lasso2d'
      | 'autoScale2d'
      | 'hoverClosestCartesian'
      | 'hoverCompareCartesian'
    )[],
  };

  const addFunction = useCallback(() => {
    const newId = `f${Date.now()}`;
    const colorIndex = functions.length % COLORS.length;
    onFunctionsChange([
      ...functions,
      {
        id: newId,
        expression: '',
        color: COLORS[colorIndex],
        visible: true,
        name: `y${functions.length + 1}`,
      },
    ]);
    setTimeout(() => newFunctionRef.current?.focus(), 100);
  }, [functions, onFunctionsChange]);

  const updateFunction = useCallback(
    (id: string, updates: Partial<FunctionConfig>) => {
      onFunctionsChange(
        functions.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [functions, onFunctionsChange]
  );

  const removeFunction = useCallback(
    (id: string) => {
      onFunctionsChange(functions.filter((f) => f.id !== id));
    },
    [functions, onFunctionsChange]
  );

  const resetView = useCallback(() => {
    setXRange([-10, 10]);
    setYRange([-10, 10]);
  }, []);

  const handleRelayout = useCallback(
    (event: Record<string, unknown>) => {
      if (event['xaxis.range[0]'] !== undefined) {
        setXRange([
          event['xaxis.range[0]'] as number,
          event['xaxis.range[1]'] as number,
        ]);
      }
      if (event['yaxis.range[0]'] !== undefined) {
        setYRange([
          event['yaxis.range[0]'] as number,
          event['yaxis.range[1]'] as number,
        ]);
      }
    },
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '12px',
  };

  const graphContainerStyle: React.CSSProperties = {
    flex: 1,
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    minHeight: '300px',
  };

  const functionsListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const functionRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: '"SF Mono", monospace',
    outline: 'none',
  };

  const colorDotStyle = (color: string): React.CSSProperties => ({
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: color,
    cursor: 'pointer',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  });

  const iconButtonStyle: React.CSSProperties = {
    padding: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Controls */}
      <div style={controlsStyle}>
        <motion.button
          style={buttonStyle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addFunction}
        >
          <Icon icon="mdi:plus" width={18} />
          Add Function
        </motion.button>
        <motion.button
          style={{ ...buttonStyle, background: '#6b7280' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetView}
        >
          <Icon icon="mdi:fit-to-screen" width={18} />
          Reset View
        </motion.button>
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            marginLeft: 'auto',
          }}
        >
          Scroll to zoom, drag to pan
        </div>
      </div>

      {/* Function List */}
      <div style={functionsListStyle}>
        {functions.map((func, index) => (
          <motion.div
            key={func.id}
            style={functionRowStyle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
              type="color"
              value={func.color}
              onChange={(e) =>
                updateFunction(func.id, { color: e.target.value })
              }
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                cursor: 'pointer',
              }}
            />
            <span
              style={{ fontSize: '14px', fontWeight: 500, minWidth: '24px' }}
            >
              {func.name}=
            </span>
            <input
              ref={index === functions.length - 1 ? newFunctionRef : undefined}
              type="text"
              value={func.expression}
              onChange={(e) =>
                updateFunction(func.id, { expression: e.target.value })
              }
              placeholder="e.g., sin(x), x^2, 1/x"
              style={inputStyle}
            />
            <button
              style={iconButtonStyle}
              onClick={() =>
                updateFunction(func.id, { visible: !func.visible })
              }
            >
              <Icon
                icon={func.visible ? 'mdi:eye' : 'mdi:eye-off'}
                width={20}
                color={func.visible ? '#22c55e' : '#9ca3af'}
              />
            </button>
            <button
              style={iconButtonStyle}
              onClick={() => removeFunction(func.id)}
            >
              <Icon icon="mdi:close" width={20} color="#ef4444" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Graph */}
      <div style={graphContainerStyle}>
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          onRelayout={handleRelayout}
        />
      </div>
    </motion.div>
  );
}
