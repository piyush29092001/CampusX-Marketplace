import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';

const BottomNav = () => {
    const location = useLocation();
    const { globalUnread } = useStore(); // If unread is in store, otherwise I'll just skip unread dot here for now to avoid refactoring global state if it's currently local to Navbar

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-surface border-t border-on-background z-[60] md:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-between items-center w-full px-4 h-[64px]">
                <Link to="/profile" className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/profile') ? 'text-primary border-t-2 border-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
                    <span className="font-label-caps text-[10px]">OVERVIEW</span>
                </Link>
                <Link to="/search" className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/search') || isActive('/') ? 'text-primary border-t-2 border-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/search') || isActive('/') ? "'FILL' 1" : "'FILL' 0" }}>list_alt</span>
                    <span className="font-label-caps text-[10px]">LISTINGS</span>
                </Link>
                <Link to="/messages" className={`flex flex-col items-center justify-center w-1/4 h-full relative ${isActive('/messages') ? 'text-primary border-t-2 border-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/messages') ? "'FILL' 1" : "'FILL' 0" }}>forum</span>
                    <span className="font-label-caps text-[10px]">MESSAGES</span>
                    {globalUnread > 0 && (
                        <span className="absolute top-1 right-[25%] bg-error text-on-error text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-surface">
                            {globalUnread > 9 ? '9+' : globalUnread}
                        </span>
                    )}
                </Link>
                <Link to="/sell" className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/sell') ? 'text-primary border-t-2 border-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/sell') ? "'FILL' 1" : "'FILL' 0" }}>add_box</span>
                    <span className="font-label-caps text-[10px]">SELL</span>
                </Link>
            </div>
        </nav>
    );
};

export default BottomNav;
