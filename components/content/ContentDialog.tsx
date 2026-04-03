"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { FileUploadField } from "@/components/content/FileUploadField";
import { CheckSquare, Square, X, Upload, Images, FileText } from "lucide-react";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const contentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaType: z.enum(["VIDEO", "AUDIO", "IMAGE", "PDF", "TEXT"]),
  contentUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishDate: z.string().optional(),
  separatePurchaseEnabled: z.boolean(),
  separatePurchasePrice: z.coerce.number().optional(),
});

const albumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishDate: z.string().optional(),
  separatePurchaseEnabled: z.boolean(),
  separatePurchasePrice: z.coerce.number().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;
type AlbumFormData = z.infer<typeof albumSchema>;

// ─── Album item state ─────────────────────────────────────────────────────────

interface AlbumItemState {
  _key: string;           // local key for React rendering
  id?: string;            // set if item already exists in DB
  mediaUrl: string;
  caption: string;
  sortOrder: number;
  _deleted?: boolean;
  _isNew?: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentDialogProps {
  open: boolean;
  onClose: () => void;
  content?: any | null;   // set → edit single content
  album?: any | null;     // set → edit album
  onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mediaTypeAccept(type: string): string | undefined {
  const map: Record<string, string> = {
    IMAGE: "image/*",
    PDF: ".pdf,application/pdf",
    VIDEO: "video/*",
    AUDIO: "audio/*",
  };
  return map[type];
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentDialog({ open, onClose, content, album, onSaved }: ContentDialogProps) {
  const isEditingContent = !!content;
  const isEditingAlbum = !!album;
  const isEditing = isEditingContent || isEditingAlbum;

  // For new items: let the admin pick "content" or "album"
  const [itemType, setItemType] = useState<"content" | "album">("content");

  // Resolved mode
  const mode: "content" | "album" = isEditingContent
    ? "content"
    : isEditingAlbum
    ? "album"
    : itemType;

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  // ── Content form ──────────────────────────────────────────────────────────

  const contentForm = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: { mediaType: "VIDEO", status: "DRAFT", separatePurchaseEnabled: false },
  });
  const { register: regC, handleSubmit: handleC, reset: resetC, watch: watchC, setValue: setC, formState: { errors: errC } } = contentForm;
  const separatePurchaseC = watchC("separatePurchaseEnabled");

  // ── Album form ────────────────────────────────────────────────────────────

  const albumForm = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
    defaultValues: { status: "DRAFT", separatePurchaseEnabled: false },
  });
  const { register: regA, handleSubmit: handleA, reset: resetA, watch: watchA, setValue: setA, formState: { errors: errA } } = albumForm;
  const separatePurchaseA = watchA("separatePurchaseEnabled");

  // ── Album items ───────────────────────────────────────────────────────────

  const [albumItems, setAlbumItems] = useState<AlbumItemState[]>([]);
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemCaption, setNewItemCaption] = useState("");
  const keyCounter = useRef(0);

  function nextKey() {
    return `item-${++keyCounter.current}`;
  }

  // ── Load data when dialog opens ───────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    fetchPlans();

    if (isEditingContent) {
      resetC({
        title: content.title,
        description: content.description || "",
        mediaType: content.mediaType,
        contentUrl: content.contentUrl || "",
        thumbnailUrl: content.thumbnailUrl || "",
        status: content.status,
        publishDate: content.publishDate ? new Date(content.publishDate).toISOString().split("T")[0] : "",
        separatePurchaseEnabled: content.separatePurchaseEnabled,
        separatePurchasePrice: content.separatePurchasePrice || undefined,
      });
      setSelectedPlanIds(content.membershipAccess?.map((a: any) => a.planId || a.plan?.id) || []);
    } else if (isEditingAlbum) {
      resetA({
        title: album.title,
        description: album.description || "",
        coverImageUrl: album.coverImageUrl || "",
        status: album.status,
        publishDate: album.publishDate ? new Date(album.publishDate).toISOString().split("T")[0] : "",
        separatePurchaseEnabled: album.separatePurchaseEnabled,
        separatePurchasePrice: album.separatePurchasePrice || undefined,
      });
      setSelectedPlanIds(album.membershipAccess?.map((a: any) => a.planId || a.plan?.id) || []);
      setAlbumItems(
        (album.items || []).map((item: any) => ({
          _key: nextKey(),
          id: item.id,
          mediaUrl: item.mediaUrl,
          caption: item.caption || "",
          sortOrder: item.sortOrder ?? 0,
        }))
      );
    } else {
      // New item
      setItemType("content");
      resetC({ mediaType: "VIDEO", status: "DRAFT", separatePurchaseEnabled: false, title: "", description: "", contentUrl: "", thumbnailUrl: "", publishDate: "" });
      resetA({ status: "DRAFT", separatePurchaseEnabled: false, title: "", description: "", coverImageUrl: "", publishDate: "" });
      setSelectedPlanIds([]);
      setAlbumItems([]);
    }

    setNewItemUrl("");
    setNewItemCaption("");
  }, [open, content, album, isEditingContent, isEditingAlbum]);

  const fetchPlans = async () => {
    const res = await fetch("/api/memberships");
    const data = await res.json();
    setPlans(data.data || []);
  };

  const togglePlan = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  // ── Album item helpers ────────────────────────────────────────────────────

  const addAlbumItem = () => {
    const url = newItemUrl.trim();
    if (!url) return;
    setAlbumItems((prev) => [
      ...prev,
      { _key: nextKey(), mediaUrl: url, caption: newItemCaption.trim(), sortOrder: prev.length, _isNew: true },
    ]);
    setNewItemUrl("");
    setNewItemCaption("");
  };

  const removeAlbumItem = (key: string) => {
    setAlbumItems((prev) =>
      prev.map((item) =>
        item._key === key
          ? { ...item, _deleted: true }
          : item
      )
    );
  };

  const visibleItems = albumItems.filter((i) => !i._deleted);

  // ── Submit: content ───────────────────────────────────────────────────────

  const onSubmitContent = handleC(async (data) => {
    setLoading(true);
    try {
      const url = isEditingContent ? `/api/content/${content.id}` : "/api/content";
      const method = isEditingContent ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, planIds: selectedPlanIds }),
      });
      if (res.ok) {
        toast.success(isEditingContent ? "Content updated" : "Content created");
        onSaved();
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  });

  // ── Submit: album ─────────────────────────────────────────────────────────

  const onSubmitAlbum = handleA(async (data) => {
    setLoading(true);
    try {
      let albumId: string;

      if (isEditingAlbum) {
        // 1. Update album metadata
        const res = await fetch(`/api/albums/${album.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, planIds: selectedPlanIds }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to update album");
          return;
        }
        albumId = album.id;

        // 2. Delete removed items
        const deletedIds = albumItems.filter((i) => i._deleted && i.id).map((i) => i.id!);
        await Promise.all(
          deletedIds.map((id) =>
            fetch(`/api/albums/${albumId}/items/${id}`, { method: "DELETE" })
          )
        );

        // 3. Create new items
        const newItems = albumItems.filter((i) => i._isNew && !i._deleted);
        if (newItems.length > 0) {
          await fetch(`/api/albums/${albumId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: newItems.map(({ mediaUrl, caption, sortOrder }) => ({ mediaUrl, caption, sortOrder })),
            }),
          });
        }

        toast.success("Album updated");
      } else {
        // 1. Create album
        const res = await fetch("/api/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, planIds: selectedPlanIds }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to create album");
          return;
        }
        const json = await res.json();
        albumId = json.data.id;

        // 2. Add items if any
        const itemsToSave = albumItems.filter((i) => !i._deleted);
        if (itemsToSave.length > 0) {
          await fetch(`/api/albums/${albumId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: itemsToSave.map(({ mediaUrl, caption, sortOrder }) => ({ mediaUrl, caption, sortOrder })),
            }),
          });
        }

        toast.success("Album created");
      }

      onSaved();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  });

  // ── Shared sections ───────────────────────────────────────────────────────

  const MembershipAccessSection = (
    <div className="space-y-3">
      <Label>Membership Access</Label>
      <p className="text-xs text-muted-foreground">Select which membership tiers can access this.</p>
      <div className="grid grid-cols-3 gap-2">
        {plans.map((plan) => {
          const isSelected = selectedPlanIds.includes(plan.id);
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => togglePlan(plan.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <MembershipBadge level={plan.name} size="sm" showIcon={false} />
            </button>
          );
        })}
      </div>
    </div>
  );

  function SeparatePurchaseSection({
    enabled,
    onToggle,
    priceRegister,
  }: {
    enabled: boolean;
    onToggle: (v: boolean) => void;
    priceRegister: any;
  }) {
    return (
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow Separate Purchase</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Let users without a qualifying membership buy this individually
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        {enabled && (
          <div className="space-y-1.5">
            <Label>Purchase Price (USD)</Label>
            <Input type="number" min={0} step={0.01} placeholder="29.99" {...priceRegister} />
          </div>
        )}
      </div>
    );
  }

  // ── Dialog title ──────────────────────────────────────────────────────────

  const title = isEditingContent
    ? "Edit Content"
    : isEditingAlbum
    ? "Edit Album"
    : "New Content";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* ── Type selector (only for new items) ─────────────────────────── */}
        {!isEditing && (
          <div className="px-6 pt-2">
            <div className="flex gap-2 p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setItemType("content")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  itemType === "content"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                Single Content
              </button>
              <button
                type="button"
                onClick={() => setItemType("album")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  itemType === "album"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Images className="h-4 w-4" />
                Album
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SINGLE CONTENT FORM                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "content" && (
          <form onSubmit={onSubmitContent}>
            <DialogBody className="space-y-5">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="Content title" {...regC("title")} />
                {errC.title && <p className="text-xs text-destructive">{errC.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Describe this content…" rows={3} {...regC("description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Media Type</Label>
                  <Select value={watchC("mediaType")} onValueChange={(v) => setC("mediaType", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["VIDEO", "AUDIO", "IMAGE", "PDF", "TEXT"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={watchC("status")} onValueChange={(v) => setC("status", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content URL / Upload */}
              {watchC("mediaType") !== "TEXT" ? (
                <FileUploadField
                  label="Content File"
                  value={watchC("contentUrl") || ""}
                  onChange={(url) => setC("contentUrl", url)}
                  accept={mediaTypeAccept(watchC("mediaType"))}
                  placeholder="https://..."
                />
              ) : (
                <div className="space-y-1.5">
                  <Label>Content URL</Label>
                  <Input placeholder="https://..." {...regC("contentUrl")} />
                </div>
              )}

              {/* Thumbnail URL / Upload */}
              <FileUploadField
                label="Thumbnail / Cover Image"
                value={watchC("thumbnailUrl") || ""}
                onChange={(url) => setC("thumbnailUrl", url)}
                accept="image/*"
                placeholder="https://..."
              />

              <div className="space-y-1.5">
                <Label>Publish Date</Label>
                <Input type="date" {...regC("publishDate")} />
              </div>

              {MembershipAccessSection}

              <SeparatePurchaseSection
                enabled={separatePurchaseC}
                onToggle={(v) => setC("separatePurchaseEnabled", v)}
                priceRegister={regC("separatePurchasePrice")}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={loading}>
                {isEditingContent ? "Save Changes" : "Create Content"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ALBUM FORM                                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "album" && (
          <form onSubmit={onSubmitAlbum}>
            <DialogBody className="space-y-5">
              <div className="space-y-1.5">
                <Label>Album Title *</Label>
                <Input placeholder="Album title" {...regA("title")} />
                {errA.title && <p className="text-xs text-destructive">{errA.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Describe this album…" rows={3} {...regA("description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={watchA("status")} onValueChange={(v) => setA("status", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Publish Date</Label>
                  <Input type="date" {...regA("publishDate")} />
                </div>
              </div>

              {/* Cover image */}
              <FileUploadField
                label="Cover Image"
                value={watchA("coverImageUrl") || ""}
                onChange={(url) => setA("coverImageUrl", url)}
                accept="image/*"
                placeholder="https://..."
              />

              {/* Album Items */}
              <div className="space-y-3">
                <Label>Album Items</Label>

                {/* Existing / staged items */}
                {visibleItems.length > 0 && (
                  <div className="space-y-2">
                    {visibleItems.map((item) => (
                      <div
                        key={item._key}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/30"
                      >
                        {/* Preview */}
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {isImageUrl(item.mediaUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.mediaUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{item.mediaUrl}</p>
                          {item.caption && (
                            <p className="text-xs text-muted-foreground truncate">{item.caption}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAlbumItem(item._key)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new item */}
                <div className="p-3 rounded-xl border border-dashed border-border space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Add item</p>
                  <FileUploadField
                    label="Media File or URL"
                    value={newItemUrl}
                    onChange={setNewItemUrl}
                    accept="image/*,video/*,audio/*,.pdf"
                    placeholder="https://..."
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      value={newItemCaption}
                      onChange={(e) => setNewItemCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAlbumItem}
                      disabled={!newItemUrl.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {MembershipAccessSection}

              <SeparatePurchaseSection
                enabled={separatePurchaseA}
                onToggle={(v) => setA("separatePurchaseEnabled", v)}
                priceRegister={regA("separatePurchasePrice")}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={loading}>
                {isEditingAlbum ? "Save Album" : "Create Album"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
