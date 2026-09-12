import Tesseract from "tesseract.js";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// pdf-parse@1.x: simple callable API — pdfParse(buffer) => { text, numpages }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buf: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

/** Minimum chars to consider native text extraction successful */
const MIN_NATIVE_TEXT = 80;

// ---------------------------------------------------------------------------
// Strategy 1: Native text extraction from text-based PDFs
// Works for digital / lab-generated PDFs instantly, no image processing needed
// ---------------------------------------------------------------------------
async function nativePdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(pdfBuffer);
    return (result.text ?? "").trim();
  } catch (err) {
    console.warn("[OCR] pdf-parse failed:", (err as Error).message);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Strategy 2: Extract embedded JPEG images from PDF binary + Tesseract OCR
// Most scanned-report PDFs are simply JPEG images wrapped in a PDF container.
// We scan the raw bytes for JPEG SOI/EOI markers and extract each image.
// No pdfjs or canvas rendering needed — pure Buffer operations.
// ---------------------------------------------------------------------------
function extractEmbeddedJpegs(pdfBuffer: Buffer): Buffer[] {
  const jpegs: Buffer[] = [];
  let i = 0;

  while (i < pdfBuffer.length - 3) {
    // JPEG Start-Of-Image marker: FF D8 FF
    if (
      pdfBuffer[i] === 0xff &&
      pdfBuffer[i + 1] === 0xd8 &&
      pdfBuffer[i + 2] === 0xff
    ) {
      const start = i;
      let j = i + 4;
      let found = false;

      // Scan for JPEG End-Of-Image marker: FF D9
      while (j < pdfBuffer.length - 1) {
        if (pdfBuffer[j] === 0xff && pdfBuffer[j + 1] === 0xd9) {
          jpegs.push(pdfBuffer.slice(start, j + 2));
          i = j + 2;
          found = true;
          break;
        }
        j++;
      }

      if (!found) break;
    } else {
      i++;
    }
  }

  return jpegs;
}

async function tesseractImagePdf(pdfBuffer: Buffer): Promise<string> {
  const jpegs = extractEmbeddedJpegs(pdfBuffer);

  if (jpegs.length === 0) {
    console.warn("[OCR] No embedded JPEG images found in PDF.");
    return "";
  }

  console.log(`[OCR] Found ${jpegs.length} embedded JPEG(s). Running Tesseract...`);

  // Debug: save first JPEG to temp dir to verify extraction
  const debugPath = path.join(os.tmpdir(), "ocr_debug_extracted.jpg");
  fs.writeFileSync(debugPath, jpegs[0]);
  console.log(`[OCR] Saved first extracted JPEG to: ${debugPath} (${jpegs[0].length} bytes)`);

  const pageTexts: string[] = [];

  for (let i = 0; i < jpegs.length; i++) {
    console.log(`[OCR] Tesseract on image ${i + 1}/${jpegs.length}...`);
    const text = await runTesseract(jpegs[i]);
    console.log(`[OCR] Image ${i + 1}: ${text.length} chars`);
    if (text) pageTexts.push(text);
  }

  return pageTexts.join("\n\n").trim();
}

// ---------------------------------------------------------------------------
// Tesseract runner
// ---------------------------------------------------------------------------
async function runTesseract(imageBuffer: Buffer): Promise<string> {
  const worker = await Tesseract.createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        process.stdout.write(`\r[OCR] Tesseract: ${(m.progress * 100).toFixed(0)}%  `);
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    process.stdout.write("\n");
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

// ---------------------------------------------------------------------------
// Public API — same signature as original Google Document AI version
// ---------------------------------------------------------------------------
/**
 * Extracts text from a document buffer using a 2-strategy offline pipeline:
 *
 *  PDFs:
 *    Strategy 1 — pdf-parse: fast native text extraction (digital PDFs)
 *    Strategy 2 — JPEG extraction + Tesseract: scanned / image PDFs
 *
 *  Images (PNG, JPEG, WEBP, BMP, TIFF):
 *    → Tesseract OCR directly
 *
 * @param fileBuffer  Raw file bytes
 * @param mimeType    e.g. "application/pdf", "image/png", "image/jpeg"
 */
export async function extractText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];

  // ── Image file ─────────────────────────────────────────────────────────────
  if (IMAGE_TYPES.includes(mimeType)) {
    console.log("[OCR] Running Tesseract directly on image...");
    const text = await runTesseract(fileBuffer);
    if (!text) throw new Error("Tesseract returned empty text for the image.");
    console.log(`[OCR] Done. ${text.length} chars extracted.`);
    return text;
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (mimeType === "application/pdf") {
    // Strategy 1: native text (fast)
    console.log("[OCR] Strategy 1: native PDF text extraction...");
    const native = await nativePdfText(fileBuffer);

    if (native.length >= MIN_NATIVE_TEXT) {
      console.log(`[OCR] Native extraction succeeded (${native.length} chars).`);
      return native;
    }

    // Strategy 2: extract embedded JPEGs → Tesseract
    console.log(
      `[OCR] Native text too short (${native.length} chars). Trying JPEG extraction + Tesseract...`
    );
    const ocrText = await tesseractImagePdf(fileBuffer);

    if (!ocrText) {
      throw new Error(
        "Could not extract text from PDF. " +
          "Tried: (1) native text extraction, (2) JPEG image extraction + Tesseract OCR. " +
          "The PDF may be encrypted, password-protected, or contain unsupported image formats."
      );
    }

    console.log(`[OCR] OCR done. ${ocrText.length} chars extracted.`);
    return ocrText;
  }

  // ── Unsupported ────────────────────────────────────────────────────────────
  throw new Error(
    `Unsupported mimeType: "${mimeType}". ` +
      `Supported: ${[...IMAGE_TYPES, "application/pdf"].join(", ")}`
  );
}
