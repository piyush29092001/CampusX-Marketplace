import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import useStore from '../store/useStore';

const Login = () => {
    const { login, setUser } = useStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            const text = await res.text();
            let data = {};
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error("Invalid server response");
                }
            } else {
                throw new Error("Empty server response");
            }

            if (data.success) {
                login(data.token);
                setUser(data.user);
                navigate('/');
            } else {
                console.error("Google Auth Server Rejection:", data.error);
                toast.error('Your login details could not be verified. Please try again.', { duration: 4000 });
            }
        } catch (err) {
            console.error('Firebase Google Auth Exception:', err);
            toast.error('Unable to connect to the server. Please try again.', { duration: 6000 });
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        toast.loading('Authenticating...', { id: 'login' });
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const text = await res.text();
            let data = {};
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error("Invalid server response");
                }
            } else {
                throw new Error("Empty server response");
            }

            if (data.success) {
                toast.success('Login successful.', { id: 'login' });
                login(data.token);
                setUser(data.user);
                navigate('/');
            } else {
                // Handle Google-only account trying password login
                if (data.error === 'AUTH_PROVIDER_GOOGLE') {
                    toast.error('This account uses Google Sign-In. Please continue with Google.', { id: 'login', duration: 5000 });
                } else {
                    console.error("Login Server Rejection:", data.error || data.message);
                    toast.error('Login failed. Please try again in a moment.', { id: 'login' });
                    if (data.error === 'EMAIL_NOT_VERIFIED') {
                        navigate(`/verify?email=${encodeURIComponent(email)}`);
                    }
                }
            }
        } catch (error) {
            console.error('Login Network Exception:', error);
            toast.error('Unable to connect to the server. Please check your connection and try again.', { id: 'login' });
        }
    };

    return (
        <>
            {/* --- DESKTOP LAYOUT (unchanged, hidden on mobile) --- */}
            <div className="hidden md:flex min-h-screen items-center justify-center p-4 md:p-8 bg-surface-container-low dotted-grid">
                <main className="w-full max-w-container-max mx-auto bg-surface border-technical flex flex-col md:flex-row min-h-[600px] shadow-hard">
                    <section className="w-full md:w-1/2 border-b-technical md:border-b-0 md:border-r-technical relative overflow-hidden bg-on-background flex flex-col justify-between">
                        <div className="absolute inset-0 z-0 opacity-40 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000')" }}></div>
                        <div className="relative z-10 p-8"><h1 className="font-headline-lg text-headline-lg text-primary-fixed tracking-tighter">CampusX</h1></div>
                        <div className="relative z-10 p-8 mt-auto bg-on-background/90 backdrop-blur-sm border-t border-outline">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                                <span className="font-label-caps text-label-caps text-primary-fixed">SYSTEM STATUS: ONLINE</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-outline">network_ping</span>
                                <span className="font-metadata text-metadata text-outline">COLLEGE NETWORK: READY</span>
                            </div>
                        </div>
                    </section>
                    <section className="w-full md:w-1/2 bg-surface flex flex-col p-8 md:p-16 relative">
                        <div className="absolute top-0 right-0 p-4"><span className="font-metadata text-metadata text-on-surface-variant">[ v.2.4.1_stable ]</span></div>
                        <div className="mt-8 mb-12">
                            <h2 className="font-headline-md text-headline-md text-on-background mb-4">&gt; CampusX Access</h2>
                            <p className="font-metadata text-metadata text-on-surface-variant uppercase">AUTHENTICATE YOUR CAMPUS ACCOUNT</p>
                            <div className="h-px w-16 bg-primary mt-6"></div>
                        </div>
                        <form onSubmit={handleLogin} className="flex-1 flex flex-col gap-6 max-w-md w-full">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-caps text-label-caps text-on-background">EMAIL</label>
                                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" placeholder="user@college.edu" type="email" required />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-label-caps text-label-caps text-on-background flex justify-between">
                                    PASSWORD <Link className="text-primary hover:underline" to="#">RESET?</Link>
                                </label>
                                <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" placeholder="••••••••" type="password" required />
                            </div>
                            <div className="mt-8 flex flex-col gap-4">
                                <button className="w-full bg-on-background text-surface font-label-caps py-4 px-6 border-technical hover:bg-primary transition-colors flex items-center justify-between group" type="submit">
                                    <span>[ ACCESS_ACCOUNT ]</span>
                                    <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                                <button onClick={() => navigate('/signup')} className="w-full bg-transparent text-on-background font-label-caps py-4 px-6 border-technical hover:bg-surface-variant transition-colors flex items-center justify-center gap-2" type="button">
                                    <span className="material-symbols-outlined">person_add</span>
                                    <span>[ CREATE NEW CAMPUS ACCOUNT ]</span>
                                </button>
                                <button onClick={handleGoogleLogin} className="w-full bg-[#1b1b24] text-[#fcf8ff] font-label-caps py-4 px-6 border-technical hover:bg-on-background transition-colors flex items-center justify-center gap-2 mt-2 group" type="button">
                                    <svg className="w-5 h-5 bg-white rounded-full p-[2px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    <span>[ CONTINUE WITH GOOGLE ]</span>
                                </button>
                            </div>
                        </form>
                    </section>
                </main>
            </div>

            {/* --- MOBILE LAYOUT (shown only on mobile, hides on desktop) --- */}
            <div
                className="md:hidden text-[#1b1b24] min-h-screen flex flex-col font-body-md antialiased bg-[#fcf8ff]"
                style={{
                    backgroundImage: 'radial-gradient(#dbd8e5 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    minHeight: 'max(884px, 100dvh)'
                }}
            >
                <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative">
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center w-[calc(100%-32px)]">
                        <span className="font-metadata text-[11px] text-[#464555]">SYSTEM STATUS: ONLINE</span>
                        <span className="font-metadata text-[11px] text-[#464555]">[ v.2.4.1_stable ]</span>
                    </div>

                    <div className="w-full max-w-sm bg-[#ffffff] border border-[#17172A] p-6 flex flex-col gap-6 relative shadow-[4px_4px_0_#17172A]">
                        {/* Header */}
                        <div className="flex flex-col gap-2 border-b border-[#17172A] pb-4">
                            <h1 className="font-headline-lg text-[32px] font-bold tracking-tighter flex items-center gap-2 m-0 p-0 leading-none">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                                CampusX
                            </h1>
                            <p className="font-metadata text-[11px] text-[#464555] uppercase m-0 p-0">Access restricted to authorized personnel.</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">

                            {/* Email Field */}
                            <div className="flex flex-col gap-1 group bg-[#ffffff] border border-[#17172A] focus-within:border-[#4038D8] px-3 py-2 transition-colors">
                                <label className="font-label-caps text-[12px] font-bold tracking-[0.1em] text-[#777587] group-focus-within:text-[#4038D8]">EMAIL</label>
                                <div className="flex items-center gap-2">
                                    <span className="font-body-md text-[14px] text-[#464555]">&gt;</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@college.edu"
                                        required
                                        className="bg-transparent w-full font-body-md text-[14px] text-[#1b1b24] focus:outline-none focus:ring-0 placeholder:text-[#c7c4d8] border-none p-0"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-1 group bg-[#ffffff] border border-[#17172A] focus-within:border-[#4038D8] px-3 py-2 transition-colors relative">
                                <div className="flex justify-between items-center w-full">
                                    <label className="font-label-caps text-[12px] font-bold tracking-[0.1em] text-[#777587] group-focus-within:text-[#4038D8]">PASSWORD</label>
                                    <Link to="#" className="font-metadata text-[11px] text-[#777587] hover:text-[#4038D8] underline decoration-1 underline-offset-2">RESET?</Link>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-body-md text-[14px] text-[#464555]">&gt;</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="bg-transparent w-full font-body-md text-[14px] text-[#1b1b24] focus:outline-none focus:ring-0 placeholder:text-[#c7c4d8] border-none p-0"
                                    />
                                </div>
                            </div>

                            {/* Primary Action Button */}
                            <button type="submit" className="mt-2 bg-[#1b1b24] hover:bg-[#4038D8] text-[#ffffff] border border-[#17172A] px-4 py-3 flex justify-between items-center transition-colors group">
                                <span className="font-label-caps text-[12px] font-bold tracking-[0.1em]">[ ACCESS_ACCOUNT ]</span>
                                <span className="material-symbols-outlined text-[#ffffff] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-2 my-2">
                                <div className="h-px bg-[#17172A] flex-1"></div>
                                <span className="font-metadata text-[11px] text-[#464555] uppercase">or</span>
                                <div className="h-px bg-[#17172A] flex-1"></div>
                            </div>

                            {/* Google Sign-in Button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="bg-transparent hover:bg-[#4038D8] hover:text-[#ffffff] text-[#1b1b24] border border-[#17172A] px-4 py-3 flex justify-between items-center transition-colors group"
                            >
                                <span className="font-label-caps text-[12px] font-bold tracking-[0.1em]">[ CONTINUE WITH GOOGLE ]</span>
                                <svg className="w-5 h-5 bg-white rounded-full p-[2px] shadow-sm group-hover:opacity-90" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </button>

                            {/* Signup Option Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="mt-1 bg-transparent hover:bg-[#e4e1ee] text-[#1b1b24] border border-[#17172A] px-4 py-3 flex justify-between items-center transition-colors group"
                            >
                                <span className="font-label-caps text-[12px] font-bold tracking-[0.1em]">[ CREATE NEW ACCOUNT ]</span>
                                <span className="material-symbols-outlined text-[#1b1b24]">person_add</span>
                            </button>
                        </form>

                        {/* Bottom decorative element (matching reference image) */}
                        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 bg-[#e4e1ee] border-t border-l border-[#17172A] z-10 pointer-events-none"></div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Login;
