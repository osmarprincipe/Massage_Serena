"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Canvas crop utility ──────────────────────────────────────────────────────

async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = imageSrc;
  });

  // Always output at 800×1000px (4:5) so cards are uniform
  const OUT_W = 800;
  const OUT_H = 1000;

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUT_W,
    OUT_H
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas produced no blob"));
      },
      "image/jpeg",
      0.92
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CoverCropperProps {
  /** The original (uncropped) image URL to crop from. */
  src: string;
  /** Called with the URL of the uploaded cropped image. */
  onApply: (croppedUrl: string) => void;
  onCancel: () => void;
}

export function CoverCropper({ src, onApply, onCancel }: CoverCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await cropImageToBlob(src, croppedAreaPixels);
      const fd = new FormData();
      fd.append("file", blob, "cover.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onApply(json.url);
      toast.success("Cover crop applied");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply crop";
      // If canvas taint (external image with no CORS header)
      if (msg.includes("tainted") || msg.includes("cross") || msg.includes("SecurityError")) {
        toast.error("This image blocks cropping. Try uploading the file instead of using a URL.");
      } else {
        toast.error(msg);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ background: "#0f0b0a", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: "#f5ede6" }}>
            Adjust Cover Crop
          </p>
          <p className="text-[11px]" style={{ color: "#6b5040" }}>
            4:5 ratio · Drag to reposition · Scroll or slide to zoom
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#8a7f78" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f5ede6")}
          onMouseLeave={e => (e.currentTarget.style.color = "#8a7f78")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Crop area */}
      <div className="relative" style={{ height: "340px" }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#0a0706" },
            cropAreaStyle: {
              border: "2px solid rgba(212,175,55,0.70)",
              boxShadow: "0 0 0 9999px rgba(8,5,5,0.72)",
            },
          }}
        />
      </div>

      {/* Controls */}
      <div
        className="px-4 py-4 space-y-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
            className="p-1 rounded transition-opacity hover:opacity-70 shrink-0"
            style={{ color: "#8a7f78" }}
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <div className="flex-1 relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${((zoom - 1) / (3 - 1)) * 100}%`,
                background: "linear-gradient(90deg, #7a0c1c, #d4af37)",
              }}
            />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ height: "100%" }}
            />
          </div>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            className="p-1 rounded transition-opacity hover:opacity-70 shrink-0"
            style={{ color: "#8a7f78" }}
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <span className="text-[11px] w-8 text-right shrink-0" style={{ color: "#6b5040" }}>
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{
              background: "transparent",
              borderColor: "rgba(255,255,255,0.10)",
              color: "#8a7f78",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-[1.18]"
            style={{
              background: "linear-gradient(135deg, #7a0c1c, #b11226)",
              color: "#f5ede6",
              boxShadow: "0 2px 10px rgba(122,12,28,0.40)",
            }}
          >
            {applying ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Apply Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
