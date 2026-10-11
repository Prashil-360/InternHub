/**
 * FIX #3 — Reusable file upload component using Cloudinary signed uploads.
 * Usage: <FileUpload onUpload={(url) => setAttachmentUrl(url)} />
 */
"use client";
import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
}

export default function FileUpload({
  onUpload,
  folder = "internhub/submissions",
  accept = "image/*,.pdf,.doc,.docx",
  label = "Attach file (optional)",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      // Get signed params from our API
      const signRes = await fetch(`/api/upload/sign?folder=${encodeURIComponent(folder)}`);
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();

      onUpload(data.secure_url);
      setUploadedName(file.name);
      toast.success("File uploaded!");
    } catch (err) {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="label">{label}</p>
      {uploadedName ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-700 text-sm flex-1 truncate">{uploadedName}</span>
          <button
            type="button"
            onClick={() => { setUploadedName(""); onUpload(""); }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            uploading ? "opacity-50 cursor-not-allowed" : "hover:border-sky-300 hover:bg-sky-50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-slate-400" />
          )}
          <p className="text-slate-500 text-sm text-center">
            {uploading ? "Uploading…" : "Click to upload or drag & drop"}
          </p>
          <p className="text-slate-400 text-xs">PDF, DOC, Images up to 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}
    </div>
  );
}
