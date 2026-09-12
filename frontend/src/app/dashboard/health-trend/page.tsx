"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Flame,
  BarChart2,
  Zap,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthScorePoint {
  date: string;
  reportName: string;
  score: number;
  abnormalCount: number;
  normalCount: number;
  totalCount: number;
}

interface BiomarkerCategoryBreakdown {
  category: string;
  normal: number;
  abnormal: number;
  total: number;
  abnormalRate: number;
}

interface RecentFlag {
  biomarkerName: string;
  value: string;
  unit: string | null;
  interpretation: string;
  referenceRange: string | null;
  reportName: string;
  date: string;
}

interface TrendVelocity {
  biomarkerName: string;
  unit: string | null;
  latestValue: number;
  previousValue: number;
  deltaAbsolute: number;
  deltaPct: number;
  direction: "up" | "down" | "stable";
  latestInterpretation: string | null;
}

interface HealthTrendData {
  healthScoreSeries: HealthScorePoint[];
  latestScore: number | null;
  scoreDelta: number | null;
  categoryBreakdown: BiomarkerCategoryBreakdown[];
  currentFlags: RecentFlag[];
  velocities: TrendVelocity[];
  stats: {
    totalReports: number;
    completedReports: number;
    totalBiomarkersTracked: number;
    uniqueBiomarkers: number;
    streakCleanReports: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function scoreColor(score: number) {
  if (score >= 80) return "#0a4e3e";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Attention";
}

function scoreBg(score: number) {
  if (score >= 80) return "from-[#0a4e3e] to-[#0d6b55]";
  if (score >= 60) return "from-amber-500 to-amber-600";
  return "from-rose-500 to-rose-600";
}

function isAbnormal(interp: string | null | undefined) {
  if (!interp) return false;
  const l = interp.toLowerCase();
  return l === "high" || l === "low";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ecebe6] p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function SkeletonCard({ height = "h-48" }: { height?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#ecebe6] p-5 animate-pulse ${height}`}>
      <div className="h-4 bg-slate-100 rounded w-2/5 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-3/5 mb-6" />
      <div className="h-24 bg-slate-50 rounded-xl" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#eef8f5] border border-[#d6ede4] flex items-center justify-center">
        <Icon className="w-7 h-7 text-[#0a4e3e]" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-slate-700">{title}</h3>
        <p className="text-sm text-slate-400 font-medium mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  );
}

// ─── Custom Tooltips ─────────────────────────────────────────────────────────

function ScoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HealthScorePoint;
  const sc = d.score;
  return (
    <div className="bg-white border border-[#ecebe6] rounded-xl px-4 py-3 shadow-lg text-xs min-w-[160px]">
      <p className="font-bold text-slate-700 mb-1 truncate">{d.reportName}</p>
      <p className="text-slate-400 mb-2">{formatShortDate(d.date)}</p>
      <p className="font-extrabold text-lg" style={{ color: scoreColor(sc) }}>
        {sc}
        <span className="text-sm font-semibold ml-0.5 text-slate-400">/100</span>
      </p>
      <div className="mt-1.5 flex gap-3 text-[11px]">
        <span className="text-emerald-500 font-semibold">{d.normalCount} normal</span>
        <span className="text-rose-500 font-semibold">{d.abnormalCount} flagged</span>
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as BiomarkerCategoryBreakdown;
  return (
    <div className="bg-white border border-[#ecebe6] rounded-xl px-3.5 py-3 shadow-lg text-xs">
      <p className="font-bold text-slate-700 mb-1">{d.category}</p>
      <p className="text-emerald-500 font-semibold">{d.normal} normal</p>
      <p className="text-rose-500 font-semibold">{d.abnormal} flagged</p>
      <p className="text-slate-400 mt-1">
        {Math.round(d.abnormalRate * 100)}% flag rate
      </p>
    </div>
  );
}

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score, delta }: { score: number; delta: number | null }) {
  const color = scoreColor(score);
  const label = scoreLabel(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={220}
            endAngle={-40}
            data={data}
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f1f0eb" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs font-bold text-slate-400 -mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-extrabold" style={{ color }}>
        {label}
      </p>
      {delta !== null && (
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            delta > 0
              ? "bg-emerald-50 text-emerald-600"
              : delta < 0
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {delta > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : delta < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {delta > 0 ? "+" : ""}
          {delta} pts vs last report
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HealthTrendPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthTrendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/health-trend", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch health trend");
      const json = await res.json();
      setData(json.trend);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const hasData = data && data.stats.completedReports > 0;

  // Chart data: score series formatted for recharts
  const scoreChartData =
    data?.healthScoreSeries.map((p) => ({
      ...p,
      shortDate: formatShortDate(p.date),
    })) ?? [];

  // Category chart – show as horizontal bar
  const catData = (data?.categoryBreakdown ?? []).slice(0, 8);

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f9faf7]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#ecebe6] shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0a4e3e]" />
            Health Trends
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Your health performance overview — scores, changes &amp; category breakdown
          </p>
        </div>
        <button
          onClick={fetchTrend}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#0a4e3e] hover:bg-[#eef8f5] px-3 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !data && !error && (
          <EmptyState
            icon={TrendingUp}
            title="No trend data yet"
            description="Upload and process at least one medical report to see your health trends."
          />
        )}

        {data && !hasData && (
          <EmptyState
            icon={Activity}
            title="Reports are still processing"
            description="Your reports are being analyzed. Check back shortly for your health trends."
          />
        )}

        {/* ── Main dashboard ── */}
        {hasData && (
          <>
            {/* Row 1: Score gauge + stat pills */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5">
              {/* Score card */}
              <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm flex flex-col items-center gap-4 min-w-[220px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">
                  Health Score
                </p>
                <ScoreGauge score={data.latestScore!} delta={data.scoreDelta} />
                <p className="text-[11px] text-slate-400 font-medium text-center max-w-[160px]">
                  Based on {data.stats.uniqueBiomarkers} unique biomarkers across{" "}
                  {data.stats.completedReports} reports
                </p>
              </div>

              {/* Stat pills grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 content-start">
                <StatPill
                  icon={BarChart2}
                  label="Reports Processed"
                  value={data.stats.completedReports}
                  color="bg-blue-50 text-blue-500"
                />
                <StatPill
                  icon={FlaskConical}
                  label="Biomarkers Tracked"
                  value={data.stats.totalBiomarkersTracked}
                  color="bg-purple-50 text-purple-500"
                />
                <StatPill
                  icon={AlertTriangle}
                  label="Currently Flagged"
                  value={data.currentFlags.length}
                  color={
                    data.currentFlags.length > 0
                      ? "bg-rose-50 text-rose-500"
                      : "bg-emerald-50 text-emerald-500"
                  }
                />
                <StatPill
                  icon={Flame}
                  label="Clean Report Streak"
                  value={
                    data.stats.streakCleanReports > 0
                      ? `${data.stats.streakCleanReports} in a row`
                      : "—"
                  }
                  color={
                    data.stats.streakCleanReports > 0
                      ? "bg-[#eef8f5] text-[#0a4e3e]"
                      : "bg-slate-50 text-slate-400"
                  }
                />
              </div>
            </div>

            {/* Row 2: Score over time */}
            {scoreChartData.length >= 2 && (
              <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#0a4e3e]" />
                      Health Score Over Time
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      One point per completed report — higher is better
                    </p>
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={scoreChartData}
                      margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
                    >
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0a4e3e" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#0a4e3e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f0eb" vertical={false} />
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ScoreTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#0a4e3e"
                        strokeWidth={2.5}
                        fill="url(#scoreGrad)"
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const c = scoreColor(payload.score);
                          return (
                            <circle
                              key={`dot-${cx}-${cy}`}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={c}
                              stroke="white"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: "#0a4e3e", stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Row 3: Category breakdown + Current flags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Category breakdown */}
              {catData.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-1">
                    <BarChart2 className="w-4 h-4 text-[#0a4e3e]" />
                    Biomarker Categories
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mb-5">
                    Normal vs flagged readings by category (all-time)
                  </p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={catData}
                        layout="vertical"
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        barCategoryGap={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f0eb" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          width={70}
                          tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CategoryTooltip />} />
                        <Bar dataKey="normal" stackId="a" fill="#0a4e3e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="abnormal" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span className="w-3 h-3 rounded-sm bg-[#0a4e3e] inline-block" /> Normal
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Flagged
                    </span>
                  </div>
                </div>
              )}

              {/* Current flags */}
              <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Currently Flagged
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-4">
                  Abnormal biomarkers from your latest report
                </p>
                {data.currentFlags.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-12 h-12 rounded-full bg-[#eef8f5] flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-[#0a4e3e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-[#0a4e3e]">All clear!</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        No abnormal values in your latest report
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {data.currentFlags.map((flag, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${
                          flag.interpretation.toLowerCase() === "high"
                            ? "bg-rose-50/60 border-rose-100"
                            : "bg-amber-50/60 border-amber-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">
                            {flag.biomarkerName}
                          </p>
                          {flag.referenceRange && (
                            <p className="text-[10px] text-slate-400">
                              ref: {flag.referenceRange}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className={`text-xs font-extrabold ${
                              flag.interpretation.toLowerCase() === "high"
                                ? "text-rose-500"
                                : "text-amber-500"
                            }`}
                          >
                            {flag.value}
                            {flag.unit ? ` ${flag.unit}` : ""}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              flag.interpretation.toLowerCase() === "high"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {flag.interpretation.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Velocity (biggest changes) */}
            {data.velocities.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#0a4e3e]" />
                  Biggest Changes
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-5">
                  Biomarkers with the largest movement between your last two reports
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.velocities.slice(0, 9).map((v, i) => {
                    const isAbnorm = isAbnormal(v.latestInterpretation);
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl border p-4 ${
                          isAbnorm
                            ? "border-rose-100 bg-rose-50/40"
                            : "border-[#ecebe6] bg-[#fafaf8]"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {v.biomarkerName}
                            </p>
                            {v.unit && (
                              <p className="text-[10px] text-slate-400">{v.unit}</p>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                              v.direction === "up"
                                ? isAbnorm
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-emerald-100 text-emerald-600"
                                : v.direction === "down"
                                ? isAbnorm
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {v.direction === "up" ? (
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            ) : v.direction === "down" ? (
                              <ArrowDownRight className="w-2.5 h-2.5" />
                            ) : (
                              <Minus className="w-2.5 h-2.5" />
                            )}
                            {v.deltaPct > 0 ? "+" : ""}
                            {v.deltaPct}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {v.previousValue}
                          </span>
                          <div className="flex-1 h-px bg-slate-200 relative">
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full ${
                                v.direction === "up"
                                  ? isAbnorm
                                    ? "bg-rose-400"
                                    : "bg-emerald-400"
                                  : v.direction === "down"
                                  ? isAbnorm
                                    ? "bg-amber-400"
                                    : "bg-blue-400"
                                  : "bg-slate-300"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-extrabold ${
                              isAbnorm ? "text-rose-500" : "text-slate-700"
                            }`}
                          >
                            {v.latestValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 5: Score over time breakdown table (if only 1 data point) */}
            {scoreChartData.length === 1 && (
              <div className="bg-[#eef8f5] rounded-2xl border border-[#d6ede4] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0a4e3e] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0a4e3e]">
                    Upload more reports to see trend charts
                  </h3>
                  <p className="text-xs text-[#0a4e3e]/70 font-medium mt-0.5">
                    You need at least 2 completed reports to visualize score trends and velocity.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}