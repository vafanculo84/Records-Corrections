import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SIGNATURE_PREFIX = "storage://signatures/";

function storageDirectory() {
  return path.join(process.cwd(), "storage", "signatures");
}

export async function saveSignature(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error("Unsupported signature image.");
  }

  const directory = storageDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = `${randomUUID()}.png`;
  await writeFile(path.join(directory, filename), Buffer.from(match[1], "base64"), {
    mode: 0o600,
  });

  return `${SIGNATURE_PREFIX}${filename}`;
}

export async function readSignature(reference: string) {
  if (!reference.startsWith(SIGNATURE_PREFIX)) {
    throw new Error("Unsupported signature reference.");
  }

  const filename = path.basename(reference.slice(SIGNATURE_PREFIX.length));
  return readFile(path.join(storageDirectory(), filename));
}
