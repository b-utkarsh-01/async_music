import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listenMessages, sendMessage, sendControl } from '../../services/chat';

export default function ChatRoom({ roomId: initialRoom = 'global' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [roomId, setRoomId] = useState(initialRoom);
  const [isPrivate, setIsPrivate] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = listenMessages(roomId, (msgs) => {
      setMessages(msgs);
      // dispatch control messages as window events for other components (e.g., Player) to handle
      msgs.forEach((m) => {
        if (m.type === 'control' && m.meta) {
          window.dispatchEvent(new CustomEvent('remote-music-control', { detail: { roomId, from: m.uid, control: m.meta } }));
        }
      });
    });
    return () => unsub && unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    try {
      await sendMessage(roomId, {
        uid: user.uid,
        displayName: user.email || user.uid,
        text: text.trim(),
        photoURL: user.photoURL || null,
      });
      setText('');
    } catch (err) {
      console.error('Send failed', err);
      alert('Message send failed');
    }
  };

  const startPrivateChat = () => {
    if (!partnerId) return alert('Enter partner user ID');
    if (partnerId === user.uid) return alert('Cannot chat with yourself');
    // deterministic room id based on both uids
    const ids = [user.uid, partnerId].sort();
    const r = `private_${ids[0]}_${ids[1]}`;
    setRoomId(r);
    setIsPrivate(true);
    setMessages([]);
  };

  const leavePrivate = () => {
    setRoomId(initialRoom);
    setIsPrivate(false);
    setPartnerId('');
    setMessages([]);
  };

  const sendPlay = async () => {
    // example control: play
    try {
      await sendControl(roomId, { uid: user.uid, displayName: user.email || user.uid, control: { action: 'play' } });
    } catch (e) {
      console.error('sendPlay failed', e);
    }
  };

  const sendPause = async () => {
    try {
      await sendControl(roomId, { uid: user.uid, displayName: user.email || user.uid, control: { action: 'pause' } });
    } catch (e) {
      console.error('sendPause failed', e);
    }
  };

  const sendSeek = async (position) => {
    try {
      await sendControl(roomId, { uid: user.uid, displayName: user.email || user.uid, control: { action: 'seek', position } });
    } catch (e) {
      console.error('sendSeek failed', e);
    }
  };

  if (!user) {
    return <div className="p-6 text-white">Please login to join the chat.</div>;
  }

  return (
    <div className="p-6 text-white max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Chat Room</h2>

      <div className="mb-4 flex items-center gap-2">
        {!isPrivate ? (
          <>
            <input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="p-2 bg-gray-800 rounded" placeholder="Partner UID for private chat" />
            <button onClick={startPrivateChat} className="bg-indigo-600 px-3 py-1 rounded">Start Private</button>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-400">Private chat with <span className="font-medium">{partnerId}</span></div>
            <button onClick={leavePrivate} className="ml-2 bg-red-600 px-2 py-1 rounded">Leave</button>
          </>
        )}
      </div>

      <div className="bg-gray-900 rounded p-4 h-72 overflow-y-auto mb-3">
        {messages.length === 0 ? (
          <div className="text-gray-400">No messages yet. Say hi 👋</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`mb-2 ${m.uid === user.uid ? 'text-right' : 'text-left'}`}>
              <div className="text-sm text-gray-400">{m.displayName || m.uid}</div>
              {m.type === 'control' ? (
                <div className="text-sm italic text-yellow-300">[Control] {JSON.stringify(m.meta)}</div>
              ) : (
                <div className={`inline-block px-3 py-2 rounded ${m.uid === user.uid ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                  {m.text}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mb-3 flex gap-2">
        <form onSubmit={handleSend} className="flex gap-2 flex-1 bg-gray-800 rounded p-2">
          <input
            className="flex-1 p-2 bg-gray-800 rounded"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="bg-blue-600 px-3 py-1 rounded w-20 text-white">Send</button>
        </form>

        {/* Sync controls visible in private chats */}
        {isPrivate && (
          <div className="flex gap-2 items-center">
            <button onClick={sendPlay} className="bg-green-500 px-3 py-1 rounded">Play</button>
            <button onClick={sendPause} className="bg-yellow-500 px-3 py-1 rounded">Pause</button>
            <button onClick={() => { const pos = Number(prompt('Seek to seconds:')); if (!Number.isNaN(pos)) sendSeek(pos); }} className="bg-indigo-500 px-3 py-1 rounded">Seek</button>
          </div>
        )}
      </div>
    </div>
  );
}
