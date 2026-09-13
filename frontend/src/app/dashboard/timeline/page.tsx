"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  BarChart2,
  Calendar,
  Zap,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineBiomarker {
  id: string;
  name: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
}

interface TimelineEvent {
  id: string;
  reportName: string;
  reportDate: string | null;
  uploadDate: string;
  aiSummary: string | null;
  processingStatus: string;
  biomarkers: TimelineBiomarker[];
  hasAbnormals: boolean;
}

interface TrendPoint {
  reportId: string;
  reportName: string;
  date: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
}

interface BiomarkerTrend {
  name: string;
  unit: string | null;
  points: TrendPoint[];
}

interface TimelineAnalysis {
  totalReports: number;
  completedReports: number;
  abnormalReports: number;
  recentAbnormals: string[];
  improved: string[];
  worsened: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
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

function isAbnormal(interp: string | null | undefined) {
  if (!interp) return false;
  const l = interp.toLowerCase();
  return l === "high" || l === "low";
}

function interpretationColor(interp: string | null | undefined) {
  if (!interp) return "text-slate-400";
  const l = interp.toLowerCase();
  if (l === "high") return "text-rose-500";
  if (l === "low") return "text-amber-500";
  if (l === "normal") return "text-emerald-500";
  return "text-slate-400";
}

function interpretationBadge(interp: string | null | undefined) {
  if (!interp) return null;
  const l = interp.toLowerCase();
  if (l === "high")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
        <ArrowUpRight className="w-2.5 h-2.5" /> HIGH
      </span>
    );
  if (l === "low")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
        <ArrowDownRight className="w-2.5 h-2.5" /> LOW
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <Minus className="w-2.5 h-2.5" /> NORMAL
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ecebe6] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BiomarkerRow({ b, highlight }: { b: TimelineBiomarker; highlight: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${
        highlight ? "bg-rose-50/60 border border-rose-100" : "bg-slate-50 border border-transparent"
      }`}
    >
      <span className="font-semibold text-slate-700 text-xs">{b.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-bold text-xs ${interpretationColor(b.interpretation)}`}>
          {b.value}
          {b.unit ? ` ${b.unit}` : ""}
        </span>
        {b.referenceRange && (
          <span className="text-[10px] text-slate-400 hidden sm:inline">ref: {b.referenceRange}</span>
        )}
        {interpretationBadge(b.interpretation)}
      </div>
    </div>
  );
}

