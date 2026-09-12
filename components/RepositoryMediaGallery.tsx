"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, CloudUpload } from "lucide-react";

import { useUploadThing } from "@/lib/uploadthing";
import { removeRepositoryMedia } from "@/lib/actions/repository";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  type: "IMAGE" | "GIF" | "VIDEO" | "SCREENSHOT";
  url: string;
}

const RepositoryMediaGallery = ({
  repositoryId,
  media,
  isOwner,
}: {
  repositoryId: string;
  media: MediaItem[];
  isOwner: boolean;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("repositoryMedia", {
    onClientUploadComplete: () => {
      toast({ title: "Media uploaded" });
      router.refresh();
    },
    onUploadError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    startUpload(Array.from(files), { repositoryId });
    event.target.value = "";
  };

  const handleDelete = async (mediaId: string) => {
    setIsDeleting(mediaId);
    const result = await removeRepositoryMedia(mediaId);
    setIsDeleting(null);
    if (result.status === "SUCCESS") {
      router.refresh();
    } else {
      toast({ title: "Couldn't remove media", description: result.error, variant: "destructive" });
    }
  };

  if (media.length === 0 && !isOwner) return null;

  return (
    <div className="space-y-4">
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-border"
            >
              {item.type === "VIDEO" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={item.url} controls className="w-full h-48 object-cover bg-muted" />
              ) : (
                <Image
                  src={item.url}
                  alt="Repository media"
                  width={400}
                  height={240}
                  className="w-full h-48 object-cover"
                  unoptimized={item.type === "GIF"}
                />
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting === item.id}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Remove media"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
          <CloudUpload className="size-5" />
          {isUploading ? "Uploading..." : "Upload screenshots, GIFs, or a demo video"}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
};

export default RepositoryMediaGallery;
