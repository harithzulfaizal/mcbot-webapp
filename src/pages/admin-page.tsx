import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyTextToClipboard } from "@/lib/clipboard";
import { AuthUser } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

type AdminUser = {
  id: number;
  username: string;
  created_at: string;
  is_admin: boolean;
  is_kb_maintainer: boolean;
  has_password: boolean;
  has_active_setup_link: boolean;
};

interface AdminPageProps {
  currentUser: AuthUser;
}

export default function AdminPage({ currentUser }: AdminPageProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newMaintainer, setNewMaintainer] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/users"), {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch users.");
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser.token]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newUsername.trim()) {
      setError("Username is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          is_kb_maintainer: newMaintainer,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create user.");
      }
      setGeneratedLink(String(data.setup_link || ""));
      setNewUsername("");
      setNewMaintainer(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaintainerToggle = async (user: AdminUser, checked: boolean) => {
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${user.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ is_kb_maintainer: checked }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to update user.");
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    }
  };

  const handleRegenerateSetupLink = async (userId: number) => {
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}/setup-link`), {
        method: "POST",
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate setup link.");
      }
      setGeneratedLink(String(data.setup_link || ""));
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate setup link.");
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <h1 className="mb-2 text-xl font-semibold">Admin - User Management</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Create users, assign KB maintainer access, and generate password setup links.
        </p>

        {error ? (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleCreateUser} className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-base font-semibold">Create user</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="new-username"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={newMaintainer}
                onChange={(e) => setNewMaintainer(e.target.checked)}
              />
              KB maintainer
            </label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>

        {generatedLink ? (
          <div className="mb-6 rounded-lg border bg-card p-4">
            <p className="mb-2 text-sm font-medium">Temporary setup link</p>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input value={generatedLink} readOnly />
              <Button
                type="button"
                onClick={async () => {
                  await copyTextToClipboard(generatedLink);
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">Users</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Has Password</th>
                  <th className="px-4 py-3">Active Setup Link</th>
                  <th className="px-4 py-3">KB Maintainer</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">{user.is_admin ? "Admin" : "User"}</td>
                      <td className="px-4 py-3">{user.has_password ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{user.has_active_setup_link ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        {user.is_admin ? (
                          "N/A"
                        ) : (
                          <input
                            type="checkbox"
                            checked={user.is_kb_maintainer}
                            onChange={(e) => handleMaintainerToggle(user, e.target.checked)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_admin ? null : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerateSetupLink(user.id)}
                          >
                            Generate Setup Link
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
