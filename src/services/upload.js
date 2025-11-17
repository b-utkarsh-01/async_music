import { storage, db } from './firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function uploadTrackFile({ file, user, title, artist, tags = [], onProgress }) {
  if (!user) return Promise.reject(new Error('Not authenticated'));

  const path = `tracks/${user.uid}/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref, file);

    task.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(percent);
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          const doc = await addDoc(collection(db, 'tracks'), {
            title,
            artist,
            url,
            ownerId: user.uid,
            tags,
            createdAt: serverTimestamp(),
            storagePath: path,
          });
          resolve({ url, storagePath: path, docId: doc.id });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

export function addTrackViaUrl({ url, user, title, artist, tags = [] }) {
  if (!user) return Promise.reject(new Error('Not authenticated'));
  if (!url || !url.startsWith('http')) return Promise.reject(new Error('Invalid URL'));

  return addDoc(collection(db, 'tracks'), {
    title,
    artist,
    url,
    ownerId: user.uid,
    tags,
    createdAt: serverTimestamp(),
  }).then((doc) => ({ url, docId: doc.id }));
}

export default uploadTrackFile;
