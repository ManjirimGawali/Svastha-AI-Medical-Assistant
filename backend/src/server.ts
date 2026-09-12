import dotenv from "dotenv";
// Load environment variables immediately
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { supabase } from "./supabase";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { ReportService } from "./services/report.service";
import { parseBiomarkers } from "./services/gemini.service";
import { askAI } from "./services/ask.service";
import { getTimeline, getBiomarkerTrends, getTimelineAnalysis } from "./services/timeline.service";
import { getHealthTrend } from "./services/healthtrend.service";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pgPool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Multer memory storage (files are stored in memory buffer, not written to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

app.post("/api/gemini", async (req: Request, res: Response) => {
  try {
    const text = req.body.text;
    console.log("text", text);
    const analysis = await parseBiomarkers(text);
    console.log("analysis", analysis);
    res.json({ analysis });
  } catch (error) {
    console.error("Error parsing report:", error);
    res.status(500).json({ error: "Failed to parse report" });
  }
});

// POST /api/ask — AI Q&A endpoint with per-user DB context
app.post("/api/ask", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ error: "'question' field is required and must be a non-empty string." });
    }

    const userId = req.user?.sub || "anonymous";
    const result = await askAI(userId, question.trim());

    return res.json(result);
  } catch (error: any) {
    console.error("Ask AI error:", error);
    return res.status(500).json({ error: "Failed to get AI response", details: error.message });
  }
});

// ── Timeline & Trend Endpoints ─────────────────────────────────────────────────

/**
 * GET /api/timeline
 * Returns every report (with biomarkers) ordered chronologically.
 * Includes a `hasAbnormals` flag on each entry.
 */
app.get("/api/timeline", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const events = await getTimeline(userId);
    return res.json({ events });
  } catch (error: any) {
    console.error("Timeline error:", error);
    return res.status(500).json({ error: "Failed to fetch timeline", details: error.message });
  }
});

/**
 * GET /api/timeline/trends
 * Returns numeric biomarker readings grouped by biomarker name for trend charts.
 * Only includes biomarkers with at least one numeric value.
 */
app.get("/api/timeline/trends", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const trends = await getBiomarkerTrends(userId);
    return res.json({ trends });
  } catch (error: any) {
    console.error("Trend error:", error);
    return res.status(500).json({ error: "Failed to fetch trends", details: error.message });
  }
});

/**
 * GET /api/timeline/analysis
 * Returns a high-level summary: total/completed/abnormal reports,
 * recent abnormal biomarkers, and which biomarkers improved/worsened vs last report.
 */
app.get("/api/timeline/analysis", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const analysis = await getTimelineAnalysis(userId);
    return res.json({ analysis });
  } catch (error: any) {
    console.error("Timeline analysis error:", error);
    return res.status(500).json({ error: "Failed to fetch timeline analysis", details: error.message });
  }
});

/**
 * GET /api/health-trend
 * Returns a rich health-performance summary:
 *   - healthScoreSeries  : per-report score (0-100)
 *   - latestScore        : current score & delta vs previous
 *   - categoryBreakdown  : normal/abnormal counts by biomarker category
 *   - currentFlags       : abnormal biomarkers in the latest report
 *   - velocities         : biggest changes between the last two reports
 *   - stats              : aggregate counts + clean-report streak
 */
app.get("/api/health-trend", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const trend = await getHealthTrend(userId);
    return res.json({ trend });
  } catch (error: any) {
    console.error("Health trend error:", error);
    return res.status(500).json({ error: "Failed to fetch health trend", details: error.message });
  }
});

// ── Settings API ──────────────────────────────────────────────────────────────

/**
 * GET /api/settings/profile
 * Returns the authenticated user's profile data derived from their Firebase claims
 * plus aggregate stats from the database (report count, biomarker count).
 */
app.get("/api/settings/profile", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const [reportCount, biomarkerCount] = await Promise.all([
      prisma.report.count({ where: { userId } }),
      prisma.biomarker.count({ where: { report: { userId } } }),
    ]);
    return res.json({
      profile: {
        uid: userId,
        email: req.user?.email ?? null,
        displayName: req.user?.name ?? null,
        photoURL: req.user?.picture ?? null,
        stats: { reportCount, biomarkerCount },
      },
    });
  } catch (error: any) {
    console.error("Settings profile error:", error);
    return res.status(500).json({ error: "Failed to fetch profile", details: error.message });
  }
});

/**
 * GET /api/settings/reports
 * Returns all reports for the user (id, name, date, status, biomarker count).
 * Used in the Settings > Reports Management section.
 */
app.get("/api/settings/reports", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { uploadDate: "desc" },
      include: { _count: { select: { biomarkers: true } } },
    });
    return res.json({
      reports: reports.map((r) => ({
        id: r.id,
        reportName: r.reportName,
        uploadDate: r.uploadDate.toISOString(),
        reportDate: r.reportDate ? r.reportDate.toISOString() : null,
        processingStatus: r.processingStatus,
        filePath: r.filePath,
        biomarkerCount: r._count.biomarkers,
      })),
    });
  } catch (error: any) {
    console.error("Settings reports error:", error);
    return res.status(500).json({ error: "Failed to fetch reports", details: error.message });
  }
});

/**
 * DELETE /api/reports/:id
 * Deletes a report (and its biomarkers via Prisma cascade) plus the Supabase Storage file.
 */
