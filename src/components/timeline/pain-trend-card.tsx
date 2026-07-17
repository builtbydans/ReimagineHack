"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const painData = [
  { month: "Apr", value: 4, label: "14 Apr" },
  { month: "May", value: 5, label: "14 May" },
  { month: "Jun", value: 7, label: "12 Jun" },
  { month: "Jul", value: 8, label: "10 Jul" },
];

export function PainTrendCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className={cn("flex items-start justify-between gap-4", compact ? "p-4 pb-0" : "p-5 pb-1 sm:p-6 sm:pb-1")}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.11em] text-plum-600">Patient-reported trend</p>
          <h2 className={cn("mt-1 font-semibold tracking-[-.025em]", compact ? "text-base" : "text-lg")}>Pain severity over time</h2>
          {!compact ? <p className="mt-1 text-xs text-muted-foreground">Recorded by Amina in her updates · 0–10 scale</p> : null}
        </div>
        <Badge variant="patient"><TrendingUp /> 4 updates</Badge>
      </div>
      <div className={cn("w-full", compact ? "h-36 px-2 pb-2" : "h-48 px-2 pb-3 sm:px-4")} aria-label="Patient-reported pain severity: April 4, May 5, June 7, July 8 out of 10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={painData} margin={{ top: 20, right: 18, bottom: 2, left: -22 }}>
            <CartesianGrid stroke="#eee6ea" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7b7076", fontSize: 11 }} dy={8} />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} axisLine={false} tickLine={false} tick={{ fill: "#9c9297", fontSize: 10 }} />
            <Tooltip
              cursor={{ stroke: "#d6b8c8", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const point = payload[0].payload as (typeof painData)[number];
                return <div className="rounded-xl border bg-white px-3 py-2 text-xs shadow-card"><span className="font-semibold text-plum-700">{point.value}/10</span><span className="ml-2 text-muted-foreground">{point.label}</span></div>;
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#794561" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", stroke: "#794561", strokeWidth: 2.5 }} activeDot={{ r: 6, fill: "#794561", stroke: "#f0e4eb", strokeWidth: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {!compact ? <div className="border-t bg-plum-50/50 px-5 py-3 text-[11px] leading-4 text-muted-foreground sm:px-6">This chart reflects Amina’s own reports. It is not an objective medical measurement.</div> : null}
    </Card>
  );
}
