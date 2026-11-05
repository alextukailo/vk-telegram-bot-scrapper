export interface VkPhotoSize { url: string; width: number; height: number }
export interface VkPostRaw {
  id: number;
  owner_id: number;
  date: number;
  text?: string;
  is_pinned?: number;
  attachments?: Array<{
    type: string;
    photo?: { sizes?: VkPhotoSize[] };
  }>;
}
export interface NormalizedPost {
  id: string;
  text: string;
  createdAt: Date;
  link: string;
  photoUrl: string | null;
}
export function normalizePost(post: VkPostRaw): NormalizedPost {
  const photos = post.attachments?.filter((a) => a.type === 'photo').flatMap((a) => a.photo?.sizes ?? []) ?? [];
  const photoUrl = [...photos].sort((a, b) => b.width * b.height - a.width * a.height)[0]?.url ?? null;
  return {
    id: `${post.owner_id}_${post.id}`,
    text: post.text ?? '',
    createdAt: new Date(post.date * 1000),
    link: `https://vk.com/wall${post.owner_id}_${post.id}`,
    photoUrl,
  };
}
