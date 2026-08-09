"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GazeSample } from "@/types/proctoring-types";

interface GazePlotProps {
  samples: GazeSample[];
}

// Matches the 4s "sustained gaze-away" threshold in useProctoringMonitor.ts.
const SUSTAINED_THRESHOLD_MS = 4000;

type Severity = "center" | "away" | "sustained";

function severityOf(sample: GazeSample): Severity {
  if (!sample.direction || sample.direction === "center") return "center";
  if ((sample.duration ?? 0) > SUSTAINED_THRESHOLD_MS) return "sustained";
  return "away";
}

const COLOR: Record<Severity, string> = {
  center: "#4B7B6E",
  away: "#D9A441",
  sustained: "#D97D6C",
};

export default function GazePlot({ samples }: GazePlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<GazeSample | null>(null);

  useEffect(() => {
    if (!svgRef.current || samples.length === 0) return;

    const width = containerRef.current?.clientWidth ?? 640;
    const height = 220;
    const margin = { top: 10, right: 16, bottom: 24, left: 40 };

    const svg = d3.select<SVGSVGElement, GazeSample>(svgRef.current);
    svg.selectAll("*").remove(); // redraw cleanly whenever samples change
    svg.attr("width", width).attr("height", height);

    const t0 = samples[0].timestamp;
    const tMax = Math.max(1, (samples[samples.length - 1].timestamp - t0) / 1000);

    const x = d3.scaleLinear().domain([0, tMax]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}s`));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5));

    // Center reference line (yaw ratio 0.5 = looking straight ahead).
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(0.5))
      .attr("y2", y(0.5))
      .attr("stroke", "#E4DFD1")
      .attr("stroke-dasharray", "4,3");

    svg
      .selectAll<SVGCircleElement, GazeSample>("circle")
      .data(samples)
      .join("circle")
      .attr("cx", (d) => x((d.timestamp - t0) / 1000))
      .attr("cy", (d) => y(d.yaw ?? 0.5))
      .attr("r", (d) => (severityOf(d) === "sustained" ? 4 : 3))
      .attr("fill", (d) => COLOR[severityOf(d)])
      .attr("opacity", 0.85)
      .style("cursor", (d) => (severityOf(d) === "sustained" ? "pointer" : "default"))
      .on("click", (_event, d) => {
        if (severityOf(d) === "sustained") setSelected(d);
      });
  }, [samples]);

  const windowSamples = selected
    ? samples.filter((s) => Math.abs(s.timestamp - selected.timestamp) <= 5000)
    : [];

  return (
    <div ref={containerRef} className="bg-card rounded-xl border border-sand-border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-bark uppercase tracking-wide">Gaze timeline</p>
        <div className="flex items-center gap-3 text-[10px] text-bark">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR.center }} /> Center
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR.away }} /> Away
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR.sustained }} /> Sustained
          </span>
        </div>
      </div>

      {samples.length === 0 ? (
        <p className="text-xs text-bark py-8 text-center">No gaze data recorded for this attempt.</p>
      ) : (
        <svg ref={svgRef} className="w-full" />
      )}

      {selected && (
        <div className="mt-3 border-t border-sand-border pt-3">
          <p className="text-[11px] font-medium text-bark mb-2">
            ±5s around flagged event ({windowSamples.length} samples)
          </p>
          <div className="flex flex-wrap gap-1">
            {windowSamples.map((s, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-sand-light text-bark">
                {new Date(s.timestamp).toLocaleTimeString()} · {s.direction ?? "center"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
