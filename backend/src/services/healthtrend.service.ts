import { prisma } from "../lib/prisma";

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function isAbnormal(interpretation: string | null | undefined) {
  if (!interpretation) return false;
  const l = interpretation.toLowerCase();
  return l === "high" || l === "low";
}

function effectiveDate(r: { reportDate: Date | null; uploadDate: Date }): Date {
  return r.reportDate ?? r.uploadDate;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HealthScorePoint {
  date: string;
  reportName: string;
  score: number; // 0–100
  abnormalCount: number;
  totalCount: number;
  normalCount: number;
}

export interface BiomarkerCategoryBreakdown {
  category: string;
  normal: number;
  abnormal: number;
  total: number;
  abnormalRate: number; // 0–1
}

export interface RecentFlag {
  biomarkerName: string;
  value: string;
  unit: string | null;
  interpretation: string;
  referenceRange: string | null;
  reportName: string;
  date: string;
}

export interface TrendVelocity {
  biomarkerName: string;
  unit: string | null;
  latestValue: number;
  previousValue: number;
  deltaAbsolute: number;
  deltaPct: number; // percentage change
  direction: "up" | "down" | "stable";
  latestInterpretation: string | null;
}

export interface HealthTrendSummary {
  /** Overall health score series (one point per report, newest last) */
  healthScoreSeries: HealthScorePoint[];
  /** Latest score (0–100), null if no data */
  latestScore: number | null;
  /** Score delta vs previous report (+/-), null if only one report */
  scoreDelta: number | null;
  /** Breakdown of biomarkers by guessed category */
  categoryBreakdown: BiomarkerCategoryBreakdown[];
  /** All currently-flagged biomarkers from the latest completed report */
  currentFlags: RecentFlag[];
  /** Biomarkers where value changed most across the last two reports */
  velocities: TrendVelocity[];
  /** Summary counts */
  stats: {
    totalReports: number;
    completedReports: number;
    totalBiomarkersTracked: number;
    uniqueBiomarkers: number;
    streakCleanReports: number; // consecutive clean reports from newest backwards
  };
}

// ── Category guesser ────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  hemoglobin: "Blood",
  hematocrit: "Blood",
  rbc: "Blood",
  wbc: "Blood",
  platelet: "Blood",
  "red blood": "Blood",
  "white blood": "Blood",
  neutrophil: "Blood",
  lymphocyte: "Blood",
  monocyte: "Blood",
  eosinophil: "Blood",
  basophil: "Blood",
  mcv: "Blood",
  mch: "Blood",
  mchc: "Blood",
  rdw: "Blood",

  glucose: "Metabolic",
  hba1c: "Metabolic",
  insulin: "Metabolic",
  creatinine: "Metabolic",
  urea: "Metabolic",
  bun: "Metabolic",
  uric: "Metabolic",
  gfr: "Metabolic",

  cholesterol: "Lipid",
  triglyceride: "Lipid",
  hdl: "Lipid",
  ldl: "Lipid",
  vldl: "Lipid",

  tsh: "Thyroid",
  t3: "Thyroid",
  t4: "Thyroid",
  "free t3": "Thyroid",
  "free t4": "Thyroid",
  thyroxine: "Thyroid",

  sodium: "Electrolyte",
  potassium: "Electrolyte",
  chloride: "Electrolyte",
  calcium: "Electrolyte",
  magnesium: "Electrolyte",
  phosphorus: "Electrolyte",
  bicarbonate: "Electrolyte",

  alt: "Liver",
  ast: "Liver",
  alp: "Liver",
  bilirubin: "Liver",
  albumin: "Liver",
  protein: "Liver",
  ggt: "Liver",

  vitamin: "Vitamins",
  ferritin: "Vitamins",
  folate: "Vitamins",
  iron: "Vitamins",
  b12: "Vitamins",

  psa: "Hormones",
  testosterone: "Hormones",
  estrogen: "Hormones",
  progesterone: "Hormones",
  cortisol: "Hormones",
  prolactin: "Hormones",
};

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return "Other";
}

// ── Score algorithm ────────────────────────────────────────────────────────

/**
 * Health score = (normal_biomarkers / total_biomarkers) * 100
 * Clamped to [0, 100].
 */
function computeScore(normal: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((normal / total) * 100);
}

// ── Main export ────────────────────────────────────────────────────────────────

type BiomarkerRow = {
  name: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
};

