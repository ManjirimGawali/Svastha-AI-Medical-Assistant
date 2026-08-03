import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { supabase } from "./supabase";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";

// Load environment variables
dotenv.config();

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

app.get("/api/reports", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.sub || "anonymous";
    const bucketName = "medical-reports";

    // List files under the user's directory
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(userId, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (listError) {
      console.error("Error listing files from Supabase:", listError);
      return res.status(500).json({ error: "Failed to list files from Supabase", details: listError.message });
    }

    const reports = (files || []).map((file) => {
      // Decode the filename.
      // Expected name format: timestamp__sanitizedOriginalName
      let title = file.name;
      let uploadTimestamp = file.created_at ? new Date(file.created_at).getTime() : Date.now();

      if (file.name.includes("__")) {
        const parts = file.name.split("__");
        const tsPart = parseInt(parts[0], 10);
        if (!isNaN(tsPart)) {
          uploadTimestamp = tsPart;
        }
        title = parts.slice(1).join("__");
      }

      // Format date nicely: e.g., "12 Jun, 2024"
      const dateObj = new Date(uploadTimestamp);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${userId}/${file.name}`);

      // Try to determine a type/initial (e.g. CBC, TSH, VitD)
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      let initial = ext;
      let color = "bg-[#fee2e2] text-red-600 border-red-100"; // default red

      const cleanTitleUpper = title.toUpperCase();
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
        id: file.id,
        title: title,
        date: formattedDate,
        initial: initial,
        color: color,
        size: file.metadata?.size,
        publicUrl: publicUrl
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

    return res.status(200).json({
      message: "File uploaded successfully to Supabase",
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
});
