import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("API key should be set when using the Gemini API.");
}
const ai = new GoogleGenAI({ apiKey });
const GEMINI_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-flash-latest",
];
export interface ExtractedBiomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: string;
}

export interface ParsedReportResult {
  reportName: string;
  reportDate: string | null;
  aiSummary: string;
  biomarkers: ExtractedBiomarker[];
}

/**
 * Parses raw OCR text into structured medical biomarkers and metadata using Gemini.
 * @param ocrText The raw text extracted from the document
 */
function extractJsonText(response: any): string {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text;
  }

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((part: any) => typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("")
    .trim();

  return text;
}

export async function parseBiomarkers(ocrText: string, modelToUse = "gemini-flash-latest"): Promise<ParsedReportResult> {
  const prompt = `
You are an expert AI medical reports parser. Analyze the following OCR extracted raw text from a patient's medical laboratory report.
Extract the:
1. Report Name (e.g., Complete Blood Count, Thyroid Profile, Liver Function Test).
2. Report Date (Format: YYYY-MM-DD. If missing, return null).
3. A brief, simple-to-understand explanation of the overall findings (AI Summary).
4. All the individual test components (biomarkers) listed in the report. For each biomarker, extract:
   - name (e.g. "Hemoglobin", "TSH")
   - value (the result value, e.g. "14.2", "Negative")
   - unit (e.g. "g/dL", "uIU/mL", or empty if unit is not applicable)
   - referenceRange (e.g. "12.0 - 15.5")
   - interpretation (determine if the value is "Normal", "High", "Low" based on the reference range and values provided or standard guidelines)

OCR Raw Text:
"""
${ocrText}
"""
`;

  const response = await ai.models.generateContent({
    model: modelToUse,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          reportName: { type: "STRING" },
          reportDate: { type: "STRING", nullable: true },
          aiSummary: { type: "STRING" },
          biomarkers: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                value: { type: "STRING" },
                unit: { type: "STRING" },
                referenceRange: { type: "STRING" },
                interpretation: { type: "STRING" }
              },
              required: ["name", "value", "unit", "referenceRange", "interpretation"]
            }
          }
        },
        required: ["reportName", "reportDate", "aiSummary", "biomarkers"]
      }
    }
  });

  const textResponse = extractJsonText(response);
  if (!textResponse) {
    throw new Error("Gemini returned an empty response body.");
  }

  const parsedData: ParsedReportResult = JSON.parse(textResponse);
  return parsedData;
}

