import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  repositoryMedia: f({
    image: { maxFileSize: "8MB", maxFileCount: 8 },
    video: { maxFileSize: "64MB", maxFileCount: 3 },
  })
    .input(z.object({ repositoryId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const session = await auth();
      if (!session?.id) throw new UploadThingError("Unauthorized");

      const repository = await prisma.repository.findUnique({
        where: { id: input.repositoryId },
        select: { ownerId: true },
      });
      if (!repository || repository.ownerId !== session.id) {
        throw new UploadThingError("You do not own this repository.");
      }

      return { repositoryId: input.repositoryId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const type = file.type.startsWith("video")
        ? "VIDEO"
        : file.type === "image/gif"
          ? "GIF"
          : "IMAGE";

      const order = await prisma.media.count({
        where: { repositoryId: metadata.repositoryId },
      });

      await prisma.media.create({
        data: {
          repositoryId: metadata.repositoryId,
          type,
          url: file.ufsUrl,
          key: file.key,
          order,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
