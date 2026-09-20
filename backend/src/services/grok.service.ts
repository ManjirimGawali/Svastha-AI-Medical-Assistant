import OpenAI from "openai";
import dotenv from "dotenv";
import { ParsedReportResult } from "./gemini.service";

dotenv.config();

const apiKey = process.env.GROK_API_KEY;
// We allow missing key during initialization but throw if used, 
// or just initialize if present.
const grok = new OpenAI({ 
  apiKey: apiKey || "MISSING_KEY",
  baseURL: "https://api.x.ai/v1"
});

export async function parseBiomarkersGrok(ocrText: string): Promise<ParsedReportResult> {
  if (!process.env.GROK_API_KEY) {
    throw new Error("GROK_API_KEY is not set.");
  }

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

  const response = await grok.chat.completions.create({
    model: "grok-beta", // or the appropriate Grok model like grok-2
    messages: [{ role: "user", content: prompt }],
    // Grok supports standard chat completions. If JSON schema is not fully supported, we just ask for JSON output.
    response_format: { type: "json_object" }
  });

  const textResponse = response.choices[0].message.content;
  if (!textResponse) {
    throw new Error("Grok returned an empty response body.");
  }

  const parsedData: ParsedReportResult = JSON.parse(textResponse);
  return parsedData;
}
