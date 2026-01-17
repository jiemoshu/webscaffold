'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

type Shape2D =
  | 'circle'
  | 'triangle'
  | 'rectangle'
  | 'square'
  | 'ellipse'
  | 'polygon'
  | 'trapezoid';
type Shape3D =
  | 'sphere'
  | 'cube'
  | 'cylinder'
  | 'cone'
  | 'pyramid'
  | 'prism'
  | 'torus';
type ShapeType = Shape2D | Shape3D;

interface ShapeConfig {
  name: string;
  icon: string;
  params: { key: string; label: string; unit: string }[];
  is3D: boolean;
}

const SHAPES: Record<ShapeType, ShapeConfig> = {
  // 2D Shapes
  circle: {
    name: 'Circle',
    icon: 'mdi:circle-outline',
    params: [{ key: 'r', label: 'Radius', unit: '' }],
    is3D: false,
  },
  triangle: {
    name: 'Triangle',
    icon: 'mdi:triangle-outline',
    params: [
      { key: 'a', label: 'Side a', unit: '' },
      { key: 'b', label: 'Side b', unit: '' },
      { key: 'c', label: 'Side c', unit: '' },
    ],
    is3D: false,
  },
  rectangle: {
    name: 'Rectangle',
    icon: 'mdi:rectangle-outline',
    params: [
      { key: 'w', label: 'Width', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: false,
  },
  square: {
    name: 'Square',
    icon: 'mdi:square-outline',
    params: [{ key: 's', label: 'Side', unit: '' }],
    is3D: false,
  },
  ellipse: {
    name: 'Ellipse',
    icon: 'mdi:ellipse-outline',
    params: [
      { key: 'a', label: 'Semi-major axis', unit: '' },
      { key: 'b', label: 'Semi-minor axis', unit: '' },
    ],
    is3D: false,
  },
  polygon: {
    name: 'Regular Polygon',
    icon: 'mdi:hexagon-outline',
    params: [
      { key: 'n', label: 'Number of sides', unit: '' },
      { key: 's', label: 'Side length', unit: '' },
    ],
    is3D: false,
  },
  trapezoid: {
    name: 'Trapezoid',
    icon: 'mdi:shape-outline',
    params: [
      { key: 'a', label: 'Top base', unit: '' },
      { key: 'b', label: 'Bottom base', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: false,
  },
  // 3D Shapes
  sphere: {
    name: 'Sphere',
    icon: 'mdi:sphere',
    params: [{ key: 'r', label: 'Radius', unit: '' }],
    is3D: true,
  },
  cube: {
    name: 'Cube',
    icon: 'mdi:cube-outline',
    params: [{ key: 's', label: 'Side', unit: '' }],
    is3D: true,
  },
  cylinder: {
    name: 'Cylinder',
    icon: 'mdi:cylinder',
    params: [
      { key: 'r', label: 'Radius', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: true,
  },
  cone: {
    name: 'Cone',
    icon: 'mdi:cone',
    params: [
      { key: 'r', label: 'Radius', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: true,
  },
  pyramid: {
    name: 'Square Pyramid',
    icon: 'mdi:pyramid',
    params: [
      { key: 's', label: 'Base side', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: true,
  },
  prism: {
    name: 'Rectangular Prism',
    icon: 'mdi:cube-scan',
    params: [
      { key: 'l', label: 'Length', unit: '' },
      { key: 'w', label: 'Width', unit: '' },
      { key: 'h', label: 'Height', unit: '' },
    ],
    is3D: true,
  },
  torus: {
    name: 'Torus',
    icon: 'mdi:torus',
    params: [
      { key: 'R', label: 'Major radius', unit: '' },
      { key: 'r', label: 'Minor radius', unit: '' },
    ],
    is3D: true,
  },
};

interface CalculationResult {
  name: string;
  value: number;
  formula: string;
}

function calculate(
  shape: ShapeType,
  params: Record<string, number>
): CalculationResult[] {
  const results: CalculationResult[] = [];
  const PI = Math.PI;

  switch (shape) {
    case 'circle': {
      const { r } = params;
      results.push({
        name: 'Area',
        value: PI * r * r,
        formula: 'πr²',
      });
      results.push({
        name: 'Circumference',
        value: 2 * PI * r,
        formula: '2πr',
      });
      results.push({
        name: 'Diameter',
        value: 2 * r,
        formula: '2r',
      });
      break;
    }

    case 'triangle': {
      const { a, b, c } = params;
      const s = (a + b + c) / 2; // semi-perimeter
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c)); // Heron's formula
      results.push({
        name: 'Area',
        value: area,
        formula: '√(s(s-a)(s-b)(s-c))',
      });
      results.push({
        name: 'Perimeter',
        value: a + b + c,
        formula: 'a + b + c',
      });
      results.push({
        name: 'Semi-perimeter',
        value: s,
        formula: '(a+b+c)/2',
      });
      break;
    }

    case 'rectangle': {
      const { w, h } = params;
      results.push({ name: 'Area', value: w * h, formula: 'w × h' });
      results.push({ name: 'Perimeter', value: 2 * (w + h), formula: '2(w+h)' });
      results.push({
        name: 'Diagonal',
        value: Math.sqrt(w * w + h * h),
        formula: '√(w² + h²)',
      });
      break;
    }

    case 'square': {
      const { s } = params;
      results.push({ name: 'Area', value: s * s, formula: 's²' });
      results.push({ name: 'Perimeter', value: 4 * s, formula: '4s' });
      results.push({
        name: 'Diagonal',
        value: s * Math.sqrt(2),
        formula: 's√2',
      });
      break;
    }

    case 'ellipse': {
      const { a, b } = params;
      results.push({ name: 'Area', value: PI * a * b, formula: 'πab' });
      // Ramanujan approximation for perimeter
      const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
      results.push({
        name: 'Perimeter (approx)',
        value: PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))),
        formula: 'π(a+b)(1+3h/(10+√(4-3h)))',
      });
      break;
    }

    case 'polygon': {
      const { n, s } = params;
      const area = (n * s * s) / (4 * Math.tan(PI / n));
      results.push({
        name: 'Area',
        value: area,
        formula: 'ns²/(4tan(π/n))',
      });
      results.push({ name: 'Perimeter', value: n * s, formula: 'n × s' });
      results.push({
        name: 'Interior angle',
        value: ((n - 2) * 180) / n,
        formula: '(n-2)×180°/n',
      });
      break;
    }

    case 'trapezoid': {
      const { a, b, h } = params;
      results.push({
        name: 'Area',
        value: ((a + b) * h) / 2,
        formula: '(a+b)h/2',
      });
      break;
    }

    case 'sphere': {
      const { r } = params;
      results.push({
        name: 'Volume',
        value: (4 / 3) * PI * r * r * r,
        formula: '(4/3)πr³',
      });
      results.push({
        name: 'Surface Area',
        value: 4 * PI * r * r,
        formula: '4πr²',
      });
      break;
    }

    case 'cube': {
      const { s } = params;
      results.push({ name: 'Volume', value: s * s * s, formula: 's³' });
      results.push({
        name: 'Surface Area',
        value: 6 * s * s,
        formula: '6s²',
      });
      results.push({
        name: 'Space diagonal',
        value: s * Math.sqrt(3),
        formula: 's√3',
      });
      break;
    }

    case 'cylinder': {
      const { r, h } = params;
      results.push({
        name: 'Volume',
        value: PI * r * r * h,
        formula: 'πr²h',
      });
      results.push({
        name: 'Lateral Surface',
        value: 2 * PI * r * h,
        formula: '2πrh',
      });
      results.push({
        name: 'Total Surface',
        value: 2 * PI * r * (r + h),
        formula: '2πr(r+h)',
      });
      break;
    }

    case 'cone': {
      const { r, h } = params;
      const slant = Math.sqrt(r * r + h * h);
      results.push({
        name: 'Volume',
        value: (PI * r * r * h) / 3,
        formula: '(1/3)πr²h',
      });
      results.push({
        name: 'Slant height',
        value: slant,
        formula: '√(r² + h²)',
      });
      results.push({
        name: 'Lateral Surface',
        value: PI * r * slant,
        formula: 'πrl',
      });
      results.push({
        name: 'Total Surface',
        value: PI * r * (r + slant),
        formula: 'πr(r+l)',
      });
      break;
    }

    case 'pyramid': {
      const { s, h } = params;
      const slant = Math.sqrt(h * h + (s * s) / 4);
      results.push({
        name: 'Volume',
        value: (s * s * h) / 3,
        formula: '(1/3)s²h',
      });
      results.push({
        name: 'Base Area',
        value: s * s,
        formula: 's²',
      });
      results.push({
        name: 'Lateral Surface',
        value: 2 * s * slant,
        formula: '2sl',
      });
      break;
    }

    case 'prism': {
      const { l, w, h } = params;
      results.push({ name: 'Volume', value: l * w * h, formula: 'lwh' });
      results.push({
        name: 'Surface Area',
        value: 2 * (l * w + w * h + h * l),
        formula: '2(lw+wh+hl)',
      });
      results.push({
        name: 'Space diagonal',
        value: Math.sqrt(l * l + w * w + h * h),
        formula: '√(l²+w²+h²)',
      });
      break;
    }

    case 'torus': {
      const { R, r } = params;
      results.push({
        name: 'Volume',
        value: 2 * PI * PI * R * r * r,
        formula: '2π²Rr²',
      });
      results.push({
        name: 'Surface Area',
        value: 4 * PI * PI * R * r,
        formula: '4π²Rr',
      });
      break;
    }
  }

  return results;
}

export default function GeometryCalculator() {
  const [selectedShape, setSelectedShape] = useState<ShapeType>('circle');
  const [params, setParams] = useState<Record<string, number>>({ r: 5 });
  const [dimension, setDimension] = useState<'2D' | '3D'>('2D');

  const shapeConfig = SHAPES[selectedShape];
  const shapes2D = Object.entries(SHAPES).filter(([, v]) => !v.is3D);
  const shapes3D = Object.entries(SHAPES).filter(([, v]) => v.is3D);

  // Calculate results
  const results = useMemo(() => {
    const allParamsValid = shapeConfig.params.every(
      (p) => params[p.key] !== undefined && !isNaN(params[p.key]) && params[p.key] > 0
    );
    if (!allParamsValid) return [];
    return calculate(selectedShape, params);
  }, [selectedShape, params, shapeConfig]);

  const handleShapeChange = (shape: ShapeType) => {
    setSelectedShape(shape);
    // Initialize params with default values
    const newParams: Record<string, number> = {};
    SHAPES[shape].params.forEach((p) => {
      newParams[p.key] = 5;
    });
    setParams(newParams);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: active
      ? 'linear-gradient(135deg, #667eea, #764ba2)'
      : 'transparent',
    color: active ? '#fff' : '#666',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  });

  const shapeButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px',
    border: active ? '2px solid #667eea' : '1px solid #e5e7eb',
    borderRadius: '10px',
    background: active ? '#f0f5ff' : 'white',
    cursor: 'pointer',
    minWidth: '80px',
  });

  const inputStyle: React.CSSProperties = {
    width: '100px',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    textAlign: 'center',
    fontFamily: '"SF Mono", monospace',
  };

  const resultCardStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    borderRadius: '8px',
    marginBottom: '8px',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dimension Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={tabStyle(dimension === '2D')} onClick={() => setDimension('2D')}>
          2D Shapes
        </button>
        <button style={tabStyle(dimension === '3D')} onClick={() => setDimension('3D')}>
          3D Shapes
        </button>
      </div>

      {/* Shape Selection */}
      <div style={sectionStyle}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}
        >
          {(dimension === '2D' ? shapes2D : shapes3D).map(([key, shape]) => (
            <motion.button
              key={key}
              style={shapeButtonStyle(selectedShape === key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleShapeChange(key as ShapeType)}
            >
              <Icon
                icon={shape.icon}
                width={28}
                color={selectedShape === key ? '#667eea' : '#666'}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: selectedShape === key ? '#667eea' : '#666',
                }}
              >
                {shape.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>
          <Icon
            icon={shapeConfig.icon}
            width={20}
            style={{ verticalAlign: 'middle', marginRight: '8px' }}
          />
          {shapeConfig.name} Parameters
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {shapeConfig.params.map((param) => (
            <div key={param.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                style={{ fontSize: '14px', color: '#666', minWidth: '100px' }}
              >
                {param.label}:
              </label>
              <input
                type="number"
                value={params[param.key] || ''}
                onChange={(e) =>
                  setParams({ ...params, [param.key]: parseFloat(e.target.value) || 0 })
                }
                style={inputStyle}
                min="0"
                step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ ...sectionStyle, flex: 1, overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>
          <Icon
            icon="mdi:calculator"
            width={20}
            style={{ verticalAlign: 'middle', marginRight: '8px' }}
          />
          Results
        </h3>
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key={selectedShape + JSON.stringify(params)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {results.map((result, index) => (
                <motion.div
                  key={result.name}
                  style={resultCardStyle}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#0369a1' }}>
                      {result.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Formula: {result.formula}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      fontFamily: '"SF Mono", monospace',
                      color: '#0c4a6e',
                    }}
                  >
                    {isFinite(result.value)
                      ? result.value.toFixed(6).replace(/\.?0+$/, '')
                      : 'Invalid'}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: '#9ca3af',
              }}
            >
              <Icon icon="mdi:shape-plus" width={48} />
              <p>Enter valid parameters to see results</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
