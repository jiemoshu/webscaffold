'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { compile, evaluateCompiled } from '../calculator/CalculatorEngine';
import type { FunctionConfig } from '../graphing/Graph2D';

interface FunctionTableProps {
  functions: FunctionConfig[];
}

export default function FunctionTable({ functions }: FunctionTableProps) {
  const [startX, setStartX] = useState(-10);
  const [endX, setEndX] = useState(10);
  const [step, setStep] = useState(1);

  // Generate table data
  const tableData = useMemo(() => {
    const visibleFunctions = functions.filter(
      (f) => f.visible && f.expression.trim()
    );
    const rows: { x: number; values: (number | string)[] }[] = [];

    // Compile all functions once
    const compiledFunctions = visibleFunctions.map((f) => {
      try {
        return compile(f.expression);
      } catch {
        return null;
      }
    });

    // Generate rows
    const actualStep = Math.max(0.001, Math.abs(step));
    const numSteps = Math.min(1000, Math.abs((endX - startX) / actualStep));

    for (let i = 0; i <= numSteps; i++) {
      const x = startX + i * actualStep;
      const values = compiledFunctions.map((compiled) => {
        if (!compiled) return 'Error';
        try {
          const y = evaluateCompiled(compiled, { x });
          if (!isFinite(y)) return 'Undefined';
          return y;
        } catch {
          return 'Error';
        }
      });
      rows.push({ x, values });
    }

    return { functions: visibleFunctions, rows };
  }, [functions, startX, endX, step]);

  const exportCSV = useCallback(() => {
    const headers = ['x', ...tableData.functions.map((f) => f.name)];
    const rows = tableData.rows.map((row) => [
      row.x.toString(),
      ...row.values.map((v) =>
        typeof v === 'number' ? v.toPrecision(10) : v
      ),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'function_table.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [tableData]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '12px',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '12px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    width: '80px',
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: 'auto',
  };

  const tableContainerStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    background: '#f9fafb',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderBottom: '1px solid #f3f4f6',
    fontFamily: '"SF Mono", monospace',
  };

  const formatValue = (v: number | string): string => {
    if (typeof v === 'string') return v;
    if (Math.abs(v) < 0.0001 && v !== 0) return v.toExponential(4);
    return v.toFixed(6).replace(/\.?0+$/, '');
  };

  const isSpecialValue = (v: number | string, x: number): boolean => {
    if (typeof v !== 'number') return false;
    // Check if close to zero
    if (Math.abs(v) < 1e-10) return true;
    // Check if at integer x
    if (Math.abs(x - Math.round(x)) < 1e-10) return true;
    return false;
  };

  if (tableData.functions.length === 0) {
    return (
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#9ca3af',
          gap: '12px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Icon icon="mdi:table-off" width={48} />
        <p>Add a function in the 2D Graph tab to see its values here</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Controls */}
      <div style={controlsStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Start X:</label>
          <input
            type="number"
            value={startX}
            onChange={(e) => setStartX(parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>End X:</label>
          <input
            type="number"
            value={endX}
            onChange={(e) => setEndX(parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Step:</label>
          <input
            type="number"
            value={step}
            onChange={(e) => setStep(parseFloat(e.target.value) || 1)}
            style={inputStyle}
            min="0.001"
            step="0.1"
          />
        </div>
        <motion.button
          style={buttonStyle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportCSV}
        >
          <Icon icon="mdi:download" width={18} />
          Export CSV
        </motion.button>
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>x</th>
              {tableData.functions.map((f) => (
                <th key={f.id} style={{ ...thStyle, color: f.color }}>
                  {f.name} = {f.expression}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                }}
              >
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  {formatValue(row.x)}
                </td>
                {row.values.map((v, j) => (
                  <td
                    key={j}
                    style={{
                      ...tdStyle,
                      color:
                        typeof v === 'string'
                          ? '#ef4444'
                          : isSpecialValue(v, row.x)
                            ? '#3b82f6'
                            : '#333',
                      fontWeight: isSpecialValue(v, row.x) ? 600 : 400,
                    }}
                  >
                    {formatValue(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
