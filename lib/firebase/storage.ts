import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

function normalizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function uploadPostImage(file: File): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const safeName = normalizeName(file.name || "image");
  const path = `post-images/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, file, {
    contentType: file.type || "application/octet-stream"
  });

  return getDownloadURL(fileRef);
}
