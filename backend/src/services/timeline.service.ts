import { prisma } from "../lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TimelineBiomarker {
  id: string;
  name: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
}

export interface TimelineEvent {
  id: string;
  reportName: string;
  reportDate: string | null;   // ISO date string
  uploadDate: string;          // ISO date string
  aiSummary: string | null;
  processingStatus: string;
  biomarkers: TimelineBiomarker[];
  /** Computed flag — true if any biomarker is High or Low */
  hasAbnormals: boolean;
}

export interface TrendPoint {
  reportId: string;
  reportName: string;
  date: string;          // ISO date string (reportDate ?? uploadDate)
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
}

export interface BiomarkerTrend {
  name: string;
  unit: string | null;
  points: TrendPoint[];
}

export interface TimelineAnalysis {
  totalReports: number;
  completedReports: number;
  abnormalReports: number;
  /** biomarker names that appear High/Low in the most recent report */
  recentAbnormals: string[];
  /** biomarker names that have improved (latest → normal vs previous → abnormal) */
  improved: string[];
  /** biomarker names that have worsened (latest → abnormal vs previous → normal) */
  worsened: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function isAbnormal(interpretation: string | null) {
  if (!interpretation) return false;
  const lower = interpretation.toLowerCase();
  return lower === "high" || lower === "low";
}

// ── Service functions ──────────────────────────────────────────────────────────

/**
 * Returns all completed reports for a user, ordered chronologically (oldest → newest).
 * Each entry is a TimelineEvent with all its biomarkers.
 */
export async function getTimeline(userId: string): Promise<TimelineEvent[]> {
  const reports = await prisma.report.findMany({
    where: { userId },
    include: { biomarkers: true },
    orderBy: [
      { reportDate: "asc" },
      { uploadDate: "asc" },
    ],
  });

  return reports.map((r) => {
    const biomarkers: TimelineBiomarker[] = r.biomarkers.map((b) => ({
      id: b.id,
      name: b.name,
      value: b.value,
      numericValue: b.numericValue,
      unit: b.unit,
      referenceRange: b.referenceRange,
      interpretation: b.interpretation,
    }));

    return {
      id: r.id,
      reportName: r.reportName,
      reportDate: isoDate(r.reportDate),
      uploadDate: isoDate(r.uploadDate)!,
      aiSummary: r.aiSummary,
      processingStatus: r.processingStatus,
      biomarkers,
      hasAbnormals: biomarkers.some((b) => isAbnormal(b.interpretation)),
    };
  });
}

/**
 * Groups numeric biomarker readings across all reports into per-name trend series.
 * Only includes biomarkers that have at least one numeric value.
 */
export async function getBiomarkerTrends(userId: string): Promise<BiomarkerTrend[]> {
  const reports = await prisma.report.findMany({
    where: { userId, processingStatus: "completed" },
    include: { biomarkers: true },
    orderBy: [
      { reportDate: "asc" },
      { uploadDate: "asc" },
    ],
  });

  // Map: biomarkerName → trend points
  const trendMap = new Map<string, { unit: string | null; points: TrendPoint[] }>();

  for (const r of reports) {
    const date = isoDate(r.reportDate ?? r.uploadDate)!;

    for (const b of r.biomarkers) {
      if (b.numericValue === null) continue; // skip qualitative-only values

      const key = b.name.trim();
      if (!trendMap.has(key)) {
        trendMap.set(key, { unit: b.unit, points: [] });
      }

      trendMap.get(key)!.points.push({
        reportId: r.id,
        reportName: r.reportName,
        date,
        value: b.value,
        numericValue: b.numericValue,
        unit: b.unit,
        referenceRange: b.referenceRange,
        interpretation: b.interpretation,
      });
    }
  }

  // Convert map → sorted array (most data-rich first)
  return Array.from(trendMap.entries())
    .map(([name, { unit, points }]: [string, { unit: string | null; points: TrendPoint[] }]) => ({ name, unit, points }))
    .sort((a: BiomarkerTrend, b: BiomarkerTrend) => b.points.length - a.points.length);
}

/**
 * Computes a high-level analysis summary across the user's full history.
 */
export async function getTimelineAnalysis(userId: string): Promise<TimelineAnalysis> {
  const timeline = await getTimeline(userId);

  const completed = timeline.filter((r) => r.processingStatus === "completed");
  const abnormal = completed.filter((r) => r.hasAbnormals);

  // Most recent completed report
  const latest = [...completed].reverse()[0];
  const prev = [...completed].reverse()[1];

  const recentAbnormals = latest
    ? latest.biomarkers.filter((b) => isAbnormal(b.interpretation)).map((b) => b.name)
    : [];

  // Compare latest vs previous report for same biomarker name
  const improved: string[] = [];
  const worsened: string[] = [];

  if (latest && prev) {
    const prevMap = new Map(prev.biomarkers.map((b) => [b.name, b]));

    for (const b of latest.biomarkers) {
      const prevB = prevMap.get(b.name);
      if (!prevB) continue;

      const latestAbnormal = isAbnormal(b.interpretation);
      const prevAbnormal = isAbnormal(prevB.interpretation);

      if (prevAbnormal && !latestAbnormal) improved.push(b.name);
      if (!prevAbnormal && latestAbnormal) worsened.push(b.name);
    }
  }

  return {
    totalReports: timeline.length,
    completedReports: completed.length,
    abnormalReports: abnormal.length,
    recentAbnormals,
    improved,
    worsened,
  };
}
