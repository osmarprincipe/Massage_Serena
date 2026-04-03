"use client";

import { useRef, useState } from "react";
import { Link, Upload, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  required?: boolean;
}

export function FileUploadField({
  label,
  value,
  onChange,
  accept,
  placeholder = "https://...",
  required,
}: FileUploadFieldProps) {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Upload failed");
        return;
      }
      onChange(json.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      // reset so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
              mode === "url"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Link className="h-3 w-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
              mode === "file"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </div>
            ) : value ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-emerald-600">File uploaded</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
                <p className="text-xs text-primary">Click to replace</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Click to choose a file</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
