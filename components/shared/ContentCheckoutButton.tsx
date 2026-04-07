"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  contentId: string;
  label: string;
}

export function ContentCheckoutButton({ contentId, label }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-content-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not start checkout");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
      style={{ background: "linear-gradient(135deg,#7a0c1c,#b11226)", color: "#f5ede6" }}
    >
      {loading ? (
        <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        label
      )}
    </button>
  );
}