app.delete("/api/reports/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || "anonymous";

    // Verify ownership
    const report = await prisma.report.findFirst({ where: { id, userId } });
    if (!report) {
      return res.status(404).json({ error: "Report not found or access denied" });
    }

    // Remove file from Supabase Storage (best-effort, don't fail if missing)
    await supabase.storage.from("medical-reports").remove([report.filePath]).catch(() => {});

    // Delete from DB (cascades biomarkers)
    await prisma.report.delete({ where: { id } });

    return res.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("Delete report error:", error);
    return res.status(500).json({ error: "Failed to delete report", details: error.message });
  }
});

/**
 * DELETE /api/settings/data
 * Deletes ALL reports and biomarkers for the authenticated user.
 */
app.delete("/api/settings/data", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";

    // Get all file paths for storage cleanup
    const reports = await prisma.report.findMany({ where: { userId }, select: { filePath: true } });
    const paths = reports.map((r) => r.filePath);
    if (paths.length > 0) {
      await supabase.storage.from("medical-reports").remove(paths).catch(() => {});
    }

    // Delete all reports (cascades biomarkers)
    await prisma.report.deleteMany({ where: { userId } });

    return res.json({ success: true, deletedCount: paths.length });
  } catch (error: any) {
    console.error("Delete all data error:", error);
    return res.status(500).json({ error: "Failed to delete data", details: error.message });
  }
});

app.get("/api/manjiri", (req: Request, res: Response) => {
  res.json({ status: "healthy Manjiri", timestamp: new Date() });
});

app.get("/api/reports", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    console.log(`Fetching reports for user: ${userId}`);

    // Query database instead of Supabase storage
    const dbReports = await ReportService.getReportsByUser(userId);

    const reports = dbReports.map((report) => {
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("medical-reports").getPublicUrl(report.filePath);

      // Try to determine a type/initial (e.g. CBC, TSH, VitD)
      const ext = report.filePath.split(".").pop()?.toUpperCase() || "FILE";
      let initial = ext;
      let color = "bg-[#fee2e2] text-red-600 border-red-100"; // default red

      const cleanTitleUpper = report.reportName.toUpperCase();
      if (cleanTitleUpper.includes("BLOOD") || cleanTitleUpper.includes("CBC")) {
        initial = "CBC";
        color = "bg-[#fee2e2] text-red-600 border-red-100";
      } else if (cleanTitleUpper.includes("THYROID") || cleanTitleUpper.includes("TSH")) {
        initial = "TSH";
        color = "bg-[#dcfce7] text-[#0a4e3e] border-[#d6ede4]";
      } else if (cleanTitleUpper.includes("X-RAY") || cleanTitleUpper.includes("CHEST") || cleanTitleUpper.includes("XRAY")) {
        initial = "XR";
        color = "bg-[#dbeafe] text-blue-600 border-blue-100";
      } else if (cleanTitleUpper.includes("VITAMIN") || cleanTitleUpper.includes("VITD")) {
        initial = "VitD";
        color = "bg-[#fef9c3] text-amber-600 border-amber-100";
      } else if (ext === "PDF") {
        initial = "PDF";
        color = "bg-[#fee2e2] text-red-600 border-red-100";
      } else if (["PNG", "JPG", "JPEG"].includes(ext)) {
        initial = "IMG";
        color = "bg-[#dbeafe] text-blue-600 border-blue-100";
      }

      return {
        id: report.id,
        title: report.reportName,
        date: report.uploadDate.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        initial: initial,
        color: color,
        publicUrl: publicUrl,
        processingStatus: report.processingStatus
      };
    });

    res.json({
      message: "Fetched recent medical reports",
      reports: reports
    });

  } catch (error: any) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to get reports", details: error.message });
  }
});

// Fetch detailed analysis for a specific report
app.get("/api/reports/:id/analysis", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || "anonymous";

    const report = await ReportService.getReportAnalysis(id, userId);

    if (!report) {
      return res.status(404).json({ error: "Report not found or access denied" });
    }

    res.json({
      message: "Fetched report analysis successfully",
      report
    });
  } catch (error: any) {
    console.error("Get report analysis error:", error);
    res.status(500).json({ error: "Failed to get report analysis", details: error.message });
  }
});

// Supabase Report Upload Endpoint (secured with requireAuth middleware)
app.post("/api/upload", requireAuth, upload.single("file"), async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const bucketName = "medical-reports";

    // Ensure the bucket exists (or create it if it doesn't)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    if (!bucketExists) {
      console.log(`Creating bucket '${bucketName}'...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 25 * 1024 * 1024
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
      }
    }

    // Generate a unique filename including user ID for security and isolation
    const userId = req.user?.sub || "anonymous";
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${userId}/${Date.now()}__${sanitizedOriginalName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload file to Supabase", details: uploadError.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 1. Create a placeholder record in PostgreSQL database (status: processing)
    const dbReport = await ReportService.createPlaceholderReport(userId, file.originalname, uploadData.path);

    // 2. Trigger OCR and Gemini Parsing in the background (non-blocking)
    ReportService.processReportPipeline(dbReport.id, file.buffer, file.mimetype);


    return res.status(200).json({
      message: "File uploaded and processed successfully",
      reportId: dbReport.id,
      filePath: uploadData.path,
      publicUrl: publicUrl,
      fileName: file.originalname,
      size: file.size,
      uploadedBy: userId
    });

  } catch (error: any) {
    console.error("Server upload error:", error);
    return res.status(500).json({ error: "Server upload failed", details: error.message });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction): any => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "File is too large. Maximum limit is 25MB."
    });
  }
  next(err);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
});
