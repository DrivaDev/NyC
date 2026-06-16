import mammoth from "mammoth"

export interface InlinePart {
  inlineData: {
    mimeType: string
    data: string // raw base64 — NO "data:image/..." prefix
  }
}

/**
 * Extract plain text from a .docx Buffer using mammoth.
 * Returns empty string if extraction fails (non-fatal — Gemini gets less context).
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer })
    return value
  } catch {
    return ""
  }
}

/**
 * Encode an image Buffer to a Gemini inline image part.
 * mimeType: "image/jpeg" or "image/png"
 * data: raw base64 string — NO "data:image/...;base64," prefix.
 */
export function encodeImageToBase64Part(buffer: Buffer, mimeType: string): InlinePart {
  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  }
}

/**
 * Unified entry point for processing any uploaded file in the Route Handler.
 * Returns extracted text (for docx/pdf) OR an InlinePart (for images).
 *
 * Accepted MIME types (CONTR-04, D-04):
 * - image/jpeg, image/png  → encodeImageToBase64Part (Gemini Vision)
 * - application/pdf        → extractPdfText
 * - application/vnd.openxmlformats-officedocument.wordprocessingml.document → extractDocxText
 *
 * Returns null for unsupported file types (caller should skip silently).
 *
 * CRITICAL: Never writes to disk — all processing is in-memory.
 */
export async function processUploadedFile(
  file: File
): Promise<{ type: "text"; text: string } | { type: "image"; part: InlinePart } | null> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (file.type === "image/jpeg" || file.type === "image/png") {
    return { type: "image", part: encodeImageToBase64Part(buffer, file.type) }
  }

  if (file.type === "application/pdf") {
    // Send PDF as native inline data — Gemini 2.5 Flash reads PDFs directly (text + OCR).
    // pdf-parse fails on browser-exported screenshot PDFs (returns "" or garbled text),
    // which was causing 0/N fields. Native PDF avoids that completely.
    return {
      type: "image",
      part: {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
    }
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const text = await extractDocxText(buffer)
    return { type: "text", text }
  }

  // Unsupported type — skip
  return null
}
