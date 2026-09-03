'use client';

import React from 'react';
import { TimeSeriesPoint } from '../lib/types';
import { TrendingUp, Calendar, Cloud } from 'lucide-react';

interface TimeSeriesChartProps {
  series: TimeSeriesPoint[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ series }) => {
  if (!series || series.length === 0) {
    return null;
  }

  // Chart dimensions
  const height = 140;
  const width = 360;
  const paddingX = 35;
  const paddingY = 20;

  // Values range [0.0, 1.0]
  const minVal = 0.0;
  const maxVal = 1.0;

  const points = series.map((item, index) => {
    const x =
      paddingX +
      (index / (series.length - 1 > 0 ? series.length - 1 : 1)) *
        (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((item.ndvi_mean - minVal) / (maxVal - minVal)) *
        (height - paddingY * 2);
    return { ...item, x, y };
  });

  // Build SVG path
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Build filled area path
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${
          points[0].x
        } ${height - paddingY} Z`
      : '';

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Evolução Histórica do NDVI
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Últimas {series.length} passagens
        </span>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeWidth="0.5"
          />
          <text x={paddingX - 6} y={paddingY + 4} textAnchor="end" fontSize="9" fill="#64748b">
            1.0
          </text>

          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeWidth="0.5"
          />
          <text x={paddingX - 6} y={height / 2 + 4} textAnchor="end" fontSize="9" fill="#64748b">
            0.5
          </text>

          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#334155"
            strokeWidth="0.8"
          />
          <text x={paddingX - 6} y={height - paddingY + 4} textAnchor="end" fontSize="9" fill="#64748b">
            0.0
          </text>

          {/* Fill Area */}
          <path d={areaD} fill="url(#ndviGradient)" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                className="fill-emerald-400 stroke-slate-950 stroke-2 hover:r-6 transition-all"
              />
              {/* Tooltip on point */}
              <text
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#ffffff"
                className="opacity-90 drop-shadow"
              >
                {pt.ndvi_mean.toFixed(2)}
              </text>
              {/* Date label at bottom */}
              <text
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                fontSize="8"
                fill="#94a3b8"
              >
                {pt.date.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Cloud & Date breakdown pills */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/60">
        {series.slice(-3).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 text-[10px] text-slate-400"
          >
            <span className="flex items-center font-mono">
              <Calendar className="w-2.5 h-2.5 mr-1 text-slate-500" />
              {item.date.slice(5)}
            </span>
            <span className="font-semibold text-emerald-400">
              {item.ndvi_mean.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
