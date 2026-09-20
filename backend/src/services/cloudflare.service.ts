import OpenAI from "openai";
import dotenv from "dotenv";
import { ParsedReportResult } from "./gemini.service";

dotenv.config();

const apiKey = process.env.CLOUDFARE_AI_API || process.env.CLOUDFLARE_AI_API;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFARE_ACCOUNT_ID || "YOUR_CLOUDFLARE_ACCOUNT_ID"; // The user needs to set this

// Initialize OpenAI client pointing to Cloudflare's OpenAI-compatible endpoint
const cloudflare = new OpenAI({ 
  apiKey: apiKey || "MISSING_KEY",
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`
});

export async function parseBiomarkersCloudflare(ocrText: string): Promise<ParsedReportResult> {
  if (!apiKey) {
    throw new Error("CLOUDFARE_AI_API is not set.");
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID && !process.env.CLOUDFARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not set in your .env file. Cloudflare requires this for their API endpoint.");
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

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching this structure:
{
  "reportName": "string",
  "reportDate": "string or null",
  "aiSummary": "string",
  "biomarkers": [
    {
      "name": "string",
      "value": "string",
      "unit": "string",
      "referenceRange": "string",
      "interpretation": "string"
    }
  ]
}

OCR Raw Text:
"""
${ocrText}
"""
`;

  // User requested Llama 3.3 70B Instruct Fast
  const response = await cloudflare.chat.completions.create({
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048
  });

  let textResponse = response.choices[0]?.message?.content;
  if (!textResponse) {
    throw new Error("Cloudflare AI returned an empty response body.");
  }

  // Extract JSON from conversational text using regex
  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Cloudflare AI did not return a valid JSON object. Raw response: ${textResponse}`);
  }
  textResponse = jsonMatch[0];

  const parsedData: ParsedReportResult = JSON.parse(textResponse);
  return parsedData;
}
