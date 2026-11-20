/**
 * Universal download helper that triggers browser file downloads
 * preserving the original filename and file extension.
 *
 * For cross-origin assets (e.g. Cloudinary, S3), it routes through
 * the same-origin Next.js /api/download streaming proxy so that
 * browser Content-Disposition headers are strictly honored.
 */
export function downloadFile(url?: string, filename?: string) {
  if (!url || url === "#") {
    throw new Error("Download URL is not available.");
  }

  const safeFilename = filename || "document";

  // If already a local blob: or data: URL, trigger direct browser download
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Construct same-origin proxy download URL
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeFilename)}`;

  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = safeFilename;
  // Use invisible anchor trigger
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
