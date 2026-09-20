import { prisma } from "../lib/prisma";
import { extractText } from "./ocr.service";
import { parseBiomarkers } from "./gemini.service";
import { parseBiomarkersCloudflare } from "./cloudflare.service";
import { parseBiomarkersGrok } from "./grok.service";

export class ReportService {
  /**
   * Creates a placeholder report record in the database.
   */
  static async createPlaceholderReport(userId: string, reportName: string, filePath: string) {
    return prisma.report.create({
      data: {
        userId,
        reportName,
        filePath,
        processingStatus: "processing"
      }
    });
  }

  /**
   * Orchestrates the OCR, Parsing, and database storage in a robust transaction.
   */
  static async processReportPipeline(reportId: string, fileBuffer: Buffer, mimeType: string) {
    let ocrText = "";
    try {
      // 1. Run OCR
      ocrText = await extractText(fileBuffer, mimeType);

      // 2. Run Parsing (Cloudflare 2x -> Gemini 2x)
      let parsedResult;
      let success = false;
      let lastError: any;

      // Try Cloudflare 2 times
      for (let i = 0; i < 2; i++) {
        try {
          console.log(`[ReportService] Attempting Cloudflare parsing (Attempt ${i + 1}/2)...`);
          parsedResult = await parseBiomarkersCloudflare(ocrText);
          success = true;
          console.log(`[ReportService] Cloudflare parsing succeeded on attempt ${i + 1}`);
          break;
        } catch (error) {
          lastError = error;
          console.warn(`[ReportService] Cloudflare attempt ${i + 1} failed. Full error:`, error);
        }
      }

      // Try Gemini 2 times if Cloudflare failed
      if (!success) {
        console.log(`[ReportService] Cloudflare failed twice. Falling back to Gemini...`);
        for (let i = 0; i < 2; i++) {
          try {
            console.log(`[ReportService] Attempting Gemini parsing (Attempt ${i + 1}/2)...`);
            parsedResult = await parseBiomarkers(ocrText);
            success = true;
            console.log(`[ReportService] Gemini parsing succeeded on attempt ${i + 1}`);
            break;
          } catch (error) {
            lastError = error;
            console.warn(`[ReportService] Gemini attempt ${i + 1} failed. Full error:`, error);
          }
        }
      }

      if (!success || !parsedResult) {
        throw new Error(`All parsing attempts failed (Cloudflare and Gemini). Last error: ${JSON.stringify(lastError)}`);
      }

      // 3. Save parsed details and set to completed
      await prisma.report.update({
        where: { id: reportId },
        data: {
          reportName: parsedResult.reportName || "Medical Report",
          reportDate: parsedResult.reportDate ? new Date(parsedResult.reportDate) : null,
          ocrText,
          aiSummary: parsedResult.aiSummary,
          processingStatus: "completed",
          biomarkers: {
            create: parsedResult.biomarkers.map((b) => {
              const numericValStr = b.value.replace(/[^0-9.]/g, "");
              const numericValue = parseFloat(numericValStr);
              return {
                name: b.name,
                value: b.value,
                numericValue: isNaN(numericValue) ? null : numericValue,
                unit: b.unit || null,
                referenceRange: b.referenceRange || null,
                interpretation: b.interpretation || null
              };
            })
          }
        }
      });
    } catch (error: any) {
      console.error(`Error in report processing pipeline for report ID: ${reportId}:`, error);
      
      // Update status to failed
      await prisma.report.update({
        where: { id: reportId },
        data: {
          processingStatus: "failed",
          ocrText: ocrText || undefined,
          aiSummary: `Failed to parse document: ${error.message}`
        }
      });
    }
  }

  /**
   * Retrieves all reports for a specific user.
   */
  static async getReportsByUser(userId: string) {
    return prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Retrieves a specific report with all its biomarkers.
   */
  static async getReportAnalysis(reportId: string, userId: string) {
    return prisma.report.findFirst({
      where: {
        id: reportId,
        userId
      },
      include: {
        biomarkers: true
      }
    });
  }
}
