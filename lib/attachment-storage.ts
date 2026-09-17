import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

const ATTACHMENT_PREFIX = "storage://attachments/";

function storageDirectory() {
  return path.join(process.cwd(), "storage", "attachments");
}

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export function validateSupportingPhoto(file: File) {
  if (!ACCEPTED_PHOTO_MIME_TYPES.has(file.type)) {
    return "Upload a JPG, PNG, HEIC, or WebP photo.";
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return "Supporting documentation photo must be 10 MB or smaller.";
  }

  if (file.size <= 0) {
    return "Upload a valid supporting documentation photo.";
  }

  return null;
}

export async function saveAttachment(file: File) {
  const directory = storageDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const storedName = `${randomUUID()}${extensionForMimeType(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(directory, storedName), bytes, { mode: 0o600 });

  return `${ATTACHMENT_PREFIX}${storedName}`;
}

export async function readAttachment(reference: string) {
  if (!reference.startsWith(ATTACHMENT_PREFIX)) {
    throw new Error("Unsupported attachment reference.");
  }

  const filename = path.basename(reference.slice(ATTACHMENT_PREFIX.length));
  return readFile(path.join(storageDirectory(), filename));
}
