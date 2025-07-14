// components/ui/LineChart.tsx
import React from 'react';

interface LineChartProps {
  data: { day: string; progress: number }[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 120 }) => {
  const maxProgress = 100;
  const chartHeight = height;
  const chartWidth = data.length * 40;

  const getY = (value: number) =>
    chartHeight - (value / maxProgress) * chartHeight;

  const points = data.map((d, i) => `${i * 40},${getY(d.progress)}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="text-blue-500">
        {/* Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={i * 40}
            cy={getY(d.progress)}
            r="3"
            fill="currentColor"
          />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-1 w-full">
        {data.map((d, i) => (
          <span key={i} className="w-10 text-center">
            {d.day.replace('Day ', 'D')}
          </span>
        ))}
      </div>
    </div>
  );
};
