import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const MEDIA_PATH = 'blog-media';

export interface MediaItem {
  url: string;
  path: string;
  name: string;
  type: 'image' | 'video';
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const ext = file.name.split('.').pop() || '';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, `${MEDIA_PATH}/${fileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const url = await getDownloadURL(storageRef);
  const type = file.type.startsWith('video/') ? 'video' : 'image';

  return { url, path: storageRef.fullPath, name: file.name, type };
}

export async function listMedia(): Promise<MediaItem[]> {
  const listRef = ref(storage, MEDIA_PATH);
  const result = await listAll(listRef);

  const items: MediaItem[] = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      const name = itemRef.name;
      const isVideo = /\.(mp4|mov|webm|avi)$/i.test(name);
      return { url, path: itemRef.fullPath, name, type: isVideo ? 'video' : 'image' };
    })
  );

  return items.sort((a, b) => b.name.localeCompare(a.name));
}

export async function deleteMedia(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
