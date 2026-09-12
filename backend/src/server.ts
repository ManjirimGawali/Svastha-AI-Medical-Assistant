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
