'use client';

import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { compile, evaluateCompiled } from '../calculator/CalculatorEngine';

interface Graph3DProps {
  expression: string;
  onExpressionChange: (expr: string) => void;
}

interface SurfaceMeshProps {
  expression: string;
  xRange: [number, number];
  yRange: [number, number];
  resolution: number;
  colorScheme: 'rainbow' | 'heat' | 'cool' | 'grayscale';
  wireframe: boolean;
}

function SurfaceMesh({
  expression,
  xRange,
  yRange,
  resolution,
  colorScheme,
  wireframe,
}: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotate slowly for visual effect
  useFrame((_state, delta) => {
    if (meshRef.current && !wireframe) {
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  // Generate geometry
  const geometry = useMemo(() => {
    try {
      const compiled = compile(expression);
      const geo = new THREE.PlaneGeometry(
        xRange[1] - xRange[0],
        yRange[1] - yRange[0],
        resolution,
        resolution
      );

      const positionAttr = geo.attributes.position;
      const colors: number[] = [];
      let minZ = Infinity;
      let maxZ = -Infinity;

      // First pass: calculate z values and find range
      const zValues: number[] = [];
      for (let i = 0; i < positionAttr.count; i++) {
        const px = positionAttr.getX(i);
        const py = positionAttr.getY(i);

        // Convert from geometry coordinates to function coordinates
        const x = px + (xRange[0] + xRange[1]) / 2;
        const y = py + (yRange[0] + yRange[1]) / 2;

        const z = evaluateCompiled(compiled, { x, y });
        const clampedZ = isFinite(z) ? Math.max(-10, Math.min(10, z)) : 0;
        zValues.push(clampedZ);

        if (isFinite(clampedZ)) {
          minZ = Math.min(minZ, clampedZ);
          maxZ = Math.max(maxZ, clampedZ);
        }
      }

      // Second pass: set z values and colors
      for (let i = 0; i < positionAttr.count; i++) {
        const z = zValues[i];
        positionAttr.setZ(i, z);

        // Normalize z for coloring
        const t = maxZ > minZ ? (z - minZ) / (maxZ - minZ) : 0.5;
        const color = getColor(t, colorScheme);
        colors.push(color.r, color.g, color.b);
      }

      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      return geo;
    } catch {
      return new THREE.PlaneGeometry(1, 1);
    }
  }, [expression, xRange, yRange, resolution, colorScheme]);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        wireframe={wireframe}
        flatShading={!wireframe}
      />
    </mesh>
  );
}

function getColor(
  t: number,
  scheme: 'rainbow' | 'heat' | 'cool' | 'grayscale'
): THREE.Color {
  switch (scheme) {
    case 'rainbow':
      return new THREE.Color().setHSL(t * 0.8, 0.8, 0.5);
    case 'heat':
      return new THREE.Color().setHSL(0.1 - t * 0.1, 0.9, 0.4 + t * 0.3);
    case 'cool':
      return new THREE.Color().setHSL(0.5 + t * 0.2, 0.7, 0.4 + t * 0.2);
    case 'grayscale':
      return new THREE.Color(t, t, t);
    default:
      return new THREE.Color().setHSL(t * 0.8, 0.8, 0.5);
  }
}

export default function Graph3D({
  expression,
  onExpressionChange,
}: Graph3DProps) {
  const [xRange, setXRange] = useState<[number, number]>([-5, 5]);
  const [yRange, setYRange] = useState<[number, number]>([-5, 5]);
  const [resolution, setResolution] = useState(50);
  const [colorScheme, setColorScheme] = useState<
    'rainbow' | 'heat' | 'cool' | 'grayscale'
  >('rainbow');
  const [wireframe, setWireframe] = useState(false);

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

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '200px',
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: '"SF Mono", monospace',
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    background: 'white',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    overflow: 'hidden',
    minHeight: '400px',
  };

  const exampleExpressions = [
    { expr: 'sin(sqrt(x^2 + y^2))', name: 'Ripple' },
    { expr: 'x^2 + y^2', name: 'Paraboloid' },
    { expr: 'sin(x) * cos(y)', name: 'Waves' },
    { expr: 'x * y', name: 'Saddle' },
    { expr: 'cos(x) * cos(y) * exp(-0.1*(x^2+y^2))', name: 'Damped' },
  ];

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Controls */}
      <div style={controlsStyle}>
        <span style={labelStyle}>z =</span>
        <input
          type="text"
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder="e.g., sin(sqrt(x^2 + y^2))"
          style={inputStyle}
        />
        <select
          value={colorScheme}
          onChange={(e) =>
            setColorScheme(
              e.target.value as 'rainbow' | 'heat' | 'cool' | 'grayscale'
            )
          }
          style={selectStyle}
        >
          <option value="rainbow">Rainbow</option>
          <option value="heat">Heat</option>
          <option value="cool">Cool</option>
          <option value="grayscale">Grayscale</option>
        </select>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
          />
          <span style={labelStyle}>Wireframe</span>
        </label>
      </div>

      {/* Examples */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {exampleExpressions.map((ex) => (
          <motion.button
            key={ex.expr}
            style={{
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: expression === ex.expr ? '#667eea' : 'white',
              color: expression === ex.expr ? 'white' : '#333',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onExpressionChange(ex.expr)}
          >
            {ex.name}
          </motion.button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div style={canvasContainerStyle}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <directionalLight position={[-10, -10, -10]} intensity={0.3} />

          {/* Grid */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#4a5568"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#718096"
            fadeDistance={50}
            position={[0, -5, 0]}
          />

          {/* Axes */}
          <axesHelper args={[10]} />

          {/* Surface */}
          {expression && (
            <SurfaceMesh
              expression={expression}
              xRange={xRange}
              yRange={yRange}
              resolution={resolution}
              colorScheme={colorScheme}
              wireframe={wireframe}
            />
          )}
        </Canvas>

        {/* Controls hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            display: 'flex',
            gap: '16px',
          }}
        >
          <span>
            <Icon
              icon="mdi:mouse"
              width={14}
              style={{ verticalAlign: 'middle' }}
            />{' '}
            Drag to rotate
          </span>
          <span>
            <Icon
              icon="mdi:magnify"
              width={14}
              style={{ verticalAlign: 'middle' }}
            />{' '}
            Scroll to zoom
          </span>
        </div>
      </div>
    </motion.div>
  );
}
