import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
    <footer className="bg-on-background border-t-technical mt-auto w-full z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-mobile md:px-margin-desktop py-12 w-full max-w-container-max mx-auto text-surface">
            <div className="md:col-span-4 flex flex-col gap-4">
                <Link className="font-headline-md text-headline-md underline hover:text-primary-fixed-dim transition-colors" to="/">LUMINA_</Link>
                <p className="font-metadata text-metadata text-surface-variant">A decentralized commodity exchange platform.</p>
                <span className="font-metadata text-metadata text-outline mt-4">LUMINA_ 2026</span>
            </div>
            <div className="md:col-span-8 flex flex-wrap gap-x-12 gap-y-6 md:justify-end">
                <Link className="text-surface-variant font-label-caps text-label-caps hover:text-primary-fixed-dim" to="/search">MARKETPLACE</Link>
                <a className="text-surface-variant font-label-caps text-label-caps hover:text-primary-fixed-dim" href="#">COMPANY</a>
                <a className="text-surface-variant font-label-caps text-label-caps hover:text-primary-fixed-dim" href="#">LEGAL</a>
                <span className="text-surface-variant font-label-caps text-label-caps flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
                    SYSTEM_STATUS: ONLINE
                </span>
            </div>
        </div>
    </footer>
);

export default Footer;
