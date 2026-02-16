import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '../../services/api';

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 24 * 60 * 60 * 1000) return d.toLocaleDateString('en-PK', { weekday: 'short' });
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
};

const VendorMessages = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
    });
    newSocket.on('connect', () => console.log('Socket connected'));
    newSocket.on('new-message', (message) => {
      if (message.conversation === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join-conversation', selectedConversation._id);
      return () => socket.emit('leave-conversation', selectedConversation._id);
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    messageInputRef.current?.focus();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);
    try {
      if (socket?.connected) {
        socket.emit('send-message', { conversationId: selectedConversation._id, content: newMessage.trim() });
      } else {
        await api.post(`/conversations/${selectedConversation._id}/messages`, { content: newMessage.trim() });
        fetchMessages(selectedConversation._id);
      }
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find((p) => p._id !== user?._id);
  };

  const getDisplayName = (participant) => {
    if (!participant) return 'Unknown';
    if (participant.profile?.firstName) return `${participant.profile.firstName} ${participant.profile.lastName || ''}`.trim();
    return participant.email || 'Unknown';
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount?.get?.(user?._id) || conversation.unreadCount?.[user?._id] || 0;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Customer Messages</h1>
        <p className="text-gray-500">Chat with your customers</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-r">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">Conversations ({conversations.length})</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  const unread = getUnreadCount(conversation);
                  const isSelected = selectedConversation?._id === conversation._id;
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left ${isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary-600">
                          {getDisplayName(other)?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {getDisplayName(other)}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-sm truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                            {conversation.lastMessage?.content || 'No messages'}
                          </p>
                          {unread > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">{unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="hidden md:flex flex-col flex-1">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">
                      {getDisplayName(getOtherParticipant(selectedConversation))?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {getDisplayName(getOtherParticipant(selectedConversation))}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((message) => {
                    const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
                    return (
                      <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'}`}>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-primary-500 text-white rounded-lg px-5 py-2 font-semibold hover:bg-primary-600 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a customer to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMessages;
