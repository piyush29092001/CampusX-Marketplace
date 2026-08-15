import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getSocket } from '../services/socket';
import useStore from '../store/useStore';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { globalUnread, setGlobalUnread } = useStore();

    const showAuthNav = location.pathname !== '/login';

    useEffect(() => {
        const token = localStorage.getItem('lumina_token');
        if (!token) return;

        let myId;
        try {
            myId = JSON.parse(atob(token.split('.')[1])).id;
        } catch (e) { return; }

        const loadUnread = async () => {
            try {
                const res = await fetch(import.meta.env.VITE_API_URL + '/api/messages/conversations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    let total = 0;
                    json.data.forEach(c => {
                        total += (c.unreadCounts?.[myId] || 0);
                    });
                    setGlobalUnread(total);
                }
            } catch (e) { console.error("Unread load failure", e); }
        };

        loadUnread();

        // Listen passively to real-time events through the shared socket.io instance
        const socket = getSocket(token);

        const handleConvoUpdate = () => {
            // Hot reload unread counts dynamically on any conversation mutation global event
            loadUnread();
        };

        const handleNewMessageToast = (msg) => {
            if (window.location.pathname !== '/messages') {
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.success('New message received!', {
                        style: {
                            border: '1px solid #17172A',
                            padding: '16px',
                            color: '#1b1b24',
                            background: '#fff',
                            borderRadius: '0px',
                            boxShadow: '4px 4px 0 #17172A',
                            fontFamily: 'monospace'
                        },
                        iconTheme: {
                            primary: '#250fc2',
                            secondary: '#fff',
                        },
                    });
                });
            }
        };

        socket.on('conversation_updated', handleConvoUpdate);
        socket.on('new_message', handleNewMessageToast);

        return () => {
            socket.off('conversation_updated', handleConvoUpdate);
            socket.off('new_message', handleNewMessageToast);
        };
    }, []);

    return (
        <header className="bg-surface border-b border-on-background fixed top-0 left-0 right-0 w-full z-[60] md:sticky md:top-0">
            <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-[64px] max-w-container-max mx-auto">
                <div className="flex items-center gap-4 md:gap-6">
                    <Link className="font-headline-lg text-[20px] md:text-headline-lg text-on-background tracking-tighter hover:text-primary transition-colors duration-100" to="/">CampusX</Link>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative flex items-center border-technical bg-surface-container-lowest h-8 px-2 w-[200px] focus-within:border-primary group">
                            <span className="font-metadata text-metadata text-outline mr-2">&gt;</span>
                            <input
                                className="bg-transparent border-none outline-none font-metadata text-metadata text-on-surface w-full p-0 h-full focus:ring-0 placeholder:text-outline-variant group-focus-within:blinking-cursor"
                                placeholder="QUERY_MARKET..."
                                type="text"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        navigate(`/search?keyword=${encodeURIComponent(e.target.value.trim())}`);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                {showAuthNav && (
                    <nav className="hidden md:flex items-center gap-8">
                        <Link className="text-on-surface-variant font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 flex items-center" to="/search?category=ELECTRONICS">ELECTRONICS</Link>
                        <Link className="text-on-surface-variant font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 flex items-center" to="/search?category=STUDY%20%26%20ACADEMICS">STUDY</Link>
                        <Link className="text-on-surface-variant font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 flex items-center" to="/search?category=VEHICLES%20%26%20MOBILITY">MOBILITY</Link>
                        <Link className="text-on-surface-variant font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 flex items-center" to="/search?category=HOSTEL%20%26%20LIVING">HOSTEL</Link>
                    </nav>
                )}
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/search')}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                    </button>
                    <div className="flex gap-4">
                        <button className="hidden md:flex text-on-surface-variant hover:text-primary transition-colors cursor-pointer relative" onClick={() => navigate('/messages')}>
                            <span className="material-symbols-outlined">mail</span>
                            {globalUnread > 0 && (
                                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-surface">
                                    {globalUnread > 9 ? '9+' : globalUnread}
                                </span>
                            )}
                        </button>
                        <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                            <span className="material-symbols-outlined block" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                            <span className="material-symbols-outlined block" style={{ fontVariationSettings: "'FILL' 0" }}>account_circle</span>
                        </button>
                    </div>
                    <button onClick={() => navigate('/sell')} className="hidden md:flex bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 border-technical hover:bg-on-background transition-colors cursor-pointer items-center gap-2">
                        SELL <span className="w-1 h-1 bg-on-primary block"></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
