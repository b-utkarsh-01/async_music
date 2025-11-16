import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Firestore schema:
// chats/{roomId}/messages/{messageId}
// chat_requests/{requestId}

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

// Chat request functions
export async function sendChatRequest(fromUid, toUid, fromDisplayName) {
  const requestId = `${fromUid}_${toUid}`;
  const requestRef = doc(db, 'chat_requests', requestId);
  await setDoc(requestRef, {
    fromUid,
    toUid,
    fromDisplayName,
    status: 'pending', // pending, accepted, rejected
    createdAt: serverTimestamp(),
  });
  return requestId;
}

export async function acceptChatRequest(requestId) {
  const requestRef = doc(db, 'chat_requests', requestId);
  await updateDoc(requestRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
}

export async function rejectChatRequest(requestId) {
  const requestRef = doc(db, 'chat_requests', requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });
}

export function listenChatRequests(uid, onUpdate) {
  const q = query(collection(db, 'chat_requests'));
  const unsub = onSnapshot(q, (snap) => {
    const requests = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.toUid === uid || data.fromUid === uid) {
        requests.push({ id: d.id, ...data });
      }
    });
    onUpdate(requests);
  });
  return unsub;
}

export default { sendMessage, listenMessages, sendControl, sendChatRequest, acceptChatRequest, rejectChatRequest, listenChatRequests };
