import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Send, FileImage, ShieldCheck, Smile, X, ArrowDown, Trash2, Reply } from 'lucide-react';
import { getSocket, disconnectSocket } from '../services/socket';
import EmojiPicker from 'emoji-picker-react';

const getAvatarColor = (name) => {
    const defaultName = name || 'User';
    const colors = ['#DDE7FF', '#E4D9FF', '#D8F3E4', '#FFE2D2', '#FFF0B8', '#D9F0F5', '#F1D9E8'];
    let hash = 0;
    for (let i = 0; i < defaultName.length; i++) {
        hash = defaultName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const Messages = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [remoteTyping, setRemoteTyping] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [newMessagesCount, setNewMessagesCount] = useState(0);

    // Lightbox & Delete & Reply UX
    const [lightboxImage, setLightboxImage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
    const [confirmDeleteMsg, setConfirmDeleteMsg] = useState(null);

    const token = localStorage.getItem('lumina_token');
    const myId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiContainerRef = useRef(null);
    let typingTimeout = useRef(null);

    const activeChatRef = useRef(activeChat);
    const isAtBottomRef = useRef(true);
    const messageRefs = useRef({});

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Handle Emoji Picker Outside Click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiContainerRef.current && !emojiContainerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
            setNewMessagesCount(0);
        }
    };

    const scrollToMessage = (msgId) => {
        const el = messageRefs.current[msgId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        isAtBottomRef.current = atBottom;
        if (atBottom) {
            setNewMessagesCount(0);
        }
    };

    const getOtherParticipant = (participants) => {
        if (!participants || !myId) return null;
        return participants.find(p => p._id && p._id.toString() !== myId.toString()) || participants[0];
    };

    const getSafeName = (user) => {
        if (typeof user?.name === 'string') return user.name;
        return 'UNKNOWN USER';
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const socket = getSocket(token);

        const loadConversations = async () => {
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const preselectId = searchParams.get('conversationId');
                setConversations(data.data);

                if (preselectId) {
                    const match = data.data.find(c => c._id === preselectId);
                    if (match) {
                        setActiveChat(match);
                    } else {
                        // If we are looking for a chat but can't find it locally (maybe not in top 20 or delayed),
                        // try to fetch it directly or at least clear current to avoid showing old chat.
                        if (activeChatRef.current && activeChatRef.current._id !== preselectId) {
                            setActiveChat(null);
                        }
                    }
                } else {
                    setActiveChat(null);
                }
            }
        };
        loadConversations();

        const handleNewMessage = (msg) => {
            socket.emit('message_delivered', { messageId: msg._id, conversationId: msg.conversation, senderId: msg.sender });

            if (activeChatRef.current && msg.conversation === activeChatRef.current._id) {
                setMessages(prev => [...prev, msg]);
                socket.emit('message_read', { conversationId: msg.conversation, senderId: msg.sender });

                setTimeout(() => {
                    if (isAtBottomRef.current) {
                        scrollToBottom();
                    } else {
                        setNewMessagesCount(prev => prev + 1);
                    }
                }, 50);
            } else {
                setConversations(prev => {
                    return prev.map(c => {
                        if (c._id === msg.conversation) {
                            return {
                                ...c,
                                lastMessage: msg.type === 'image' ? '[IMAGE]' : msg.text,
                                lastMessageAt: new Date(),
                                unreadCounts: { ...c.unreadCounts, [myId]: (c.unreadCounts?.[myId] || 0) + 1 }
                            };
                        }
                        return c;
                    }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                });
            }
        };

        const handleMessageSent = (msg) => {
            setMessages(prev => {
                let replaced = false;
                return prev.map(m => {
                    if (m.optimistic && !replaced && (m.text === msg.text || m.imageUrl === msg.imageUrl)) {
                        replaced = true;
                        return { ...msg };
                    }
                    return m;
                });
            });
            setTimeout(() => scrollToBottom(), 50);
        };

        const handleConversationUpdated = (updatedConvo) => {
            setConversations(prev => {
                const map = prev.map(c => {
                    if (c._id === updatedConvo._id) {
                        // Only use incoming participants if they are populated objects with names
                        const hasPopulatedParticipants = Array.isArray(updatedConvo.participants)
                            && updatedConvo.participants.length > 0
                            && typeof updatedConvo.participants[0] === 'object'
                            && updatedConvo.participants[0].name;
                        return {
                            ...c,
                            ...updatedConvo,
                            participants: hasPopulatedParticipants ? updatedConvo.participants : c.participants
                        };
                    }
                    return c;
                });
                if (!prev.find(c => c._id === updatedConvo._id)) map.push(updatedConvo);
                return map.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
            });

            if (activeChatRef.current && updatedConvo._id === activeChatRef.current._id) {
                setActiveChat(prev => ({ ...prev, unreadCounts: { ...prev.unreadCounts, [myId]: 0 } }));
            }
        };

        const handleMessageStatus = ({ messageId, conversationId, status }) => {
            if (activeChatRef.current && activeChatRef.current._id === conversationId) {
                setMessages(prev => prev.map(m => {
                    if (status === 'read' && m.status !== 'read') return { ...m, status: 'read', read: true };
                    if (messageId && m._id === messageId) return { ...m, status };
                    return m;
                }));
            }
        };

        const handleMessageDeleted = ({ messageId, conversationId }) => {
            if (activeChatRef.current && activeChatRef.current._id === conversationId) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, deletedForEveryone: true, text: '', imageUrl: '' } : m
                ));
            }
        };

        const handleTypingStart = ({ senderId, conversationId }) => {
            setRemoteTyping(prev => ({ ...prev, [conversationId]: true }));
        };

        const handleTypingStop = ({ senderId, conversationId }) => {
            setRemoteTyping(prev => ({ ...prev, [conversationId]: false }));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_sent', handleMessageSent);
        socket.on('conversation_updated', handleConversationUpdated);
        socket.on('message_status_updated', handleMessageStatus);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_sent', handleMessageSent);
            socket.off('conversation_updated', handleConversationUpdated);
            socket.off('message_status_updated', handleMessageStatus);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
        };
    }, [token, searchParams]);

    // Rely strictly on ID scalar preventing catastrophic state invalidation on read-receipts
    const activeChatId = activeChat?._id;
    useEffect(() => {
        if (!activeChatId || !token) return;

        const fetchHistory = async () => {
            setMessages([]); // Immediately clear old messages when switching chats
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${activeChatId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);

                const socket = getSocket();
                if (socket) {
                    const otherUserId = getOtherParticipant(activeChatRef.current?.participants)?._id;
                    if (otherUserId) {
                        socket.emit('message_read', { conversationId: activeChatId, senderId: otherUserId });
                    }
                }

                isAtBottomRef.current = true;
                setNewMessagesCount(0);
                setTimeout(() => scrollToBottom(), 100);
            }
        };
        fetchHistory();
        setReplyingTo(null);
    }, [activeChatId, token]);

    const handleInput = (e) => {
        setText(e.target.value);
        const socket = getSocket();
        if (!socket || !activeChat) return;

        const otherUserId = getOtherParticipant(activeChat.participants)?._id;
        if (!otherUserId) return;

        socket.emit('typing_start', { receiverId: otherUserId, conversationId: activeChat._id });

        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('typing_stop', { receiverId: otherUserId, conversationId: activeChat._id });
        }, 1500);
    };

    const handleSendMessage = (e) => {
        e?.preventDefault();
        const socket = getSocket();
        if ((!text.trim() && !imagePreview) || !activeChat || !socket) return;

        const receiver = getOtherParticipant(activeChat.participants);
        if (!receiver) return;

        const msgPayload = {
            conversationId: activeChat._id,
            receiverId: receiver._id,
            type: imagePreview ? 'image' : 'text',
            text: text.trim(),
            imageUrl: imagePreview || '',
            replyTo: replyingTo ? replyingTo._id : null,
            productId: activeChat.product?._id || (typeof activeChat.product === 'string' ? activeChat.product : null),
            productName: activeChat.product?.title || 'GENERAL'
        };

        socket.emit('send_message', msgPayload);

        setMessages(prev => [...prev, {
            _id: Date.now() + Math.random().toString(),
            conversation: activeChat._id,
            sender: myId,
            receiver: receiver._id,
            type: msgPayload.type,
            text: msgPayload.text,
            imageUrl: msgPayload.imageUrl,
            replyTo: replyingTo || null,
            createdAt: new Date(),
            status: 'sending',
            optimistic: true
        }]);

        setText('');
        setImagePreview(null);
        setShowEmojiPicker(false);
        setReplyingTo(null);
        setTimeout(() => scrollToBottom(), 50);
    };

    const handleDeleteConversation = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/conversations/${activeChat._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setConversations(prev => prev.filter(c => c._id !== activeChat._id));
                setActiveChat(null);
                setMessages([]);
                setConfirmDeleteChat(false);
            } else {
                console.error("Delete Chat Rejection:", data.error);
                alert("We couldn't delete the conversation. Please try again.");
            }
        } catch (e) {
            console.error("Delete Chat Exception:", e);
            alert("Unable to connect to the server. Please try again.");
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessages(prev => prev.map(m =>
                m._id === msgId ? { ...m, deletedForEveryone: true, text: '', imageUrl: '' } : m
            ));
            setConfirmDeleteMsg(null);

            const socket = getSocket();
            const receiver = getOtherParticipant(activeChat.participants);
            if (socket && receiver) {
                socket.emit('delete_message', { messageId: msgId, conversationId: activeChat._id, receiverId: receiver._id });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return alert("Please choose an image under 5 MB.");
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const renderStatus = (msg) => {
        if (msg.optimistic) return 'SENDING...';
        if (msg.status === 'read' || msg.read) return '✓✓';
        if (msg.status === 'delivered') return '✓✓';
        return '✓';
    };

    return (
        <>
            {/* --- SHARED OVERLAYS --- */}
            {lightboxImage && (
                <div className="fixed inset-0 z-[110] bg-[#17172A]/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxImage(null)}>
                    <div className="absolute top-4 right-4 text-white hover:text-error transition-colors">
                        <X className="w-8 h-8" />
                    </div>
                    <img src={lightboxImage} className="max-w-full max-h-full object-contain cursor-default" onClick={e => e.stopPropagation()} />
                </div>
            )}

            {confirmDeleteChat && (
                <div className="fixed inset-0 z-[110] bg-[#17172A]/80 flex items-center justify-center p-4" onClick={() => setConfirmDeleteChat(false)}>
                    <div className="bg-white border-2 border-[#17172A] p-8 shadow-[8px_8px_0_#17172A] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-xl uppercase mb-2 text-error tracking-tight">DELETE CHAT?</h2>
                        <p className="text-sm font-bold text-[#1b1b24] mb-8">This chat will be deleted from your side only.</p>
                        <div className="flex space-x-4">
                            <button onClick={() => setConfirmDeleteChat(false)} className="flex-1 p-3 border-2 border-[#17172A] text-sm font-bold uppercase hover:bg-[#f5f2ff] transition-colors shadow-[4px_4px_0_#17172A] active:translate-y-1 active:translate-x-1 active:shadow-none">CANCEL</button>
                            <button onClick={handleDeleteConversation} className="flex-1 p-3 border-2 border-[#17172A] bg-error text-white text-sm font-bold uppercase hover:bg-red-800 transition-colors shadow-[4px_4px_0_#17172A] active:translate-y-1 active:translate-x-1 active:shadow-none">DELETE</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DESKTOP LAYOUT --- */}
            <div className="hidden md:flex min-h-screen py-8 font-mono bg-[#fcf8ff] text-[#1b1b24] relative flex-col">
                <div className="absolute inset-0 pointer-events-none opacity-5 z-0" style={{ backgroundImage: 'radial-gradient(#17172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[80vh] flex flex-row gap-[24px] relative z-10 w-full">
                    {/* Sidebar */}
                    <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white border border-[#17172A] flex-col overflow-hidden`}>
                        <div className="p-6 border-b border-[#17172A]">
                            <h1 className="text-2xl font-bold uppercase mb-4 tracking-tight">Messages<span className="text-[#250fc2]">_</span></h1>
                            <div className="relative flex items-center border border-[#17172A] bg-white group hover:border-[#250fc2] transition-colors">
                                <span className="pl-4 text-[#17172A] font-bold">{">"}</span>
                                <input type="text" placeholder="SEARCH_CHATS..." className="w-full bg-transparent pl-2 pr-4 py-2.5 text-[#1b1b24] placeholder:text-[#1b1b24]/50 focus:outline-none uppercase text-xs font-bold tracking-widest" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-75">
                                    <h3 className="font-bold text-lg uppercase tracking-tight mb-3 text-[#1b1b24]">NO CHATS YET.</h3>
                                    <p className="text-sm font-bold mb-2 text-[#464555]">Your inbox is looking kinda empty 👀</p>
                                    <button onClick={() => navigate('/')} className="text-[11px] text-[#250fc2] font-bold uppercase tracking-widest hover:underline hover:text-[#1b1b24] transition-colors mt-1">Find someone and start a convo.</button>
                                </div>
                            )}
                            {conversations.map(chat => {
                                const otherUser = getOtherParticipant(chat.participants);
                                const safeName = getSafeName(otherUser);
                                const unread = chat.unreadCounts?.[myId] || 0;
                                const isActive = activeChat?._id === chat._id;

                                return (
                                    <div key={chat._id} onClick={() => setActiveChat(chat)} className={`p-4 border-b border-[#17172A] cursor-pointer transition-all duration-200 flex items-center space-x-4 ${isActive ? 'bg-[#250fc2] text-white' : 'hover:bg-[#f5f2ff] bg-white text-[#1b1b24]'}`}>
                                        <img src={`https://ui-avatars.com/api/?name=${safeName.replace(/\s+/g, '+')}&background=random&color=fff`} className={`w-12 h-12 border ${isActive ? 'border-white' : 'border-[#17172A]'}`} />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-sm tracking-tight truncate uppercase">{safeName}</h4>
                                            </div>
                                            <p className={`text-xs font-bold truncate mb-0.5 uppercase ${isActive ? 'text-[#c5c3ff]' : 'text-[#250fc2]'}`}>[ {chat.product?.title || 'GENERAL'} ]</p>
                                            <p className={`text-sm truncate ${isActive ? 'text-white' : (unread ? 'text-[#1b1b24] font-bold' : 'text-[#464555]')}`}>{chat.lastMessage || '...'}</p>
                                        </div>
                                        {unread > 0 && <div className={`w-6 h-6 border ${isActive ? 'border-white bg-white text-[#250fc2]' : 'border-[#17172A] bg-[#250fc2] text-white'} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>+{unread}</div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 bg-white border border-[#17172A] flex-col overflow-hidden shadow-[4px_4px_0_#17172A] relative`}>
                        {!activeChat ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fcf8ff]">
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#17172A 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                                <h2 className="font-bold text-2xl uppercase tracking-tight text-[#17172A] mb-4 relative z-10">NO ACTIVE CHAT</h2>
                                <p className="text-sm font-bold text-[#464555] relative z-10">Pick someone from your conversations<br />to start messaging.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-[#17172A] flex items-center justify-between bg-white z-10 relative">
                                    <div className="flex items-center space-x-4">
                                        <button onClick={() => setActiveChat(null)} className="md:hidden border border-[#17172A] p-2 hover:bg-[#17172A] hover:text-white">&lt;</button>

                                        {(() => {
                                            const otherUser = getOtherParticipant(activeChat.participants);
                                            const safeName = getSafeName(otherUser);
                                            return (
                                                <>
                                                    <img src={`https://ui-avatars.com/api/?name=${safeName.replace(/\s+/g, '+')}&background=random&color=fff`} className="w-12 h-12 border border-[#17172A]" />
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-bold text-lg uppercase tracking-tight">{safeName}</h4>
                                                            <ShieldCheck className="w-4 h-4 text-[#250fc2]" />
                                                        </div>
                                                        <p className="text-[11px] text-[#250fc2] font-bold uppercase tracking-widest mt-1">
                                                            {remoteTyping[activeChat._id] ? 'TYPING...' : 'THREAD ACTIVE'}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center space-x-2 relative">
                                        {activeChat.product && (
                                            <button onClick={() => navigate(`/product/${activeChat.product._id}`)} className="px-4 py-2 border border-[#17172A] text-[#1b1b24] font-bold text-xs uppercase tracking-widest hover:bg-[#250fc2] hover:text-white hover:border-[#250fc2] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_#17172A] transition-all hidden sm:block">
                                                VIEW_LISTING
                                            </button>
                                        )}
                                        <button onClick={() => setConfirmDeleteChat(true)} className="p-2 border border-[#17172A] text-[#1b1b24] hover:bg-error hover:text-white hover:border-error transition-colors shadow-[2px_2px_0_#17172A] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none" title="Delete Chat">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div
                                    className="flex-1 p-6 overflow-y-auto bg-[#fcf8ff] flex flex-col space-y-6 relative group/area"
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                >
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#17172A 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

                                    {messages.map((msg, i) => {
                                        const prevMsg = i > 0 ? messages[i - 1] : null;
                                        const hasProductContext = msg.productId || msg.productName;
                                        const contextChanged = !prevMsg || prevMsg.productId !== msg.productId;

                                        return (
                                            <React.Fragment key={msg._id || i}>
                                                {hasProductContext && contextChanged && (
                                                    <div className="text-center w-full relative z-10 mt-4 mb-2 flex justify-center">
                                                        <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-[#1b1b24] bg-white border border-[#17172A] px-3 py-1.5 shadow-[2px_2px_0px_#17172A] flex items-center gap-2 cursor-pointer hover:bg-[#1b1b24] hover:text-white transition-colors"
                                                            onClick={() => msg.productId && navigate(`/product/${msg.productId}`)}>
                                                            <span className="material-symbols-outlined text-[14px]">local_mall</span>
                                                            [ {msg.productName || 'PRODUCT'} ]
                                                        </span>
                                                    </div>
                                                )}
                                                {msg.sender === myId ? (
                                                    <div className="flex items-end justify-end space-x-4 relative z-10 w-full group/msg" ref={el => messageRefs.current[msg._id] = el}>
                                                        <div className="flex flex-col items-end opacity-0 group-hover/msg:opacity-100 transition-opacity space-y-1 pb-4 pr-2">
                                                            {!msg.deletedForEveryone && (
                                                                <>
                                                                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 border border-[#17172A] bg-white text-[#1b1b24] hover:bg-[#250fc2] hover:text-white" title="Reply"><Reply className="w-3 h-3" /></button>
                                                                    <div className="relative">
                                                                        <button onClick={() => setConfirmDeleteMsg(confirmDeleteMsg === msg._id ? null : msg._id)} className="p-1.5 border border-[#17172A] bg-white text-[#1b1b24] hover:bg-error hover:text-white" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                                                        {confirmDeleteMsg === msg._id && (
                                                                            <div className="absolute right-8 top-0 bg-white border border-[#17172A] p-3 shadow-hard z-50 w-48 text-center flex-col space-y-2">
                                                                                <p className="font-bold text-[10px] uppercase text-error">DELETE FOR EVERYONE?</p>
                                                                                <div className="flex space-x-2">
                                                                                    <button onClick={() => setConfirmDeleteMsg(null)} className="flex-1 p-1 border border-[#17172A] text-[9px] font-bold uppercase hover:bg-[#f5f2ff]">CANCEL</button>
                                                                                    <button onClick={() => handleDeleteMessage(msg._id)} className="flex-1 p-1 border border-[#17172A] bg-error text-white text-[9px] font-bold uppercase hover:bg-red-800">DELETE</button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="bg-[#250fc2] border border-[#17172A] text-white p-4 max-w-[85%] sm:max-w-[70%] shadow-hard cursor-pointer" onClick={() => scrollToMessage(msg._id)}>
                                                            {msg.replyTo && (
                                                                <div className="text-[11px] bg-[#1a0a8f] border-l-2 border-white p-2 mb-2 opacity-90 truncate max-w-full cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo._id); }}>
                                                                    <b>{msg.replyTo.sender === myId ? 'You' : getSafeName(getOtherParticipant(activeChat.participants))}</b><br />
                                                                    {msg.replyTo.deletedForEveryone ? <i className="opacity-75">This message was deleted</i> : (msg.replyTo.imageUrl ? '[ IMAGE ]' : msg.replyTo.text)}
                                                                </div>
                                                            )}
                                                            {msg.deletedForEveryone ? (
                                                                <p className="text-sm italic opacity-75">This message was deleted.</p>
                                                            ) : (
                                                                <>
                                                                    {msg.type === 'image' && <img src={msg.imageUrl} onLoad={() => { if (isAtBottomRef.current || msg.sender === myId) scrollToBottom(); }} onClick={(e) => { e.stopPropagation(); setLightboxImage(msg.imageUrl); }} className="mb-2 max-h-64 border border-[#17172A] bg-white object-contain cursor-pointer hover:opacity-90" alt="attachment" />}
                                                                    {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                                                </>
                                                            )}
                                                            <div className="flex justify-between items-center mt-3 text-[11px] text-[#c5c3ff] font-bold">
                                                                <span>{msg.optimistic ? 'SENDING...' : new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                                                                <span className="ml-4 tabular-nums w-4 whitespace-nowrap">{renderStatus(msg)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={msg._id || i} className="flex items-end space-x-4 relative z-10 group/msg" ref={el => messageRefs.current[msg._id] = el}>
                                                        <div className="bg-white border border-[#17172A] text-[#1b1b24] p-4 max-w-[85%] sm:max-w-[70%] shadow-hard cursor-pointer" onClick={() => scrollToMessage(msg._id)}>
                                                            {msg.replyTo && (
                                                                <div className="text-[11px] bg-[#f5f2ff] border-l-2 border-[#250fc2] p-2 mb-2 opacity-90 truncate max-w-full cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo._id); }}>
                                                                    <b>{msg.replyTo.sender === myId ? 'You' : getSafeName(getOtherParticipant(activeChat.participants))}</b><br />
                                                                    {msg.replyTo.deletedForEveryone ? <i className="opacity-75">This message was deleted</i> : (msg.replyTo.imageUrl ? '[ IMAGE ]' : msg.replyTo.text)}
                                                                </div>
                                                            )}
                                                            {msg.deletedForEveryone ? (
                                                                <p className="text-sm italic text-outline-variant">This message was deleted.</p>
                                                            ) : (
                                                                <>
                                                                    {msg.type === 'image' && <img src={msg.imageUrl} onLoad={() => { if (isAtBottomRef.current) scrollToBottom(); }} onClick={(e) => { e.stopPropagation(); setLightboxImage(msg.imageUrl); }} className="mb-2 max-h-64 border border-[#17172A] bg-[#f5f2ff] object-contain cursor-pointer hover:opacity-90" alt="attachment" />}
                                                                    {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                                                </>
                                                            )}
                                                            <span className="text-[11px] text-[#777587] font-bold block mt-3 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                                                        </div>

                                                        <div className="flex flex-col items-start opacity-0 group-hover/msg:opacity-100 transition-opacity pb-4 pl-2">
                                                            {!msg.deletedForEveryone && (
                                                                <button onClick={() => setReplyingTo(msg)} className="p-1.5 border border-[#17172A] bg-white text-[#1b1b24] hover:bg-[#250fc2] hover:text-white" title="Reply"><Reply className="w-3 h-3" /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                {/* Floating New Messages Badge */}
                                {newMessagesCount > 0 && (
                                    <div className="absolute bottom-[140px] right-8 z-20">
                                        <button
                                            onClick={scrollToBottom}
                                            className="flex items-center gap-2 bg-[#1b1b24] text-white px-4 py-2 border border-[#17172A] shadow-[4px_4px_0_#17172A] font-bold text-xs tracking-widest hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#17172A] transition-all uppercase"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                            NEW MESSAGES +{newMessagesCount}
                                        </button>
                                    </div>
                                )}

                                {/* Reply Context Preview */}
                                {replyingTo && (
                                    <div className="px-4 py-3 bg-[#f5f2ff] border-t border-[#17172A] flex justify-between items-center relative z-10 w-full">
                                        <div className="flex-1 truncate border-l-[3px] border-[#250fc2] pl-3">
                                            <p className="text-[10px] font-bold text-[#250fc2] uppercase mb-1">REPLYING TO {replyingTo.sender === myId ? 'YOU' : getSafeName(getOtherParticipant(activeChat.participants))}</p>
                                            <p className="text-xs text-[#1b1b24] truncate">{replyingTo.imageUrl ? '[ IMAGE ]' : replyingTo.text}</p>
                                        </div>
                                        <button type="button" onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-error hover:text-white border border-[#17172A] transition-colors ml-4"><X className="w-4 h-4" /></button>
                                    </div>
                                )}

                                {/* Input Form */}
                                <div className="p-4 border-t border-[#17172A] bg-white flex flex-col z-10 relative w-full">
                                    {showEmojiPicker && (
                                        <div ref={emojiContainerRef} className="absolute bottom-full mb-2 left-4 z-50 shadow-hard border border-[#17172A] animate-in slide-in-from-bottom-2 fade-in">
                                            <EmojiPicker onEmojiClick={(e) => { setText(prev => prev + e.emoji); setShowEmojiPicker(false); }} theme="dark" />
                                        </div>
                                    )}

                                    {imagePreview && (
                                        <div className="relative inline-block border border-[#17172A] p-2 bg-[#fcf8ff] mb-4 shadow-hard self-start">
                                            <img src={imagePreview} className="h-20 object-contain" />
                                            <button onClick={() => setImagePreview(null)} className="absolute -top-3 -right-3 bg-error text-white border border-[#17172A] p-1"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}

                                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3 w-full">
                                        <div className="relative">
                                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 border border-[#17172A] bg-white text-[#1b1b24] hover:bg-[#f5f2ff] transition-colors"><Smile className="w-5 h-5" /></button>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 border border-[#17172A] bg-white text-[#1b1b24] hover:bg-[#250fc2] hover:text-white transition-colors"><FileImage className="w-5 h-5" /></button>

                                        <div className="flex-1 flex items-center border border-[#17172A] bg-[#fcf8ff] focus-within:border-[#250fc2] transition-colors relative">
                                            <span className="pl-4 text-[#17172A] font-bold hidden sm:inline">{">"}</span>
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={handleInput}
                                                placeholder="TYPE_MISSION_DATA..."
                                                className="w-full bg-transparent pl-4 sm:pl-2 pr-4 py-3 text-[#1b1b24] focus:outline-none text-sm placeholder:font-bold placeholder:tracking-widest placeholder:text-xs"
                                            />
                                        </div>
                                        <button type="submit" disabled={!text.trim() && !imagePreview} className="p-3 border border-[#17172A] bg-[#250fc2] text-white hover:bg-[#1b1b24] disabled:opacity-50 transition-colors shadow-[4px_4px_0_#17172A] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-1 active:translate-y-1 active:shadow-none">
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MOBILE LAYOUT --- */}
            <div className="md:hidden fixed inset-0 z-[100] bg-[#fcf8ff] text-[#1b1b24] flex flex-col font-mono overflow-hidden w-full h-[100dvh]">
                {/* Top Navigation (Mobile Version) */}
                <header className="shrink-0 bg-[#fcf8ff] flex justify-between items-center w-full px-4 h-16 border-b border-[#17172A] z-[60]">
                    <div className="text-[18px] tracking-tighter uppercase font-bold text-[#1b1b24] flex items-center gap-2">
                        <span className="text-[#250fc2]">&gt;</span> CampusX
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-[#1b1b24] hover:text-[#250fc2] transition-colors" onClick={() => navigate('/search')}>
                            <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>search</span>
                        </button>
                        <button className="text-[#1b1b24] hover:text-[#250fc2] transition-colors relative">
                            <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>more_vert</span>
                        </button>
                    </div>
                </header>

                {!activeChat ? (
                    // {/* Main Content - Message List (Active View) */}
                    <main className="flex-1 bg-white flex flex-col overflow-hidden">
                        {/* Header Section */}
                        <div className="shrink-0 px-4 py-4 border-b border-[#17172A] bg-[#fcf8ff]">
                            <h1 className="text-[24px] font-bold uppercase mb-2 leading-[1.2]">INBOX / MESSAGES</h1>
                            <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.1em] text-[#464555]">
                                <span>TOTAL: {conversations.length < 10 ? '0' + conversations.length : conversations.length}</span>
                                <span className="text-[#17172A]">|</span>
                                <span className="text-[#250fc2] flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#250fc2] rounded-full block"></span>
                                    UNREAD: {
                                        conversations.filter(c => (c.unreadCounts?.[myId] || 0) > 0).length.toString().padStart(2, '0')
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Message List Items */}
                        <div className="flex-1 flex flex-col divide-y divide-[#17172A] overflow-y-auto">
                            {conversations.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center justify-center opacity-75 mt-8">
                                    <h3 className="font-bold text-lg uppercase tracking-tight mb-3 text-[#1b1b24]">NO CHATS YET.</h3>
                                    <p className="text-sm font-bold mb-2 text-[#464555]">Your inbox is looking kinda empty 👀</p>
                                    <button onClick={() => navigate('/')} className="text-[11px] text-[#250fc2] font-bold uppercase tracking-widest hover:underline hover:text-[#1b1b24] transition-colors mt-1">Start a convo</button>
                                </div>
                            )}

                            {conversations.map(chat => {
                                const otherUser = getOtherParticipant(chat.participants);
                                const safeName = getSafeName(otherUser);
                                const unread = chat.unreadCounts?.[myId] || 0;

                                return (
                                    <button
                                        key={chat._id}
                                        onClick={() => setActiveChat(chat)}
                                        className={`w-full text-left p-4 ${unread > 0 ? 'bg-[#efecf9] hover:bg-[#eae6f3]' : 'bg-[#fcf8ff] hover:bg-white'} transition-colors flex items-start gap-3 relative group shadow-[4px_4px_0_0_#17172A]`}
                                    >
                                        <div
                                            className={`w-10 h-10 ${unread > 0 ? 'bg-[#250fc2] text-white' : 'text-[#1b1b24]'} flex-shrink-0 border border-[#17172A] flex items-center justify-center text-[18px] font-bold`}
                                            style={unread > 0 ? {} : { backgroundColor: getAvatarColor(safeName) }}
                                        >
                                            {safeName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`text-[12px] font-bold truncate uppercase tracking-[0.1em] ${unread > 0 ? 'text-[#250fc2]' : 'text-[#1b1b24]'}`}>
                                                    {safeName}
                                                </h3>
                                                <span className={`text-[11px] ${unread > 0 ? 'text-[#250fc2] font-bold' : 'text-[#464555]'}`}>
                                                    {new Date(chat.lastMessageAt || Date.now()).toLocaleTimeString([], { timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-[#464555] uppercase mb-1 truncate">
                                                REF: {chat.product?.title || 'GENERAL'}
                                            </div>
                                            <p className={`text-[14px] truncate ${unread > 0 ? 'text-[#1b1b24] font-bold' : 'text-[#464555]'}`}>
                                                {chat.lastMessage || '...'}
                                            </p>
                                        </div>
                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 ${unread > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity text-[#250fc2]`}>
                                            {unread > 0 && <div className="w-6 h-6 border border-[#17172A] bg-[#250fc2] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">+{unread}</div>}
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>chevron_right</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </main>
                ) : (
                    // {/* Secondary Content - Active Chat View */}
                    <main className="flex-1 bg-white flex flex-col overflow-hidden relative">
                        {/* Chat Header */}
                        <div className="shrink-0 px-4 py-3 border-b border-[#17172A] bg-[#fcf8ff] flex items-center gap-4 z-40">
                            <button className="text-[#1b1b24] hover:text-[#250fc2] transition-colors bg-white shrink-0" onClick={() => setActiveChat(null)}>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
                            </button>
                            <div className="w-8 h-8 flex-shrink-0 border border-[#17172A] flex items-center justify-center text-[14px] font-bold text-[#1b1b24]" style={{ backgroundColor: getAvatarColor(getSafeName(getOtherParticipant(activeChat.participants))) }}>
                                {getSafeName(getOtherParticipant(activeChat.participants)).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[12px] font-bold truncate tracking-[0.1em] uppercase">{getSafeName(getOtherParticipant(activeChat.participants))}</h2>
                                <div className="text-[11px] text-[#464555] uppercase truncate flex items-center gap-1">
                                    {remoteTyping[activeChat._id] ? (
                                        <><span className="w-1.5 h-1.5 bg-[#250fc2] rounded-full block border border-black animate-pulse"></span> TYPING...</>
                                    ) : (
                                        <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full block border border-black"></span> ONLINE</>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setConfirmDeleteChat(true)} className="text-[#464555] hover:text-error transition-colors shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Product Context Banner */}
                        {activeChat.product && (
                            <div className="shrink-0 px-4 py-2 bg-[#f5f2ff] border-b border-[#17172A] flex justify-between items-center text-[11px] uppercase z-30" onClick={() => navigate(`/product/${activeChat.product._id}`)}>
                                <span className="truncate text-[#1b1b24] font-bold">REF: {activeChat.product.title}</span>
                                <span className="material-symbols-outlined text-[#250fc2] shrink-0" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>open_in_new</span>
                            </div>
                        )}

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto w-full p-4 flex flex-col gap-4 relative z-10" ref={scrollContainerRef} onScroll={handleScroll}>
                            {/* System Message */}
                            <div className="text-center mt-2 mb-2">
                                <p className="text-[11px] text-[#464555] bg-[#fcf8ff] inline-block px-2 border border-dashed border-[#17172A]">
                                    [SYSTEM]: CHAT_INITIATED
                                </p>
                            </div>

                            {messages.map((msg, i) => (
                                msg.sender === myId ? (
                                    // My message (Mobile)
                                    <div key={msg._id || i} className="flex flex-col items-end max-w-[85%] self-end">
                                        <div className="flex items-center gap-2 mb-1 relative">
                                            {!msg.deletedForEveryone && (
                                                <div className="flex space-x-1 border border-[#17172A] bg-white px-1">
                                                    <button onClick={() => setReplyingTo(msg)} className="text-[#464555] p-0.5 hover:text-[#250fc2]"><Reply className="w-3 h-3" /></button>
                                                    <button onClick={() => setConfirmDeleteMsg(confirmDeleteMsg === msg._id ? null : msg._id)} className="text-[#464555] p-0.5 hover:text-error"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                            {confirmDeleteMsg === msg._id && (
                                                <div className="absolute top-0 right-full mr-2 bg-white border border-[#17172A] p-3 shadow-[2px_2px_0_#17172A] z-[70] w-48 text-center flex-col space-y-2">
                                                    <p className="font-bold text-[10px] uppercase text-error">DELETE FOR EVERYONE?</p>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => setConfirmDeleteMsg(null)} className="flex-1 p-1 border border-[#17172A] text-[9px] font-bold uppercase bg-white hover:bg-[#f5f2ff]">CANCEL</button>
                                                        <button onClick={() => handleDeleteMessage(msg._id)} className="flex-1 p-1 border border-[#17172A] bg-error text-white text-[9px] font-bold uppercase hover:bg-red-800">DELETE</button>
                                                    </div>
                                                </div>
                                            )}
                                            <span className="text-[11px] text-[#464555] uppercase font-bold">YOU [{new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}]</span>
                                        </div>
                                        <div className="bg-[#250fc2] border border-[#17172A] p-3 text-[14px] text-white shadow-[4px_4px_0_#17172A]">
                                            {msg.replyTo && (
                                                <div className="text-[11px] bg-[#1a0a8f] border-l-2 border-white p-2 mb-2 truncate max-w-full italic overflow-hidden">
                                                    <b className="uppercase">{msg.replyTo.sender === myId ? 'You' : getSafeName(getOtherParticipant(activeChat.participants))}</b><br />
                                                    {msg.replyTo.deletedForEveryone ? <span className="opacity-75">Message deleted</span> : (msg.replyTo.imageUrl ? '[ IMAGE ]' : msg.replyTo.text)}
                                                </div>
                                            )}
                                            {msg.deletedForEveryone ? (
                                                <p className="italic text-[#c7c4d8] opacity-75">This message was deleted.</p>
                                            ) : (
                                                <>
                                                    {msg.type === 'image' && <img src={msg.imageUrl} onClick={() => setLightboxImage(msg.imageUrl)} className="mb-2 max-h-48 border border-[#17172A] bg-white object-contain cursor-pointer" alt="attachment" />}
                                                    {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}
                                                </>
                                            )}
                                            <div className="flex justify-end mt-1">
                                                <span className="text-[10px] font-bold text-white opacity-90">{renderStatus(msg)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Incoming message (Mobile)
                                    <div key={msg._id || i} className="flex flex-col items-start max-w-[85%] self-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] text-[#464555] uppercase font-bold">{getSafeName(getOtherParticipant(activeChat.participants))} [{new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}]</span>
                                            {!msg.deletedForEveryone && (
                                                <div className="flex space-x-1 border border-[#17172A] bg-white px-1">
                                                    <button onClick={() => setReplyingTo(msg)} className="text-[#464555] p-0.5 hover:text-[#250fc2]"><Reply className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-[#efecf9] border border-[#d1ccf0] p-3 text-[14px] text-[#1b1b24] shadow-[4px_4px_0_#17172A]">
                                            {msg.replyTo && (
                                                <div className="text-[11px] bg-[#fcf8ff] border-l-2 border-[#1b1b24] p-2 mb-2 truncate max-w-full italic overflow-hidden">
                                                    <b className="uppercase">{msg.replyTo.sender === myId ? 'You' : getSafeName(getOtherParticipant(activeChat.participants))}</b><br />
                                                    {msg.replyTo.deletedForEveryone ? <span className="opacity-75">Message deleted</span> : (msg.replyTo.imageUrl ? '[ IMAGE ]' : msg.replyTo.text)}
                                                </div>
                                            )}
                                            {msg.deletedForEveryone ? (
                                                <p className="italic text-[#c7c4d8]">This message was deleted.</p>
                                            ) : (
                                                <>
                                                    {msg.type === 'image' && <img src={msg.imageUrl} onClick={() => setLightboxImage(msg.imageUrl)} className="mb-2 max-h-48 border border-[#17172A] bg-white object-contain cursor-pointer" alt="attachment" />}
                                                    {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))}
                            {/* padding-bottom buffer within scroller */}
                            <div className="h-4"></div>
                        </div>

                        {/* Floating Mobile Badges */}
                        {newMessagesCount > 0 && (
                            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-[45]">
                                <button
                                    onClick={scrollToBottom}
                                    className="flex items-center gap-2 bg-[#1b1b24] text-white px-3 py-1.5 border border-[#17172A] shadow-[4px_4px_0_#17172A] font-bold text-[10px] tracking-widest uppercase"
                                >
                                    <ArrowDown className="w-3 h-3" />
                                    NEW MESSAGES +{newMessagesCount}
                                </button>
                            </div>
                        )}

                        {/* Mobile Composer Overlay */}
                        <div className="shrink-0 w-full z-50 bg-[#fcf8ff] flex flex-col relative">
                            {showEmojiPicker && (
                                <div ref={emojiContainerRef} className="absolute bottom-full right-2 mb-2 border border-[#17172A] shadow-[4px_4px_0_#17172A] z-[60]">
                                    <EmojiPicker onEmojiClick={(e) => { setText(prev => prev + e.emoji); setShowEmojiPicker(false); }} theme="dark" width={300} height={350} />
                                </div>
                            )}

                            {replyingTo && (
                                <div className="px-4 py-2 bg-[#f5f2ff] border-t border-[#17172A] flex justify-between items-center">
                                    <div className="flex-1 truncate border-l-[3px] border-[#250fc2] pl-2">
                                        <p className="text-[9px] font-bold text-[#250fc2] uppercase mb-0.5">REPLYING TO {replyingTo.sender === myId ? 'YOU' : getSafeName(getOtherParticipant(activeChat.participants))}</p>
                                        <p className="text-[11px] text-[#1b1b24] truncate">{replyingTo.imageUrl ? '[ IMAGE ]' : replyingTo.text}</p>
                                    </div>
                                    <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-error hover:text-white border border-[#17172A] transition-colors ml-4"><X className="w-4 h-4" /></button>
                                </div>
                            )}

                            {imagePreview && (
                                <div className="p-2 border-t border-[#17172A] bg-white text-center relative z-20">
                                    <div className="inline-block relative">
                                        <img src={imagePreview} className="h-16 object-contain border border-[#17172A]" />
                                        <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-error text-white border border-[#17172A] p-0.5 rounded-full"><X className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            )}

                            {/* Message Input Area */}
                            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(e); }} className="p-4 border-t border-[#17172A] bg-[#fcf8ff] flex items-center justify-between">
                                <div className="flex gap-2 w-full">
                                    <div className="flex items-center space-x-1 shrink-0 absolute -left-20">
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                                    </div>

                                    <div className="relative flex-1 flex group">
                                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-[44px] h-[48px] flex items-center justify-center shrink-0 border border-r-0 border-[#17172A] bg-white"><Smile className="w-5 h-5 text-[#464555]" /></button>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-[44px] h-[48px] flex items-center justify-center shrink-0 border border-[#17172A] border-r-0 bg-white"><FileImage className="w-5 h-5 text-[#464555]" /></button>

                                        <input
                                            value={text}
                                            onChange={handleInput}
                                            className="w-full bg-[#ffffff] border border-[#17172A] focus:border-[#250fc2] focus:ring-0 px-3 py-3 font-mono text-[14px] text-[#1b1b24] placeholder:text-[#777587] placeholder:text-[11px] rounded-none transition-colors outline-none h-[48px]"
                                            placeholder="ENTER_MESSAGE..."
                                            type="text"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!text.trim() && !imagePreview}
                                        className="bg-[#250fc2] text-white border border-[#17172A] px-4 text-[12px] font-bold tracking-[0.1em] hover:bg-[#4b45e2] active:translate-y-px transition-all h-[48px] flex items-center justify-center shrink-0 disabled:opacity-50"
                                    >
                                        SEND
                                        <span className="w-1.5 h-1.5 bg-white ml-2 inline-block"></span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                )}

                {/* Bottom Navigation Shell (Mobile) */}
                <nav className="shrink-0 bg-[#fcf8ff] border-t border-[#1b1b24] grid grid-cols-4 w-full z-[60] h-[72px] pb-[env(safe-area-inset-bottom)]">
                    <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center gap-1 text-[#464555] font-bold text-[10px] tracking-[0.1em] hover:bg-[#e4e1ee] transition-colors h-full">
                        <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>dashboard</span>
                        <span>OVERVIEW</span>
                    </button>
                    <button onClick={() => navigate('/search')} className="flex flex-col items-center justify-center gap-1 text-[#464555] font-bold text-[10px] tracking-[0.1em] hover:bg-[#e4e1ee] transition-colors h-full">
                        <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>list_alt</span>
                        <span>LISTINGS</span>
                    </button>
                    {/* Active Tab */}
                    <button onClick={() => navigate('/messages')} className="flex flex-col items-center justify-center gap-1 bg-[#250fc2] text-white font-bold text-[10px] tracking-[0.1em] transition-colors h-[73px] -mt-[1px] border-t-[3px] border-white relative">
                        <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>forum</span>
                        <span>MESSAGES</span>
                        {/* Notification dot */}
                        {conversations.filter(c => (c.unreadCounts?.[myId] || 0) > 0).length > 0 && (
                            <span className="absolute top-3 right-6 w-2 h-2 bg-[#ffb8a0] border border-[#17172A] rounded-full"></span>
                        )}
                    </button>
                    <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center gap-1 text-[#464555] font-bold text-[10px] tracking-[0.1em] hover:bg-[#e4e1ee] transition-colors h-full">
                        <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>receipt_long</span>
                        <span>TRANS.</span>
                    </button>
                </nav>
            </div>
        </>
    );
};

export default Messages;
