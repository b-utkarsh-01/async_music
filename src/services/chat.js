import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Firestore schema:
// chats/{roomId}/messages/{messageId}

export async function sendMessage(roomId, { uid, displayName, text, photoURL = null, type = 'message', meta = null }) {
  const col = collection(db, 'chats', roomId, 'messages');
  const doc = await addDoc(col, {
    uid,
    displayName: displayName || null,
    text: text || null,
    photoURL,
    type,
    meta,
    createdAt: serverTimestamp(),
  });
  return doc;
}

export async function sendControl(roomId, { uid, displayName, control }) {
  // control is an object like { action: 'play'|'pause'|'seek', position: number }
  return sendMessage(roomId, { uid, displayName, text: null, type: 'control', meta: control });
}

export function listenMessages(roomId, onUpdate) {
  const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('createdAt'));
  const unsub = onSnapshot(q, (snap) => {
    const msgs = [];
    snap.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
    onUpdate(msgs);
  });
  return unsub;
}

export default { sendMessage, listenMessages, sendControl };
