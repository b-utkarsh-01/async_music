import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listenMessages, sendMessage, sendControl, sendChatRequest, acceptChatRequest, rejectChatRequest, listenChatRequests } from '../../services/chat';

export default function ChatRoom() {
  const { user, userProfile } = useAuth();
  const [chats, setChats] = useState(() => {
    // Load all saved chats from localStorage
    const saved = localStorage.getItem(`user_chats_${user?.uid}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState('');
  const [text, setText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatRequests, setChatRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const bottomRef = useRef(null);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (user && chats.length > 0) {
      localStorage.setItem(`user_chats_${user.uid}`, JSON.stringify(chats));
    }
  }, [chats, user]);

  // Auto-select first chat if available
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Listen to messages for active chat
  useEffect(() => {
    if (!activeChatId || !user) return;

    const activeChat = chats.find(chat => chat.id === activeChatId);
    if (!activeChat) return;

    const unsub = listenMessages(activeChat.roomId, (msgs) => {
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: msgs, lastMessage: msgs[msgs.length - 1] || null }
            : chat
        )
      );
      // Update partner display name from messages
      const latestMessage = msgs[msgs.length - 1];
      if (latestMessage && latestMessage.uid !== user.uid) {
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === activeChatId && !chat.partnerDisplayName
              ? { ...chat, partnerDisplayName: latestMessage.displayName || latestMessage.uid }
              : chat
          )
        );
      }
      // dispatch control messages as window events for other components (e.g., Player) to handle
      msgs.forEach((m) => {
        if (m.type === 'control' && m.meta) {
          window.dispatchEvent(new CustomEvent('remote-music-control', { detail: { roomId: activeChat.roomId, from: m.uid, control: m.meta } }));
        }
      });
    });
    return () => unsub && unsub();
  }, [activeChatId, user]);

  // Listen to chat requests
  useEffect(() => {
    if (!user) return;
    const unsub = listenChatRequests(user.uid, (requests) => {
      setChatRequests(requests);

      // Check for accepted requests from this user and create chats
      requests.forEach((request) => {
        if (request.fromUid === user.uid && request.status === 'accepted') {
          // Check if chat already exists
          const existingChat = chats.find(chat => chat.partnerId === request.toUid);
          if (!existingChat) {
            // Create the chat for the sender
            const ids = [user.uid, request.toUid].sort();
            const roomId = `private_${ids[0]}_${ids[1]}`;
            const newChat = {
              id: Date.now().toString() + '_accepted',
              partnerId: request.toUid,
              partnerDisplayName: request.toDisplayName || request.toUid, // Assuming we have toDisplayName, but might need to fetch
              roomId,
              messages: [],
              lastMessage: null,
              unreadCount: 0
            };
            setChats(prev => [...prev, newChat]);
          }
        }
      });
    });
    return () => unsub && unsub();
  }, [user, chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const startNewChat = async () => {
    if (!newPartnerId.trim()) return alert('Enter partner user ID');
    if (newPartnerId === user.uid) return alert('Cannot chat with yourself');

    // Check if chat already exists
    const existingChat = chats.find(chat => chat.partnerId === newPartnerId);
    if (existingChat) {
      setActiveChatId(existingChat.id);
      setNewPartnerId('');
      return;
    }

    try {
      // Send chat request instead of directly creating chat
      await sendChatRequest(user.uid, newPartnerId, userProfile?.username || user.email || user.uid);
      alert('Chat request sent! Wait for the other user to accept.');
      setNewPartnerId('');
    } catch (err) {
      console.error('Failed to send chat request', err);
      alert('Failed to send chat request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptChatRequest(requestId);

      // Find the request to get partner info
      const request = chatRequests.find(r => r.id === requestId);
      if (!request) return;

      // Remove the request from the list immediately
      setChatRequests(prev => prev.filter(r => r.id !== requestId));

      // Create the chat after acceptance
      const ids = [user.uid, request.fromUid].sort();
      const roomId = `private_${ids[0]}_${ids[1]}`;
      const newChat = {
        id: Date.now().toString(),
        partnerId: request.fromUid,
        partnerDisplayName: request.fromDisplayName,
        roomId,
        messages: [],
        lastMessage: null,
        unreadCount: 0
      };

      setChats(prev => [...prev, newChat]);
      setActiveChatId(newChat.id);
    } catch (err) {
      console.error('Failed to accept request', err);
      alert('Failed to accept chat request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectChatRequest(requestId);
      // Remove the request from the list immediately
      setChatRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request', err);
      alert('Failed to reject chat request');
    }
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false); // Close sidebar on mobile when selecting chat
    // Mark as read
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
  };

  const closeChat = (chatId) => {
    setChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      // Save the updated chats to localStorage immediately
      if (user && updatedChats.length > 0) {
        localStorage.setItem(`user_chats_${user.uid}`, JSON.stringify(updatedChats));
      } else if (user) {
        localStorage.removeItem(`user_chats_${user.uid}`);
      }
      return updatedChats;
    });
    if (activeChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !activeChatId) return;

    const activeChat = chats.find(chat => chat.id === activeChatId);
    if (!activeChat) return;

    try {
      await sendMessage(activeChat.roomId, {
        uid: user.uid,
        displayName: userProfile?.username || user.email || user.uid,
        text: text.trim(),
        photoURL: user.photoURL || null,
      });
      setText('');
    } catch (err) {
      console.error('Send failed', err);
      alert('Message send failed');
    }
  };

  const sendPlay = async () => {
    if (!activeChatId) return;
    const activeChat = chats.find(chat => chat.id === activeChatId);
    try {
      await sendControl(activeChat.roomId, { uid: user.uid, displayName: userProfile?.username || user.email || user.uid, control: { action: 'play' } });
    } catch (e) {
      console.error('sendPlay failed', e);
    }
  };

  const sendPause = async () => {
    if (!activeChatId) return;
    const activeChat = chats.find(chat => chat.id === activeChatId);
    try {
      await sendControl(activeChat.roomId, { uid: user.uid, displayName: userProfile?.username || user.email || user.uid, control: { action: 'pause' } });
    } catch (e) {
      console.error('sendPause failed', e);
    }
  };

  const sendSeek = async (position) => {
    if (!activeChatId) return;
    const activeChat = chats.find(chat => chat.id === activeChatId);
    try {
      await sendControl(activeChat.roomId, { uid: user.uid, displayName: userProfile?.username || user.email || user.uid, control: { action: 'seek', position } });
    } catch (e) {
      console.error('sendSeek failed', e);
    }
  };

  if (!user) {
    return <div className="p-6 text-white">Please login to join the chat.</div>;
  }

  const activeChat = chats.find(chat => chat.id === activeChatId);

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-900 text-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-[12%] md:hidden fixed top-[9%] right-1 z-50 bg-gray-800 p-2 rounded-full border border-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Left Sidebar - Chat List */}
      <div className={` w-80 bg-gray-800 border-r border-gray-700 flex flex-col fixed md:relative inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-3 md:p-4 border-b border-gray-700">
          <div className="flex items-center justify-between ">
            <h2 className="text-base md:text-lg font-semibold">Private Chats</h2>
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="px-3 py-1 mt-3 rounded text-sm relative w-[30%]"
            >
              Requests
              {chatRequests.filter(r => r.status === 'pending' && r.toUid === user.uid).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full px-1">
                  {chatRequests.filter(r => r.status === 'pending' && r.toUid === user.uid).length}
                </span>
              )}
            </button>
          </div>

          {showRequests && (
            <div className="mb-3 p-2 bg-gray-700 rounded">
              <h3 className="text-sm font-medium mb-2">Chat Requests</h3>
              {chatRequests.filter(r => r.toUid === user.uid && r.status === 'pending').length === 0 ? (
                <div className="text-xs text-gray-400">No pending requests</div>
              ) : (
                chatRequests.filter(r => r.toUid === user.uid && r.status === 'pending').map((request) => (
                  <div key={request.id} className="flex items-center justify-between mb-2 p-2 bg-gray-600 rounded">
                    <div className="text-xs">
                      <div className="font-medium">{request.fromDisplayName}</div>
                      <div className="text-gray-400">Wants to chat</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 px-2 py-1 rounded text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="bg-red-600 px-2 py-1 rounded text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newPartnerId}
              onChange={(e) => setNewPartnerId(e.target.value)}
              className="flex-1 p-2 bg-gray-700 rounded text-sm"
              placeholder="Enter user ID"
              onKeyPress={(e) => e.key === 'Enter' && startNewChat()}
            />
            <button onClick={startNewChat} className="bg-indigo-600 px-3 py-2 rounded text-sm w-full sm:w-[20%]">Start</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">No chats yet. Start a conversation!</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${activeChatId === chat.id ? 'bg-gray-700 border-l-4 border-indigo-500' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{chat.partnerDisplayName || chat.partnerId}</div>
                    {chat.lastMessage && (
                      <div className="text-xs text-gray-400 truncate mt-1">
                        {chat.lastMessage.text || '[Control message]'}
                      </div>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="bg-indigo-600 text-xs rounded-full px-2 py-1 ml-2">
                      {chat.unreadCount}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChat(chat.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-700 hover:bg-red-400 rounded-full relative group"
                  >
                    <span className="group-hover:hidden ">{chat.partnerDisplayName || chat.partnerId}</span>
                    <span className="hidden group-hover:inline text-red-700">delete this chat</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        {activeChat ? (
          <>
            <div className="p-3 md:p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-base md:text-lg font-semibold truncate">Chat with <i><u>{activeChat.partnerDisplayName || activeChat.partnerId}</u></i></h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-900">
              {activeChat.messages.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No messages yet. Say hi! 👋</div>
              ) : (
                activeChat.messages.map((m, index) => (
                  <div key={index} className={`mb-3 ${m.uid === user.uid ? 'text-right' : 'text-left'}`} >
                    <div className="text-xs text-gray-400 mb-1 truncate">{m.displayName || m.uid}</div>
                    {m.type === 'control' ? (
                      <div className="text-sm italic text-yellow-300 inline-block px-3 py-2 bg-gray-800 rounded max-w-xs break-words">
                        [Control] {JSON.stringify(m.meta)}
                      </div>
                    ) : (
                      <div className={`inline-block px-3 py-2 rounded max-w-xs md:max-w-sm break-words ${m.uid === user.uid ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-100'
                        }`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 md:p-4 border-t border-gray-700 bg-gray-800 z-10 mb-5 rounded-[20px]">
              <div className="flex flex-col gap-2">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    className="flex-1 p-2 bg-gray-700 rounded text-sm"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button className="w-[20%] md:w-[10%] bg-blue-600 px-3 py-2 rounded text-white text-sm whitespace-nowrap">Send</button>
                </form>

                 <div className="flex gap-2 justify-center">
                  <button onClick={sendPlay} className="w-[20%] md:w-[10%] bg-green-500 px-3 py-2 rounded text-sm">Play</button>
                  <button onClick={sendPause} className="w-[20%] md:w-[10%] bg-yellow-500 px-3 py-2 rounded text-sm">Pause</button>
                  <button onClick={() => { const pos = Number(prompt('Seek to seconds:')); if (!Number.isNaN(pos)) sendSeek(pos); }} className="bg-indigo-500 px-3 py-2 rounded text-sm w-[20%] md:w-[10%]">Seek</button>
                </div> 
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-gray-400 text-center p-4">
              <div className="text-3xl md:text-4xl mb-4">💬</div>
              <div className="text-sm md:text-base">Select a chat or start a new conversation</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