function TimelineCard({
  event,
  index,
  total,
}: {
  event: TimelineEvent;
  index: number;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = formatDate(event.reportDate || event.uploadDate);
  const abnormals = event.biomarkers.filter((b) => isAbnormal(b.interpretation));
  const normals = event.biomarkers.filter((b) => !isAbnormal(b.interpretation));
  const isCompleted = event.processingStatus === "completed";

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
            isCompleted
              ? event.hasAbnormals
                ? "bg-rose-50 border-rose-200 text-rose-500"
                : "bg-emerald-50 border-emerald-200 text-emerald-500"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          {isCompleted ? (
            event.hasAbnormals ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent mt-1 min-h-[32px]" />
        )}
      </div>

      <div className="flex-1 pb-6">
        <div
          className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 ${
            event.hasAbnormals
              ? "border-rose-100 hover:border-rose-200"
              : "border-[#ecebe6] hover:border-[#d6ede4]"
          }`}
        >
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-start justify-between p-5 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800 truncate">{event.reportName}</h3>
                {isCompleted ? (
                  event.hasAbnormals ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                      {abnormals.length} Abnormal
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      All Normal
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0 capitalize">
                    {event.processingStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3 h-3" />
                  {date}
                </span>
                {event.biomarkers.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <FlaskConical className="w-3 h-3" />
                    {event.biomarkers.length} biomarkers
                  </span>
                )}
              </div>
              {event.aiSummary && !expanded && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  {event.aiSummary}
                </p>
              )}
            </div>
            <div className="shrink-0 ml-3 mt-0.5 text-slate-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expanded && (
            <div className="px-5 pb-5 border-t border-[#f0efea] pt-4 space-y-4">
              {event.aiSummary && (
                <div className="bg-[#f9faf7] rounded-xl p-4 border border-[#ecebe6]">
                  <p className="text-[11px] font-bold text-[#0a4e3e] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> AI Summary
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{event.aiSummary}</p>
                </div>
              )}
              {event.biomarkers.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Biomarkers
                  </p>
                  {abnormals.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {abnormals.map((b) => (
                        <BiomarkerRow key={b.id} b={b} highlight />
                      ))}
                    </div>
                  )}
                  {normals.length > 0 && (
                    <div className="space-y-1">
                      {normals.map((b) => (
                        <BiomarkerRow key={b.id} b={b} highlight={false} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  trend,
  selected,
  onSelect,
}: {
  trend: BiomarkerTrend;
  selected: boolean;
  onSelect: () => void;
}) {
  const data = trend.points.map((p) => ({
    date: formatShortDate(p.date),
    value: p.numericValue,
    interpretation: p.interpretation,
    reportName: p.reportName,
  }));

  const values = trend.points.map((p) => p.numericValue!).filter(Boolean);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const hasAbnormals = trend.points.some((p) => isAbnormal(p.interpretation));
  const latestInterp = trend.points[trend.points.length - 1]?.interpretation;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        selected
          ? "border-[#0a4e3e] bg-[#f0faf5] shadow-md"
          : "border-[#ecebe6] bg-white hover:border-[#0a4e3e]/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{trend.name}</h4>
          {trend.unit && <p className="text-[11px] text-slate-400 font-medium">{trend.unit}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {interpretationBadge(latestInterp)}
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {trend.points.length}pt
          </span>
        </div>
      </div>

      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={hasAbnormals ? "#f43f5e" : "#0a4e3e"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: hasAbnormals ? "#f43f5e" : "#0a4e3e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {values.length > 1 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400">
            Min: <strong className="text-slate-600">{minVal}</strong>
          </span>
          <span className="text-[10px] text-slate-400">
            Max: <strong className="text-slate-600">{maxVal}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

function ExpandedChart({ trend }: { trend: BiomarkerTrend }) {
  const data = trend.points.map((p) => ({
    date: formatShortDate(p.date),
    value: p.numericValue,
    interpretation: p.interpretation,
    reportName: p.reportName,
  }));

  const hasAbnormals = trend.points.some((p) => isAbnormal(p.interpretation));
  const lineColor = hasAbnormals ? "#f43f5e" : "#0a4e3e";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white border border-[#ecebe6] rounded-xl px-3.5 py-3 shadow-lg text-xs">
          <p className="font-bold text-slate-700 mb-1">{point.reportName}</p>
          <p className="text-slate-500">{label}</p>
          <p className="font-extrabold text-base mt-1" style={{ color: lineColor }}>
            {point.value}
            {trend.unit ? ` ${trend.unit}` : ""}
          </p>
          {point.interpretation && (
            <p className={`font-semibold mt-0.5 capitalize ${interpretationColor(point.interpretation)}`}>
              {point.interpretation}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#ecebe6] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-extrabold text-slate-800">{trend.name}</h3>
        {trend.unit && (
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            {trend.unit}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 font-medium mb-5">
        Trend across {trend.points.length} report{trend.points.length !== 1 ? "s" : ""}
      </p>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f0eb" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const abnorm = isAbnormal(payload.interpretation);
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={abnorm ? "#f43f5e" : "#0a4e3e"}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, fill: lineColor, stroke: "white", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-1.5">
        {[...trend.points].reverse().map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-xl px-3.5 py-2 text-xs ${
              isAbnormal(p.interpretation)
                ? "bg-rose-50 border border-rose-100"
                : "bg-slate-50 border border-transparent"
            }`}
          >
            <span className="font-semibold text-slate-500">{formatShortDate(p.date)}</span>
            <span className="text-slate-400 text-[11px] truncate max-w-[120px] mx-2">{p.reportName}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`font-bold ${interpretationColor(p.interpretation)}`}>
                {p.value}
                {p.unit ? ` ${p.unit}` : ""}
              </span>
              {interpretationBadge(p.interpretation)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#ecebe6] p-5 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-3/5 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/5" />
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
    <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-4 text-center px-4">
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "timeline" | "trends" | "analysis";

export default function TimelinePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [trends, setTrends] = useState<BiomarkerTrend[]>([]);
  const [analysis, setAnalysis] = useState<TimelineAnalysis | null>(null);

  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [trendSearch, setTrendSearch] = useState("");

  const getToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  const fetchTimeline = useCallback(async () => {
    setLoadingTimeline(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch timeline");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTimeline(false);
    }
  }, [getToken]);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/timeline/trends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch trends");
      const data = await res.json();
      setTrends(data.trends ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTrends(false);
    }
  }, [getToken]);

  const fetchAnalysis = useCallback(async () => {
    setLoadingAnalysis(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/timeline/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const data = await res.json();
      setAnalysis(data.analysis ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAnalysis(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchTimeline();
      fetchTrends();
      fetchAnalysis();
    }
  }, [user, fetchTimeline, fetchTrends, fetchAnalysis]);

  const filteredTrends = trends.filter((t) =>
    t.name.toLowerCase().includes(trendSearch.toLowerCase())
  );
  const selectedTrendData = trends.find((t) => t.name === selectedTrend);
  const isLoading = loadingTimeline || loadingTrends || loadingAnalysis;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "timeline", label: "Timeline", icon: Activity },
    { id: "trends", label: "Biomarker Trends", icon: TrendingUp },
    { id: "analysis", label: "Analysis", icon: BarChart2 },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f9faf7]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-8 py-5 bg-white border-b border-[#ecebe6] shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0a4e3e]" />
            Health Timeline
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Chronological view of your medical history &amp; biomarker trends
          </p>
        </div>
        <button
          onClick={() => { fetchTimeline(); fetchTrends(); fetchAnalysis(); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#0a4e3e] hover:bg-[#eef8f5] px-3 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-[#ecebe6] px-4 md:px-8 shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#0a4e3e] text-[#0a4e3e]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {error && (
          <div className="mb-5 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="max-w-3xl">
            {loadingTimeline ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports yet"
                description="Upload your first medical report to start building your health timeline."
              />
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-5">
                  {events.length} report{events.length !== 1 ? "s" : ""} · oldest first
                </p>
                {events.map((event, i) => (
                  <TimelineCard key={event.id} event={event} index={i} total={events.length} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === "trends" && (
          <div>
            {loadingTrends ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : trends.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No trend data yet"
                description="Once you have at least one completed report with numeric biomarkers, trends will appear here."
              />
            ) : (
              <div className={selectedTrendData ? "flex flex-col lg:flex-row gap-6" : ""}>
                <div className={selectedTrendData ? "w-full lg:w-80 shrink-0" : "w-full"}>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search biomarkers..."
                      value={trendSearch}
                      onChange={(e) => setTrendSearch(e.target.value)}
                      className="w-full bg-white border border-[#ebeae4] rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-[#0a4e3e] transition-all"
                    />
                  </div>
                  <div className={`grid gap-3 ${selectedTrendData ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {filteredTrends.map((t) => (
                      <TrendChart
                        key={t.name}
                        trend={t}
                        selected={selectedTrend === t.name}
                        onSelect={() => setSelectedTrend(selectedTrend === t.name ? null : t.name)}
                      />
                    ))}
                    {filteredTrends.length === 0 && (
                      <p className="text-sm text-slate-400 font-medium col-span-full">
                        No biomarkers match &quot;{trendSearch}&quot;
                      </p>
                    )}
                  </div>
                </div>
                {selectedTrendData && (
                  <div className="flex-1 min-w-0">
                    <ExpandedChart trend={selectedTrendData} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === "analysis" && (
          <div className="max-w-4xl space-y-6">
            {loadingAnalysis ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : !analysis ? (
              <EmptyState
                icon={BarChart2}
                title="Analysis unavailable"
                description="Upload and process reports to generate your health analysis."
              />
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={FileText}
                    label="Total Reports"
                    value={analysis.totalReports}
                    sub="All time"
                    color="bg-blue-50 text-blue-500"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={analysis.completedReports}
                    sub="Fully processed"
                    color="bg-emerald-50 text-emerald-500"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="With Abnormals"
                    value={analysis.abnormalReports}
                    sub="Had 1+ flag"
                    color="bg-rose-50 text-rose-500"
                  />
                  <StatCard
                    icon={ShieldCheck}
                    label="Clean Reports"
                    value={Math.max(0, analysis.completedReports - analysis.abnormalReports)}
                    sub="All values normal"
                    color="bg-[#eef8f5] text-[#0a4e3e]"
                  />
                </div>

                {/* Recent Abnormals */}
                {analysis.recentAbnormals.length > 0 && (
                  <section className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      Flagged in Most Recent Report
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recentAbnormals.map((name) => (
                        <span
                          key={name}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Improved & Worsened */}
                {(analysis.improved.length > 0 || analysis.worsened.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.improved.length > 0 && (
                      <section className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
                        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Improved Since Last Report
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {analysis.improved.map((name) => (
                            <span
                              key={name}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3 h-3" /> {name}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                    {analysis.worsened.length > 0 && (
                      <section className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
                        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
                          <TrendingDown className="w-4 h-4 text-amber-500" />
                          Worsened Since Last Report
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {analysis.worsened.map((name) => (
                            <span
                              key={name}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1"
                            >
                              <ArrowDownRight className="w-3 h-3" /> {name}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* All-clear */}
                {analysis.completedReports > 0 &&
                  analysis.recentAbnormals.length === 0 &&
                  analysis.improved.length === 0 &&
                  analysis.worsened.length === 0 && (
                    <div className="bg-[#eef8f5] rounded-2xl border border-[#d6ede4] p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0a4e3e] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#0a4e3e]">Everything looks great!</h3>
                        <p className="text-xs text-[#0a4e3e]/70 font-medium mt-0.5">
                          Your most recent report shows all values within normal range. Keep it up!
                        </p>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}