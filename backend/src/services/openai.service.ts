import OpenAI from "openai";
import dotenv from "dotenv";
import { ExtractedBiomarker, ParsedReportResult } from "./gemini.service";

dotenv.config();

const apiKey = process.env.OPEN_AI_API_KEY;
if (!apiKey) {
  throw new Error("API key should be set when using the OpenAI API.");
}

const openai = new OpenAI({ apiKey });

export async function parseBiomarkers(ocrText: string): Promise<ParsedReportResult> {
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

  let lastError: unknown;
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "parsed_report",
            schema: {
              type: "object",
              properties: {
                reportName: { type: "string" },
                reportDate: { type: ["string", "null"] },
                aiSummary: { type: "string" },
                biomarkers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      value: { type: "string" },
                      unit: { type: "string" },
                      referenceRange: { type: "string" },
                      interpretation: { type: "string" },
                    },
                    required: ["name", "value", "unit", "referenceRange", "interpretation"],
                    additionalProperties: false
                  }
                }
              },
              required: ["reportName", "reportDate", "aiSummary", "biomarkers"],
              additionalProperties: false
            },
            strict: true
          }
        }
      });

      const textResponse = response.choices[0].message.content;
      if (!textResponse) {
        throw new Error("OpenAI returned an empty response body.");
      }

      const parsedData: ParsedReportResult = JSON.parse(textResponse);
      console.log("OpenAI response parsed successfully.");
      return parsedData;
    } catch (error: any) {
      lastError = error;
      
      const status = error?.status;
      const isTransientError = status === 429 || status === 503 || status === 502;
      
      if (isTransientError && attempt < MAX_RETRIES) {
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`OpenAI failed (Attempt ${attempt}/${MAX_RETRIES}, Status: ${status}). Retrying in ${Math.round(delayMs)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.warn(`OpenAI failed completely.`, error);
        break;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Unknown OpenAI error";
  console.error("OpenAI biomarker parsing failed:", lastError);
  throw new Error(`OpenAI biomarker parsing failed: ${message}`);
}
