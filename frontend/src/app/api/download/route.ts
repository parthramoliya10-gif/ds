import { NextRequest, NextResponse } from "next/server";

// Common MIME types to file extensions mapping for fallback
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.ms-powerpoint": ".ppt",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "application/json": ".json",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const rawFilename = searchParams.get("filename") || searchParams.get("name") || "document";

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }

    if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }

    // Server-side fetch without browser CORS restrictions
    const upstreamRes = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file from storage: ${upstreamRes.status} ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    let cleanFilename = rawFilename.replace(/[\r\n"]/g, "").trim() || "downloaded-file";

    // Detect Content-Type from upstream response
    let contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";

    // If filename has no extension, attempt to append the correct extension from contentType or URL
    const hasExtension = cleanFilename.includes(".") && cleanFilename.lastIndexOf(".") > 0;
    if (!hasExtension) {
      const extFromMime = MIME_TO_EXT[contentType.toLowerCase()];
      if (extFromMime) {
        cleanFilename += extFromMime;
      } else {
        // Try extracting from fileUrl path
        try {
          const pathname = new URL(fileUrl).pathname;
          const match = pathname.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/);
          if (match && match[1]) {
            cleanFilename += `.${match[1]}`;
          }
        } catch {
          // Keep as is
        }
      }
    } else {
      // If filename has .docx or .pdf, ensure Content-Type is correct
      const lower = cleanFilename.toLowerCase();
      if (lower.endsWith(".docx")) {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (lower.endsWith(".doc")) {
        contentType = "application/msword";
      } else if (lower.endsWith(".pdf")) {
        contentType = "application/pdf";
      } else if (lower.endsWith(".xlsx")) {
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (lower.endsWith(".png")) {
        contentType = "image/png";
      } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      }
    }

    // ASCII safe fallback for Content-Disposition
    const asciiFilename = cleanFilename.replace(/[^\x20-\x7E]/g, "_");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
    );
    headers.set("Cache-Control", "public, max-age=3600");

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("Error in /api/download:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error streaming download" },
      { status: 500 }
    );
  }
}
