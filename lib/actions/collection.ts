"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { collectionSchema } from "@/lib/validation";

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true }).slice(0, 60) || "collection";
  let slug = base;
  let suffix = 1;

  while (await prisma.collection.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

export async function createCollection(_state: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const parsed = collectionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") || "PUBLIC",
  });
  if (!parsed.success) {
    return parseServerActionResponse({
      error: parsed.error.issues[0]?.message ?? "Invalid collection.",
      status: "ERROR",
    });
  }

  const slug = await generateUniqueSlug(parsed.data.name);

  const collection = await prisma.collection.create({
    data: {
      ownerId: session.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility,
      slug,
    },
  });

  revalidatePath("/collections");
  return parseServerActionResponse({ status: "SUCCESS", error: "", slug: collection.slug });
}

export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { ownerId: true },
  });
  if (!collection) {
    return parseServerActionResponse({ error: "Collection not found.", status: "ERROR" });
  }
  if (collection.ownerId !== session.id) {
    return parseServerActionResponse({ error: "Only the owner can delete this collection.", status: "ERROR" });
  }

  await prisma.collection.delete({ where: { id: collectionId } });
  revalidatePath("/collections");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function addRepositoryToCollection(collectionId: string, repositoryId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { ownerId: true, slug: true, _count: { select: { items: true } } },
  });
  if (!collection) {
    return parseServerActionResponse({ error: "Collection not found.", status: "ERROR" });
  }
  if (collection.ownerId !== session.id) {
    return parseServerActionResponse({ error: "Only the owner can edit this collection.", status: "ERROR" });
  }

  const existing = await prisma.collectionItem.findUnique({
    where: { collectionId_repositoryId: { collectionId, repositoryId } },
  });
  if (existing) {
    return parseServerActionResponse({ error: "Already in this collection.", status: "ERROR" });
  }

  await prisma.collectionItem.create({
    data: { collectionId, repositoryId, position: collection._count.items },
  });

  revalidatePath(`/collections/${collection.slug}`);
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function removeRepositoryFromCollection(collectionItemId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const item = await prisma.collectionItem.findUnique({
    where: { id: collectionItemId },
    select: { collection: { select: { ownerId: true, slug: true } } },
  });
  if (!item) {
    return parseServerActionResponse({ error: "Item not found.", status: "ERROR" });
  }
  if (item.collection.ownerId !== session.id) {
    return parseServerActionResponse({ error: "Only the owner can edit this collection.", status: "ERROR" });
  }

  await prisma.collectionItem.delete({ where: { id: collectionItemId } });
  revalidatePath(`/collections/${item.collection.slug}`);
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
