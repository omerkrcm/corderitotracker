"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import type { WeightLog } from "@/lib/types";
import { formatShortDate } from "@/lib/date";

const WIDTH = 320;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 20;

export function WeightChart({
  logs,
  color,
}: {
  logs: WeightLog[];
  color: string;
}) {
  // The API returns logs date-descending; the chart reads oldest -> newest.
  const points = useMemo(
    () => [...logs].sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (points.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-3xl border border-border bg-surface p-4 text-center text-sm text-muted-foreground shadow-sm">
        Log at least two entries to see a trend.
      </div>
    );
  }

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const yPad = span * 0.2;
  const yMin = min - yPad;
  const yMax = max + yPad;

  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    PAD_LEFT + (i / (points.length - 1)) * innerWidth;
  const yFor = (w: number) =>
    PAD_TOP + innerHeight - ((w - yMin) / (yMax - yMin)) * innerHeight;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.weight).toFixed(1)}`)
    .join(" ");
  const baseline = PAD_TOP + innerHeight;
  const areaPath = `${linePath} L ${xFor(points.length - 1).toFixed(1)} ${baseline} L ${xFor(0).toFixed(1)} ${baseline} Z`;

  function selectNearest(e: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xFor(i) - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setActiveIndex(nearest);
  }

  const shownIndex = activeIndex ?? points.length - 1;
  const shown = points[shownIndex];
  const isLatest = shownIndex === points.length - 1;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Trend</h2>
        <div className="text-right leading-tight">
          <p className="text-lg font-semibold">{shown.weight}</p>
          <p className="text-xs text-muted-foreground">
            {isLatest ? "Latest" : formatShortDate(shown.date)}
          </p>
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full cursor-pointer"
        onPointerDown={selectNearest}
      >
        {[yMax, (yMax + yMin) / 2, yMin].map((v) => (
          <line
            key={v}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {activeIndex != null && (
          <line
            x1={xFor(activeIndex)}
            x2={xFor(activeIndex)}
            y1={PAD_TOP}
            y2={baseline}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {points.map((p, i) => {
          const isShown = i === shownIndex;
          return (
            <circle
              key={p.id}
              cx={xFor(i)}
              cy={yFor(p.weight)}
              r={isShown ? 5 : 3}
              fill={color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          );
        })}
        <text x={PAD_LEFT} y={HEIGHT - 4} fontSize={9} fill="var(--muted-foreground)">
          {formatShortDate(points[0].date)}
        </text>
        <text
          x={WIDTH - PAD_RIGHT}
          y={HEIGHT - 4}
          fontSize={9}
          textAnchor="end"
          fill="var(--muted-foreground)"
        >
          {formatShortDate(points[points.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}
