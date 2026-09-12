import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// ── Gemini client ──────────────────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
const ai = new GoogleGenAI({ apiKey });

// ── Prisma client ──────────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AskAIResponse {
  answer: string;
}

/**
 * Builds a rich DB context string from all of a user's completed reports
 * and their associated biomarkers.
 */
async function buildUserContext(userId: string): Promise<string> {
  const reports = await prisma.report.findMany({
    where: { userId, processingStatus: "completed" },
    include: { biomarkers: true },
    orderBy: { reportDate: "desc" },
  });

  if (reports.length === 0) {
    return "The patient has no medical reports on file yet.";
  }

  const lines: string[] = ["=== Patient Medical Records ===\n"];

  for (const report of reports) {
    lines.push(`--- Report: ${report.reportName} ---`);
    lines.push(`Date: ${report.reportDate ? report.reportDate.toISOString().split("T")[0] : "Unknown"}`);
    if (report.aiSummary) lines.push(`Summary: ${report.aiSummary}`);

    if (report.biomarkers.length > 0) {
      lines.push("Biomarkers:");
      for (const b of report.biomarkers) {
        lines.push(
          `  • ${b.name}: ${b.value}${b.unit ? " " + b.unit : ""} ` +
            `(Ref: ${b.referenceRange ?? "N/A"}) — ${b.interpretation ?? "N/A"}`
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 s → 2 s → 4 s

/** Waits for `ms` milliseconds. */
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Extracts plain text from a Gemini response object. Returns empty string if nothing found. */
function extractText(response: any): string {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }
  return (
    response?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => typeof p?.text === "string")
      .map((p: any) => p.text)
      .join("") ?? ""
  );
}

/**
 * Answers a user's medical question using their personal report data as context.
 * Retries up to MAX_RETRIES times with exponential back-off on failure or empty response.
 *
 * @param userId   - Authenticated user's ID (to scope DB queries)
 * @param question - The free-text question from the user
 */
export async function askAI(userId: string, question: string): Promise<AskAIResponse> {
  const dbContext = await buildUserContext(userId);

  const systemInstruction = `You are Svastha, a friendly and knowledgeable AI medical assistant.
You have access to the patient's medical records provided below.
Use this data to give accurate, personalised answers.
Always be empathetic, clear, and concise.
If a question is completely unrelated to medical topics or the patient's data, politely redirect.
Never diagnose; always recommend consulting a healthcare professional for clinical decisions.

${dbContext}`;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[askAI] Attempt ${attempt}/${MAX_RETRIES} for userId=${userId}`);

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: question,
        config: { systemInstruction },
      });

      const answer = extractText(response);

      if (!answer) {
        throw new Error("Gemini returned an empty response body.");
      }

      return { answer };
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[askAI] Attempt ${attempt} failed: ${msg}`);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1 s, 2 s, 4 s
        console.log(`[askAI] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  const errorMsg = lastError instanceof Error ? lastError.message : "Unknown Gemini error";
  console.error(`[askAI] All ${MAX_RETRIES} attempts failed:`, lastError);
  throw new Error(`Gemini request failed after ${MAX_RETRIES} attempts: ${errorMsg}`);
}
