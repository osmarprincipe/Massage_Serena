"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Users, Edit2, Trash2, Calendar, Phone, Mail, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { formatDate, getInitials } from "@/lib/utils";
import { Client } from "@/types";
import { toast } from "sonner";

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
      router.replace("/admin/clients");
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      toast.success("Client deleted");
      fetchClients();
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <SectionHeader
        title="Clients"
        description={`${total} total clients`}
        icon={Users}
        actions={
          <Button onClick={() => { setEditClient(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        }
      />

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Client Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border">
          <EmptyState
            icon={Users}
            title="No clients found"
            description={search ? "Try a different search term" : "Add your first client to get started"}
            action={search ? undefined : { label: "Add Client", onClick: () => setDialogOpen(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-mocha-300 to-mocha-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{client.name}</p>
                    {client.user && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StatusBadge status={client.user.status} showDot />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { setEditClient(client); setDialogOpen(true); }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(client.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{client._count?.bookings || 0} bookings</span>
                </div>
                {client.user ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <LinkIcon className="h-3 w-3" />
                    <span>Linked account</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/60">No account</span>
                )}
              </div>

              {/* Notes preview */}
              {client.notes && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditClient(null); }}
        client={editClient}
        onSaved={() => { fetchClients(); setDialogOpen(false); setEditClient(null); }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        description="This will permanently delete the client and all their data. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
