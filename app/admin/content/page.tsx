"use client";

import { useState, useEffect, useCallback } from "react";
import type React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Search, PlaySquare, Filter, Lock, Unlock, Edit2, Trash2,
  Video, Music, FileText, Image as ImageIcon, Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ContentCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { ContentDialog } from "@/components/content/ContentDialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mediaTypeIcons: Record<string, any> = {
  VIDEO: Video,
  AUDIO: Music,
  PDF: FileText,
  IMAGE: ImageIcon,
  TEXT: FileText,
  ALBUM: Images,
};

const mediaTypeStyles: Record<string, React.CSSProperties> = {
  VIDEO: { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
  AUDIO: { background: "rgba(100,30,80,0.30)", color: "#d4a0cc" },
  PDF:   { background: "rgba(120,80,10,0.30)", color: "#d4a055" },
  IMAGE: { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
  TEXT:  { background: "rgba(40,35,32,0.85)",  color: "#8a7f78" },
  ALBUM: { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
};

interface GridItem {
  _type: "content" | "album";
  id: string;
  title: string;
  description?: string;
  status: string;
  thumbnailUrl?: string;    // content
  coverImageUrl?: string;   // album
  mediaType?: string;       // content
  membershipAccess?: any[];
  separatePurchaseEnabled?: boolean;
  separatePurchasePrice?: number;
  _count?: { purchases?: number; items?: number };
  createdAt: string;
  // raw object for passing to dialog
  _raw: any;
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState<any | null>(null);
  const [editAlbum, setEditAlbum] = useState<any | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<GridItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [contentRes, albumsRes] = await Promise.all([
        fetch(`/api/content?${params}`).then((r) => r.json()),
        fetch(`/api/albums?${params}`).then((r) => r.json()),
      ]);

      const contentItems: GridItem[] = (contentRes.data || []).map((c: any) => ({
        _type: "content",
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl,
        mediaType: c.mediaType,
        membershipAccess: c.membershipAccess,
        separatePurchaseEnabled: c.separatePurchaseEnabled,
        separatePurchasePrice: c.separatePurchasePrice,
        _count: c._count,
        createdAt: c.createdAt,
        _raw: c,
      }));

      const albumItems: GridItem[] = (albumsRes.data || []).map((a: any) => ({
        _type: "album",
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        coverImageUrl: a.coverImageUrl,
        mediaType: "ALBUM",
        membershipAccess: a.membershipAccess,
        separatePurchaseEnabled: a.separatePurchaseEnabled,
        separatePurchasePrice: a.separatePurchasePrice,
        _count: a._count,
        createdAt: a.createdAt,
        _raw: a,
      }));

      // Merge and sort by createdAt desc
      const merged = [...contentItems, ...albumItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(merged);
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openNewDialog();
      router.replace("/admin/content");
    }
  }, [searchParams, router]);

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const openNewDialog = () => {
    setEditContent(null);
    setEditAlbum(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: GridItem) => {
    if (item._type === "content") {
      setEditContent(item._raw);
      setEditAlbum(null);
    } else {
      setEditAlbum(item._raw);
      setEditContent(null);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditContent(null);
    setEditAlbum(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url =
        deleteTarget._type === "album"
          ? `/api/albums/${deleteTarget.id}`
          : `/api/content/${deleteTarget.id}`;
      await fetch(url, { method: "DELETE" });
      toast.success(deleteTarget._type === "album" ? "Album deleted" : "Content deleted");
      fetchItems();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const total = items.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl space-y-6">
      <SectionHeader
        title="Content Library"
        description={`${total} item${total !== 1 ? "s" : ""}`}
        icon={PlaySquare}
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <ContentCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border">
          <EmptyState
            icon={PlaySquare}
            title="No content yet"
            description="Start building your premium content library"
            action={{ label: "Create Content", onClick: openNewDialog }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item) => {
            const MediaIcon = mediaTypeIcons[item.mediaType || ""] || FileText;
            const membershipLevels = item.membershipAccess?.map((a: any) => a.plan.name) || [];
            const isAccessible = membershipLevels.length > 0;
            const thumbUrl = item._type === "album" ? item.coverImageUrl : item.thumbnailUrl;
            const itemCount = item._type === "album" ? item._count?.items : undefined;

            return (
              <div
                key={`${item._type}-${item.id}`}
                className="group relative rounded-2xl overflow-hidden transition-all duration-[350ms] ease-out hover:-translate-y-1"
                style={{ background: "#181312", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.20)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,12,28,0.28)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden" style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover brightness-95 contrast-[1.04] transition-transform duration-[450ms] ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-[450ms] ease-out group-hover:scale-105">
                      <MediaIcon className="h-12 w-12" style={{ color: "#8a7f78" }} />
                    </div>
                  )}
                  {/* Warm tint */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-900/[0.05] via-transparent to-amber-950/[0.18] pointer-events-none" />
                  {/* Deep gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/[0.06] to-transparent transition-opacity duration-[350ms] ease-out group-hover:from-black/70" />

                  {/* Type badge */}
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
                    style={mediaTypeStyles[item.mediaType || ""] || { background: "rgba(40,35,32,0.90)", color: "#8a7f78" }}
                  >
                    <MediaIcon className="h-3 w-3" />
                    {item._type === "album"
                      ? `Album${itemCount !== undefined ? ` · ${itemCount}` : ""}`
                      : item.mediaType}
                  </div>

                  {/* Lock indicator */}
                  <div className="absolute top-3 right-3">
                    {isAccessible ? (
                      <div className="p-1.5 rounded-lg bg-emerald-500/85 text-white backdrop-blur-sm">
                        <Unlock className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-black/50 text-white/90 backdrop-blur-sm">
                        <Lock className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Hover actions — fade in from centre */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-[300ms] ease-out bg-black/10">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-premium backdrop-blur-sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="shadow-premium"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 pt-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 flex-1 tracking-tight">
                      {item.title}
                    </h3>
                    <StatusBadge status={item.status} showDot={false} />
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {membershipLevels.map((level: string) => (
                      <MembershipBadge key={level} level={level} size="sm" showIcon={false} />
                    ))}
                    {membershipLevels.length === 0 && (
                      <span className="text-[11px] text-muted-foreground/70 italic">No access defined</span>
                    )}
                  </div>

                  {item.separatePurchaseEnabled && item.separatePurchasePrice && (
                    <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground/70">Also available for</span>
                      <span className="text-sm font-bold text-primary tracking-tight">
                        {formatCurrency(item.separatePurchasePrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContentDialog
        open={dialogOpen}
        onClose={closeDialog}
        content={editContent}
        album={editAlbum}
        onSaved={() => { fetchItems(); closeDialog(); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?._type === "album" ? "Delete Album" : "Delete Content"}
        description={
          deleteTarget?._type === "album"
            ? "This will permanently delete the album and all its items."
            : "This will permanently delete the content item."
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
