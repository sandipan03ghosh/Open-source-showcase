import type { NotificationType } from "@/lib/notifications";

interface NotificationPayload {
  actorUsername?: string | null;
  repositoryName?: string;
  repositoryOwnerLogin?: string;
}

/** Pure formatting — safe to import from client components, unlike lib/notifications.ts. */
export function getNotificationMessage(
  type: NotificationType,
  payload: unknown,
): { text: string; href: string } {
  const data = (payload ?? {}) as NotificationPayload;
  const actor = data.actorUsername ?? "Someone";

  switch (type) {
    case "NEW_FOLLOWER":
      return { text: `@${actor} started following you`, href: `/developers/${actor}` };
    case "REPOSITORY_LIKED":
      return {
        text: `@${actor} liked ${data.repositoryName ?? "your repository"}`,
        href: `/repo/${data.repositoryOwnerLogin}/${data.repositoryName}`,
      };
    case "REPOSITORY_COMMENTED":
      return {
        text: `@${actor} commented on ${data.repositoryName ?? "your repository"}`,
        href: `/repo/${data.repositoryOwnerLogin}/${data.repositoryName}`,
      };
    case "REPOSITORY_REVIEWED":
      return {
        text: `@${actor} reviewed ${data.repositoryName ?? "your repository"}`,
        href: `/repo/${data.repositoryOwnerLogin}/${data.repositoryName}`,
      };
    default:
      return { text: "New notification", href: "/notifications" };
  }
}
