import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import useStore from '../store/useStore';

const Signup = () => {
    const navigate = useNavigate();
    const { login, setUser } = useStore();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        college: 'CampusX University', department: '', year: '1'
    });

    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            setPasswordValidations({
                length: value.length >= 8,
                upper: /[A-Z]/.test(value),
                lower: /[a-z]/.test(value),
                number: /\d/.test(value),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
            });
        }
    };

    const isPasswordValid = Object.values(passwordValidations).every(Boolean);



    const handleGoogleSignup = async () => {
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
                try { data = JSON.parse(text); } catch { throw new Error("Invalid server response. The backend may be offline."); }
            } else {
                throw new Error("Empty server response.");
            }
            if (data.success) {
                login(data.token);
                setUser(data.user);
                navigate('/');
            } else {
                toast.error(data.error || 'Google signup failed');
            }
        } catch (err) {
            toast.error('Google verification failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPasswordValid) {
            toast.error('Password does not meet requirements.');
            return;
        }
        toast.loading('Initializing...', { id: 'reg' });
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const text = await res.text();
            let data = {};
            if (text) {
                try { data = JSON.parse(text); } catch { throw new Error("Invalid server response. The backend may be offline."); }
            } else {
                throw new Error("Empty server response.");
            }
            if (data.success) {
                toast.success(data.message, { id: 'reg' });
                navigate(`/verify?email=${encodeURIComponent(formData.email)}`);
            } else {
                if (data.code === 'EMAIL_DELIVERY_FAILED') {
                    toast.error('EMAIL DELIVERY FAILED\nPlease check the email address or try again later.', { id: 'reg', duration: 5000 });
                } else {
                    toast.error(data.message || data.error || 'Registration failed', { id: 'reg' });
                }
            }
        } catch (error) {
            toast.error('Registration failed.', { id: 'reg' });
        }
    };

    const validateClass = (isValid) => isValid ? 'text-primary' : 'text-on-surface-variant';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-low dotted-grid">
            <main className="w-full max-w-container-max mx-auto bg-surface border-technical flex flex-col md:flex-row min-h-[600px] shadow-hard">
                <section className="w-full md:w-1/2 border-b-technical md:border-b-0 md:border-r-technical relative overflow-hidden bg-on-background flex flex-col justify-between">
                    <div className="absolute inset-0 z-0 opacity-40 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000')" }}></div>
                    <div className="relative z-10 p-8"><h1 className="font-headline-lg text-headline-lg text-primary-fixed tracking-tighter">CampusX</h1></div>
                    <div className="relative z-10 p-8 mt-auto bg-on-background/90 backdrop-blur-sm border-t border-outline">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                            <span className="font-label-caps text-label-caps text-primary-fixed">SYSTEM STATUS: REGISTERING</span>
                        </div>
                    </div>
                </section>
                <section className="w-full md:w-1/2 bg-surface flex flex-col p-8 md:p-16 relative overflow-y-auto max-h-[85vh] scrollbar-thin">
                    <div className="absolute top-0 right-0 p-4"><span className="font-metadata text-metadata text-on-surface-variant">[ v.2.4.1_stable ]</span></div>
                    <div className="mt-8 mb-8">
                        <h2 className="font-headline-md text-headline-md text-on-background mb-4">&gt; CampusX Registration</h2>
                        <p className="font-metadata text-metadata text-on-surface-variant uppercase">CREATE YOUR CAMPUS ACCOUNT</p>
                        <div className="h-px w-16 bg-primary mt-6"></div>
                    </div>
                    <form onSubmit={handleSubmit} id="registration-form" name="registration-form" autoComplete="off" className="flex-1 flex flex-col gap-4 max-w-md w-full">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-label-caps text-on-background">FULL NAME</label>
                            <input autoComplete="off" name="name" value={formData.name} onChange={handleChange} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" placeholder="John Doe" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-label-caps text-on-background">EMAIL</label>
                            <input autoComplete="off" name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" placeholder="user@college.edu" type="email" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-label-caps text-on-background">PASSWORD</label>
                            <input autoComplete="new-password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" type="password" required placeholder="••••••••" />

                            <div className="mt-2 text-xs font-metadata flex flex-col gap-1 bg-surface-container-lowest p-3 border border-outline-variant">
                                <span className="font-label-caps mb-1 opacity-70">PASSWORD REQUIREMENTS</span>
                                <div className={validateClass(passwordValidations.length)}>
                                    {passwordValidations.length ? '✓' : '○'} 8+ characters
                                </div>
                                <div className={validateClass(passwordValidations.upper)}>
                                    {passwordValidations.upper ? '✓' : '○'} 1 uppercase letter
                                </div>
                                <div className={validateClass(passwordValidations.lower)}>
                                    {passwordValidations.lower ? '✓' : '○'} 1 lowercase letter
                                </div>
                                <div className={validateClass(passwordValidations.number)}>
                                    {passwordValidations.number ? '✓' : '○'} 1 number
                                </div>
                                <div className={validateClass(passwordValidations.special)}>
                                    {passwordValidations.special ? '✓' : '○'} 1 special character
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-label-caps text-label-caps text-on-background">DEPARTMENT</label>
                            <input autoComplete="off" name="department" value={formData.department} onChange={handleChange} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Computer Science" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-label-caps text-on-background">YEAR</label>
                            <select name="year" value={formData.year} onChange={handleChange} className="w-full bg-transparent border-technical p-3 font-body-md text-on-background focus:ring-1 focus:ring-primary outline-none" required>
                                <option className="bg-surface text-on-surface" value="1">First Year</option>
                                <option className="bg-surface text-on-surface" value="2">Second Year</option>
                                <option className="bg-surface text-on-surface" value="3">Third Year</option>
                                <option className="bg-surface text-on-surface" value="4">Fourth Year +</option>
                            </select>
                        </div>
                        <div className="mt-8 flex flex-col gap-4">
                            <button className="w-full bg-on-background text-surface font-label-caps py-4 px-6 border-technical hover:bg-primary transition-colors flex items-center justify-between group" type="submit">
                                <span>[ SIGN UP ]</span>
                                <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <button onClick={() => navigate('/login')} className="w-full bg-transparent text-on-background font-label-caps py-4 px-6 border-technical hover:bg-surface-variant transition-colors flex items-center justify-center gap-2" type="button">
                                <span>[ EXISTING USER? LOGIN ]</span>
                            </button>
                            <button onClick={handleGoogleSignup} className="w-full bg-[#1b1b24] text-[#fcf8ff] font-label-caps py-4 px-6 border-technical hover:bg-on-background transition-colors flex items-center justify-center gap-2 mt-2 group" type="button">
                                <svg className="w-5 h-5 bg-white rounded-full p-[2px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                <span>[ CONTINUE WITH GOOGLE ]</span>
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default Signup;
