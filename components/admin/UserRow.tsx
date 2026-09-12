"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import { setUserBanned, setUserRole } from "@/lib/actions/admin";

export interface AdminUserRowData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "MODERATOR";
  isBanned: boolean;
  createdAt: Date | string;
}

const UserRow = ({ user, isSelf }: { user: AdminUserRowData; isSelf: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleRoleChange = (role: "USER" | "ADMIN" | "MODERATOR") => {
    startTransition(async () => {
      const result = await setUserRole(user.id, role);
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Couldn't update role", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleBanToggle = () => {
    startTransition(async () => {
      const result = await setUserBanned(user.id, !user.isBanned);
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Couldn't update user", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <p className="text-[15px] font-medium text-foreground">{user.name ?? "—"}</p>
        <p className="text-14-normal">@{user.username ?? "—"}</p>
      </td>
      <td className="py-3 pr-4 text-14-normal">{user.email ?? "—"}</td>
      <td className="py-3 pr-4">
        <select
          value={user.role}
          disabled={isPending || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as "USER" | "ADMIN" | "MODERATOR")}
          className="repo-form_input !mt-0 !py-1.5 text-sm bg-background"
        >
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </td>
      <td className="py-3 pr-4">
        <button
          type="button"
          onClick={handleBanToggle}
          disabled={isPending || isSelf}
          className="text-sm font-medium text-destructive hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {user.isBanned ? "Unban" : "Ban"}
        </button>
      </td>
    </tr>
  );
};

export default UserRow;
