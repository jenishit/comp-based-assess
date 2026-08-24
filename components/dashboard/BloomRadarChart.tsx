"use client";
import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

interface BloomRadarChartProps {
  // Bloom's level -> score percentage (0-100), e.g. AnnualReport.bloom_level_performance,
  // AttemptResult.bloom_level_performance, ExamBloomReport.bloom_level_performance.
  data: Record<string, number>;
  size?: number;
}

// Grounded in the Literal constraint on Question.bloom_level (see
// backend/app/schemas/ai_mcq.py) — five lowercase levels, no "create".
const BLOOM_ORDER = ["remember", "understand", "apply", "analyze", "evaluate"];
const BLOOM_LABELS: Record<string, string> = {
  remember: "Remember",
  understand: "Understand",
  apply: "Apply",
  analyze: "Analyze",
  evaluate: "Evaluate",
};

function bloomLabel(level: string): string {
  return BLOOM_LABELS[level.toLowerCase()] ?? level;
}

const COLOR = {
  fill: "#4B7B6E",
  stroke: "#3C6459",
  grid: "#E4DFD1",
  axisText: "#726C7E",
  point: "#4B7B6E",
};

export default function BloomRadarChart({ data, size = 280 }: BloomRadarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Always show all five canonical axes (missing ones plot as 0, so the
  // polygon still closes correctly), plus any unexpected/legacy level keys
  // (e.g. "Unknown") appended after, sorted.
  const levels = useMemo(
    () => [
      ...BLOOM_ORDER,
      ...Object.keys(data)
        .filter((k) => !BLOOM_ORDER.includes(k.toLowerCase()))
        .sort(),
    ],
    [data],
  );
  const hasData = Object.keys(data).length > 0;

  useEffect(() => {
    if (!svgRef.current || !hasData) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove(); // redraw cleanly whenever data changes
    svg.attr("width", size).attr("height", size).attr("viewBox", `0 0 ${size} ${size}`);

    const center = size / 2;
    const maxRadius = center - 44;
    const angleSlice = (2 * Math.PI) / levels.length;
    const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, maxRadius]);

    const pointAt = (angle: number, r: number): [number, number] => [
      center + r * Math.sin(angle),
      center - r * Math.cos(angle),
    ];

    const g = svg.append("g");

    // Concentric percentage gridlines.
    [25, 50, 75, 100].forEach((pct) => {
      g.append("circle")
        .attr("cx", center)
        .attr("cy", center)
        .attr("r", radiusScale(pct))
        .attr("fill", "none")
        .attr("stroke", COLOR.grid);
    });

    // Axis spokes + labels.
    levels.forEach((level, i) => {
      const angle = i * angleSlice;
      const [x, y] = pointAt(angle, maxRadius);
      g.append("line")
        .attr("x1", center)
        .attr("y1", center)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", COLOR.grid);

      const [lx, ly] = pointAt(angle, maxRadius + 16);
      const horizontalBias = Math.sin(angle);
      g.append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", horizontalBias > 0.15 ? "start" : horizontalBias < -0.15 ? "end" : "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("fill", COLOR.axisText)
        .text(bloomLabel(level));
    });

    // Data polygon.
    const values = levels.map((l) => data[l] ?? 0);
    const lineRadial = d3
      .lineRadial<number>()
      .angle((_, i) => i * angleSlice)
      .radius((d) => radiusScale(d))
      .curve(d3.curveLinearClosed);

    g.append("path")
      .attr("d", lineRadial(values))
      .attr("transform", `translate(${center},${center})`)
      .attr("fill", COLOR.fill)
      .attr("fill-opacity", 0.25)
      .attr("stroke", COLOR.stroke)
      .attr("stroke-width", 2);

    // Vertex markers with native tooltips.
    levels.forEach((level, i) => {
      const angle = i * angleSlice;
      const [x, y] = pointAt(angle, radiusScale(values[i]));
      const point = g.append("circle").attr("cx", x).attr("cy", y).attr("r", 3.5).attr("fill", COLOR.point);
      point.append("title").text(`${bloomLabel(level)}: ${values[i]}%`);
    });
  }, [data, size, hasData, levels]);

  return (
    <div ref={containerRef} className="flex justify-center">
      {hasData ? (
        <svg ref={svgRef} />
      ) : (
        <p className="text-xs text-bark py-8 text-center">No graded data yet.</p>
      )}
    </div>
  );
}
