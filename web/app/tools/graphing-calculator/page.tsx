import { Metadata } from 'next';
import { GraphingCalculator } from '@/components/graphing-calculator';

export const metadata: Metadata = {
  title: 'Graphing Calculator | Singapore Math',
  description:
    'Advanced graphing calculator with 2D/3D plotting, equation solving, and scientific computing. Features precision arithmetic and comprehensive function support.',
  keywords: [
    'graphing calculator',
    'scientific calculator',
    '3D graphs',
    'equation solver',
    'math tools',
  ],
};

export default function GraphingCalculatorPage() {
  return <GraphingCalculator />;
}
