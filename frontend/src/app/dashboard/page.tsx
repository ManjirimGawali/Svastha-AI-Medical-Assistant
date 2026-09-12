"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Flame,
  BarChart2,
  MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  latestScore: number | null;
  scoreDelta: number | null;
  streakClean: number;
}

interface RecentReport {
  id: string;
  title: string;
  date: string;
  initial: string;
  color: string;
  processingStatus: string;
}

interface DashboardSummary {
  stats: DashboardStats;
  recentReports: RecentReport[];
  latestSummary: string | null;
  currentFlags: string[];
  improved: string[];
  worsened: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-[#0a4e3e]", bg: "bg-[#eef8f5]", border: "border-[#d6ede4]", label: "Good", icon: TrendingUp };
  if (score >= 60) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "Fair", icon: Activity };
  return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", label: "Needs attention", icon: TrendingDown };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (!user) return null;

  const firstName = user.displayName?.split(" ")[0] || "there";
  const stats = summary?.stats;
  const sc = stats?.latestScore != null ? scoreColor(stats.latestScore) : null;
  const ScoreIcon = sc?.icon ?? Activity;

  return (
    <main className="flex-1 overflow-y-auto bg-[#f9faf7]">
      <div className="p-6 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-7">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2">
              {greet()}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
              Here&apos;s your health overview for today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSummary}
              disabled={loading}
              title="Refresh"
              className="bg-white border border-[#ecebe6] p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button className="bg-white border border-[#ecebe6] p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm relative">
              <Bell className="w-4 h-4" />
              {(summary?.currentFlags?.length ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => router.push("/dashboard/reports")}
              className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Report
            </button>
          </div>
        </header>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Reports */}
          <div className="bg-[#eef8f5] border border-[#d6ede4] p-5 rounded-lg flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports</span>
                <div className="text-3xl md:text-4xl font-black text-slate-800 mt-1.5">
                  {loading ? <SkeletonBlock className="w-12 h-9" /> : (stats?.totalReports ?? 0)}
                </div>
              </div>
              <div className="text-[#0a4e3e] bg-white/70 p-2 rounded-xl border border-[#d6ede4]">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#0a4e3e] mt-2">
              {loading ? <SkeletonBlock className="w-20 h-3" /> : `${stats?.completedReports ?? 0} processed`}
            </div>
          </div>

          {/* Health Score */}
          {/* <div className={`p-5 rounded-2xl flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all border ${
            loading || stats?.latestScore == null
              ? "bg-slate-50 border-slate-200"
              : `${sc!.bg} ${sc!.border}`
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Health Score</span>
                <div className="mt-1.5 flex items-baseline gap-1">
                  {loading ? (
                    <SkeletonBlock className="w-14 h-9" />
                  ) : stats?.latestScore != null ? (
                    <>
                      <span className="text-3xl md:text-4xl font-black text-slate-800">{stats.latestScore}</span>
                      <span className="text-xs font-bold text-slate-500">/100</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">No data</span>
                  )}
                </div>
              </div>
              {!loading && stats?.latestScore != null && (
                <div className={`${sc!.text} bg-white/70 p-2 rounded-xl border ${sc!.border}`}>
                  <ScoreIcon className="w-5 h-5 stroke-[2.5px]" />
                </div>
              )}
            </div>
            <div className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${sc?.text ?? "text-slate-400"}`}>
              {loading ? (
                <SkeletonBlock className="w-20 h-3" />
              ) : stats?.latestScore != null ? (
                <>
                  <span>{sc!.label}</span>
                  {stats.scoreDelta != null && (
                    <span className="font-semibold">
                      {stats.scoreDelta > 0 ? `+${stats.scoreDelta}` : stats.scoreDelta} pts
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400">Upload a report</span>
              )}
            </div>
          </div> */}

          {/* Flagged Biomarkers */}
          <div className={`p-5 rounded-lg flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all border ${
            (summary?.currentFlags?.length ?? 0) > 0
              ? "bg-rose-50 border-rose-100"
              : "bg-emerald-50 border-emerald-100"
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Flagged</span>
                <div className="text-3xl md:text-4xl font-black text-slate-800 mt-1.5">
                  {loading ? <SkeletonBlock className="w-10 h-9" /> : (summary?.currentFlags?.length ?? 0)}
                </div>
              </div>
              <div className={`p-2 rounded-xl border bg-white/70 ${
                (summary?.currentFlags?.length ?? 0) > 0
                  ? "text-rose-500 border-rose-100"
                  : "text-emerald-500 border-emerald-100"
              }`}>
                {(summary?.currentFlags?.length ?? 0) > 0
                  ? <AlertTriangle className="w-5 h-5" />
                  : <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>
            <div className={`text-[11px] font-bold mt-2 ${
              (summary?.currentFlags?.length ?? 0) > 0 ? "text-rose-600" : "text-emerald-600"
            }`}>
              {loading ? <SkeletonBlock className="w-24 h-3" /> :
               (summary?.currentFlags?.length ?? 0) > 0 ? "In latest report" : "All clear!"}
            </div>
          </div>

          {/* Clean Streak */}
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-lg flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Clean Streak</span>
                <div className="text-3xl md:text-4xl font-black text-slate-800 mt-1.5">
                  {loading ? <SkeletonBlock className="w-10 h-9" /> : (stats?.streakClean ?? 0)}
                </div>
              </div>
              <div className="text-amber-500 bg-white/70 p-2 rounded-xl border border-amber-100">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] font-bold text-amber-600 mt-2">
              {loading ? <SkeletonBlock className="w-20 h-3" /> : "Consecutive clean reports"}
            </div>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Reports (2-col) */}
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 lg:col-span-2 flex flex-col shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-[#faf9f5]">
              <h3 className="text-base font-extrabold text-slate-800">Recent Reports</h3>
              <button
                className="text-xs font-bold text-[#0a4e3e] hover:underline"
                onClick={() => router.push("/dashboard/reports")}
              >
                View all
              </button>
            </div>

            <div className="mt-4 space-y-3 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 border border-[#f0efea] rounded-2xl animate-pulse">
                      <SkeletonBlock className="w-11 h-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonBlock className="h-3.5 w-3/5" />
                        <SkeletonBlock className="h-3 w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-10 text-rose-500 font-semibold text-xs">{error}</div>
              ) : !summary?.recentReports.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-[#faf9f6] border border-dashed border-[#ecebe6] rounded-2xl">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">No reports uploaded yet</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Upload a medical report to start analyzing it.</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/reports")}
                    className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all shadow-sm mt-1"
                  >
                    Upload First Report
                  </button>
                </div>
              ) : (
                summary.recentReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => router.push(`/dashboard/reports/analysis?id=${report.id}`)}
                    className="w-full flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl hover:bg-[#fafbf9] hover:border-[#d6ede4] transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${report.color}`}>
                        {report.initial}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0a4e3e] transition-colors line-clamp-1 max-w-[180px] sm:max-w-xs">
                          {report.title}
                        </h4>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        report.processingStatus === "completed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : report.processingStatus === "failed"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {report.processingStatus === "completed" ? "Done" :
                         report.processingStatus === "failed" ? "Failed" : "Analyzing..."}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* AI Summary (1-col) */}
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#faf9f5] shrink-0">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0a4e3e]" />
                AI Summary
              </h3>
            </div>

            <div className="flex-1 py-4 z-10">
              {loading ? (
                <div className="space-y-2.5 animate-pulse">
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-5/6" />
                  <SkeletonBlock className="h-3 w-4/5" />
                  <SkeletonBlock className="h-3 w-3/4" />
                </div>
              ) : summary?.latestSummary ? (
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {summary.latestSummary}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-[#eef8f5] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#0a4e3e]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 max-w-[160px]">
                    Upload and process a report to see your AI summary here
                  </p>
                </div>
              )}
            </div>

            {/* Decorative wave */}
            <div className="absolute bottom-20 left-0 right-0 w-full overflow-hidden opacity-30 pointer-events-none">
              <svg viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M0 30 C 50 10, 100 50, 150 30 C 200 10, 250 50, 300 30" stroke="#0a4e3e" strokeWidth="2.5" fill="none"/>
                <path d="M0 40 C 50 20, 100 60, 150 40 C 200 20, 250 60, 300 40" stroke="#10b981" strokeWidth="1" opacity="0.5" fill="none"/>
              </svg>
            </div>

            <button
              onClick={() => router.push("/dashboard/ask-ai")}
              className="w-full bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold py-3.5 rounded-full transition-all shadow-sm text-center mt-2 z-10 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask AI a Question
            </button>
          </div>
        </div>

        {/* ── Lower Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Latest Insights */}
          <div className="bg-[#f0f7f4] border border-[#d6ede4] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="z-10">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Latest Insights</h4>
              <div className="mt-2.5">
                {loading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <SkeletonBlock className="h-3 w-full" />
                    <SkeletonBlock className="h-3 w-4/5" />
                  </div>
                ) : (summary?.currentFlags?.length ?? 0) > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">
                      {summary!.currentFlags.slice(0, 2).join(", ")}
                      {(summary!.currentFlags.length > 2) ? ` +${summary!.currentFlags.length - 2} more` : ""} flagged in your latest report.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {summary!.currentFlags.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                ) : (summary?.stats.completedReports ?? 0) > 0 ? (
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    All biomarkers in your latest report are within normal range 🎉
                  </p>
                ) : (
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    Upload your first report to see insights here.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 z-10">
              <button
                onClick={() => router.push("/dashboard/timeline")}
                className="text-[10px] font-bold bg-white text-[#0a4e3e] border border-[#d6ede4] px-4 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
              >
                View Timeline
              </button>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 text-[#0a4e3e] pointer-events-none">
              <svg width="80" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C12 2 12 12 2 12C12 12 12 22 12 22C12 22 12 12 22 12C12 12 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Improved / Worsened */}
          <div className="bg-white border border-[#ecebe6] rounded-2xl p-5 flex flex-col gap-3 shadow-sm min-h-[130px]">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Since Last Report</h4>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <SkeletonBlock className="h-3 w-3/5" />
                <SkeletonBlock className="h-3 w-2/5" />
              </div>
            ) : !summary || (summary.improved.length === 0 && summary.worsened.length === 0) ? (
              <p className="text-xs text-slate-400 font-semibold mt-auto">
                {(summary?.stats.completedReports ?? 0) >= 2
                  ? "No significant changes detected"
                  : "Need 2+ reports to compare"}
              </p>
            ) : (
              <div className="space-y-2">
                {summary.improved.slice(0, 2).map((name) => (
                  <div key={name} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{name} improved</span>
                  </div>
                ))}
                {summary.worsened.slice(0, 2).map((name) => (
                  <div key={name} className="flex items-center gap-2 text-xs font-bold text-rose-500">
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{name} worsened</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push("/dashboard/health-trend")}
              className="text-[10px] font-bold text-[#0a4e3e] bg-[#eef8f5] border border-[#d6ede4] px-4 py-1.5 rounded-full hover:bg-[#d6ede4] transition-colors self-start mt-auto"
            >
              View Trends
            </button>
          </div>

          {/* Health Tip */}
          <div className="bg-[#fcfaf2] border border-[#f3eee0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="z-10">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Health Tip</h4>
              <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed">
                {[
                  "Drink plenty of water — aim for 8 glasses a day. 💧",
                  "Take a short 10-minute walk after each meal. 🚶",
                  "Sleep 7–9 hours for optimal body recovery. 😴",
                  "Eat more fiber-rich foods to support gut health. 🥦",
                  "Practice 5 minutes of deep breathing daily. 🧘",
                ][(new Date().getDate()) % 5]}
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 text-[#d97706] pointer-events-none">
              <svg width="80" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C12 2 12 12 2 12C12 12 12 22 12 22C12 22 12 12 22 12C12 12 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
