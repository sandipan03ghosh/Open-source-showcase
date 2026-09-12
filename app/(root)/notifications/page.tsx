import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, cn } from "@/lib/utils";
import { getNotificationMessage } from "@/lib/notification-message";
import type { NotificationType } from "@/lib/notifications";

export const metadata: Metadata = { title: "Notifications" };

const Page = async () => {
  const session = await auth();
  if (!session?.id) redirect("/");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <section className="hero-container !min-h-[180px]">
        <h1 className="heading !text-[32px]">Notifications</h1>
      </section>

      <section className="section-container max-w-3xl">
        {notifications.length === 0 ? (
          <p className="no-result">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => {
              const { text, href } = getNotificationMessage(
                notification.type as NotificationType,
                notification.payload,
              );
              return (
                <li key={notification.id}>
                  <Link
                    href={href}
                    className={cn(
                      "block rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/50 transition-colors",
                      !notification.readAt && "bg-primary/5",
                    )}
                  >
                    <p className="text-[15px] text-foreground">{text}</p>
                    <p className="text-14-normal mt-1">{formatDate(notification.createdAt)}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
};

export default Page;
