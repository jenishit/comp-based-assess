"use client";
import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

interface BloomRadarChartProps {
  data: Record<string, number>;
  width?: number;   // NEW: canvas width (wider than height)
  height?: number;  // NEW: canvas height (drives the circle radius)
}

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

export default function BloomRadarChart({
  data,
  width = 420,   // was `size` (square) — now wider than height
  height = 280,  // radius is derived from this
}: BloomRadarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

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
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

    // centerX/centerY are independent now — the circle can sit in the
    // middle of a canvas that's wider than it is tall.
    const centerX = width / 2;
    const centerY = height / 2;

    // Radius is capped by the SHORTER dimension (height), so the extra
    // width becomes pure margin for the left/right labels, not more circle.
    const maxRadius = Math.min(width, height) / 2 - 55;
    const angleSlice = (2 * Math.PI) / levels.length;
    const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, maxRadius]);

    const pointAt = (angle: number, r: number): [number, number] => [
      centerX + r * Math.sin(angle),
      centerY - r * Math.cos(angle),
    ];

    const g = svg.append("g");

    [25, 50, 75, 100].forEach((pct) => {
      g.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radiusScale(pct))
        .attr("fill", "none")
        .attr("stroke", COLOR.grid);
    });

    levels.forEach((level, i) => {
      const angle = i * angleSlice;
      const [x, y] = pointAt(angle, maxRadius);
      g.append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
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

    const values = levels.map((l) => data[l] ?? 0);
    const lineRadial = d3
      .lineRadial<number>()
      .angle((_, i) => i * angleSlice)
      .radius((d) => radiusScale(d))
      .curve(d3.curveLinearClosed);

    g.append("path")
      .attr("d", lineRadial(values))
      .attr("transform", `translate(${centerX},${centerY})`)
      .attr("fill", COLOR.fill)
      .attr("fill-opacity", 0.25)
      .attr("stroke", COLOR.stroke)
      .attr("stroke-width", 2);

    levels.forEach((level, i) => {
      const angle = i * angleSlice;
      const [x, y] = pointAt(angle, radiusScale(values[i]));
      const point = g.append("circle").attr("cx", x).attr("cy", y).attr("r", 3.5).attr("fill", COLOR.point);
      point.append("title").text(`${bloomLabel(level)}: ${values[i]}%`);
    });
  }, [data, width, height, hasData, levels]);

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