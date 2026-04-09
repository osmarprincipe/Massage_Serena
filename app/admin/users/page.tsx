"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, UserCircle, Edit2, Trash2, Crown, Shield, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { UserDialog } from "@/components/users/UserDialog";
import { MembershipDialog } from "@/components/users/MembershipDialog";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <SectionHeader
        title="Users"
        description={`${total} registered accounts`}
        icon={UserCircle}
        actions={
          <Button onClick={() => { setSelectedUser(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="No users found"
            description={search ? "Try a different search" : "Create your first user account"}
            action={search ? undefined : { label: "New User", onClick: () => setDialogOpen(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Membership</th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const activeMembership = user.memberships?.[0];
                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-mocha-300 to-mocha-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {getInitials(user.name || user.email)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.role === "ADMIN" ? (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-4">
                        {activeMembership ? (
                          <MembershipBadge planLevel={activeMembership.plan.level} planName={activeMembership.plan.name} />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No membership</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {user.client ? (
                          <span className="text-sm text-foreground">{user.client.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not linked</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Manage membership"
                            onClick={() => { setSelectedUser(user); setMembershipDialogOpen(true); }}
                          >
                            <Crown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            onClick={() => toggleStatus(user)}
                            className={user.status === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}
                          >
                            <ToggleLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setSelectedUser(user); setDialogOpen(true); }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        onSaved={() => { fetchUsers(); setDialogOpen(false); setSelectedUser(null); }}
      />

      <MembershipDialog
        open={membershipDialogOpen}
        onClose={() => { setMembershipDialogOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        onSaved={() => { fetchUsers(); setMembershipDialogOpen(false); setSelectedUser(null); }}
      />
    </div>
  );
}