export async function getHealthTrend(userId: string): Promise<HealthTrendSummary> {
  const reports = await prisma.report.findMany({
    where: { userId },
    include: { biomarkers: true },
    orderBy: [{ reportDate: "asc" }, { uploadDate: "asc" }],
  });

  const completed = reports.filter((r: { processingStatus: string; biomarkers: BiomarkerRow[] }) => r.processingStatus === "completed");

  // ── Health score series ─────────────────────────────────────────────────────
  const healthScoreSeries: HealthScorePoint[] = completed.map((r) => {
    const total = r.biomarkers.length;
    const abnormal = r.biomarkers.filter((b) => isAbnormal(b.interpretation)).length;
    const normal = total - abnormal;
    return {
      date: isoDate(effectiveDate(r))!,
      reportName: r.reportName,
      score: computeScore(normal, total),
      abnormalCount: abnormal,
      normalCount: normal,
      totalCount: total,
    };
  });

  const latestScore =
    healthScoreSeries.length > 0
      ? healthScoreSeries[healthScoreSeries.length - 1].score
      : null;

  const scoreDelta =
    healthScoreSeries.length >= 2
      ? healthScoreSeries[healthScoreSeries.length - 1].score -
        healthScoreSeries[healthScoreSeries.length - 2].score
      : null;

  // ── Category breakdown (across ALL completed biomarkers) ──────────────────
  const categoryMap = new Map<string, { normal: number; abnormal: number }>();
  for (const r of completed) {
    for (const b of r.biomarkers) {
      const cat = guessCategory(b.name);
      if (!categoryMap.has(cat)) categoryMap.set(cat, { normal: 0, abnormal: 0 });
      const entry = categoryMap.get(cat)!;
      if (isAbnormal(b.interpretation)) entry.abnormal++;
      else entry.normal++;
    }
  }
  const categoryBreakdown: BiomarkerCategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, { normal, abnormal }]: [string, { normal: number; abnormal: number }]) => {
      const total = normal + abnormal;
      return {
        category,
        normal,
        abnormal,
        total,
        abnormalRate: total > 0 ? abnormal / total : 0,
      };
    })
    .sort((a: BiomarkerCategoryBreakdown, b: BiomarkerCategoryBreakdown) => b.total - a.total);

  // ── Current flags (from latest completed report) ─────────────────────────
  const latestReport = completed[completed.length - 1];
  const currentFlags: RecentFlag[] = latestReport
    ? latestReport.biomarkers
        .filter((b) => isAbnormal(b.interpretation))
        .map((b) => ({
          biomarkerName: b.name,
          value: b.value,
          unit: b.unit,
          interpretation: b.interpretation!,
          referenceRange: b.referenceRange,
          reportName: latestReport.reportName,
          date: isoDate(effectiveDate(latestReport))!,
        }))
    : [];

  // ── Velocity (latest vs previous, only numeric biomarkers) ─────────────
  const velocities: TrendVelocity[] = [];
  if (completed.length >= 2) {
    const latest = completed[completed.length - 1];
    const prev = completed[completed.length - 2];

    const prevMap = new Map<string, BiomarkerRow>(
      prev.biomarkers
        .filter((b: BiomarkerRow) => b.numericValue !== null)
        .map((b: BiomarkerRow) => [b.name.trim().toLowerCase(), b])
    );

    for (const b of latest.biomarkers) {
      if (b.numericValue === null) continue;
      const prevB = prevMap.get(b.name.trim().toLowerCase());
      if (!prevB || prevB.numericValue === null) continue;

      const delta = b.numericValue - prevB.numericValue;
      const deltaPct =
        prevB.numericValue !== 0 ? (delta / Math.abs(prevB.numericValue)) * 100 : 0;

      velocities.push({
        biomarkerName: b.name,
        unit: b.unit,
        latestValue: b.numericValue,
        previousValue: prevB.numericValue,
        deltaAbsolute: delta,
        deltaPct: Math.round(deltaPct * 10) / 10,
        direction: Math.abs(delta) < 0.0001 ? "stable" : delta > 0 ? "up" : "down",
        latestInterpretation: b.interpretation,
      });
    }

    // Sort by absolute percentage change descending
    velocities.sort((a: TrendVelocity, b: TrendVelocity) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const uniqueBiomarkers = new Set(
    completed.flatMap((r: { biomarkers: BiomarkerRow[] }) => r.biomarkers.map((b: BiomarkerRow) => b.name.trim().toLowerCase()))
  ).size;

  const totalBiomarkersTracked = completed.reduce((sum: number, r: { biomarkers: BiomarkerRow[] }) => sum + r.biomarkers.length, 0);

  // Streak = consecutive clean reports from newest backwards
  let streakCleanReports = 0;
  for (let i = completed.length - 1; i >= 0; i--) {
    const r = completed[i];
    if (r.biomarkers.some((b) => isAbnormal(b.interpretation))) break;
    streakCleanReports++;
  }

  return {
    healthScoreSeries,
    latestScore,
    scoreDelta,
    categoryBreakdown,
    currentFlags,
    velocities,
    stats: {
      totalReports: reports.length,
      completedReports: completed.length,
      totalBiomarkersTracked,
      uniqueBiomarkers,
      streakCleanReports,
    },
  };
}
