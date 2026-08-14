import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Verify = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 6-digit OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const [email, setEmail] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailParam = queryParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            navigate('/signup');
        }
    }, [location, navigate]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, '');
        if (!digit && value !== '') return;

        const newOtp = [...otp];
        newOtp[index] = digit.slice(-1);
        setOtp(newOtp);

        if (digit && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain');
        const digits = pastedData.replace(/\D/g, '');

        if (digits) {
            const newOtp = [...otp];
            const maxFill = Math.min(digits.length, 6);
            for (let i = 0; i < maxFill; i++) {
                newOtp[i] = digits[i];
            }
            setOtp(newOtp);

            if (maxFill < 6) {
                inputRefs.current[maxFill].focus();
            } else {
                inputRefs.current[5].focus();
                inputRefs.current[5].blur();
            }
        }
    };

    const isVerifyDisabled = otp.join('').length !== 6;

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length !== 6) {
            return; // button is disabled anyway
        }

        toast.loading('Verifying...', { id: 'verify' });
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: fullOtp })
            });
            const text = await res.text();
            let data = {};
            if (text) {
                try { data = JSON.parse(text); } catch { throw new Error("Invalid server response. The backend may be offline."); }
            } else {
                throw new Error("Empty server response.");
            }
            if (data.success) {
                toast.success('EMAIL VERIFIED ✓', { id: 'verify' });
                setTimeout(() => navigate('/login'), 1500);
            } else {
                toast.error(data.message || data.error || 'Verification failed', { id: 'verify' });
            }
        } catch (error) {
            toast.error('Verification failed.', { id: 'verify' });
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;

        toast.loading('Requesting code...', { id: 'resend' });
        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const text = await res.text();
            let data = {};
            if (text) {
                try { data = JSON.parse(text); } catch { throw new Error("Invalid server response. The backend may be offline."); }
            } else {
                throw new Error("Empty server response.");
            }
            if (data.success) {
                toast.success('NEW VERIFICATION CODE SENT', { id: 'resend' });
                setCooldown(60);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            } else {
                if (data.code === 'EMAIL_DELIVERY_FAILED') {
                    toast.error('EMAIL DELIVERY FAILED\nPlease check the email address or try again later.', { id: 'resend', duration: 5000 });
                } else {
                    toast.error(data.message || data.error || 'Failed to resend OTP.', { id: 'resend' });
                }
            }
        } catch (error) {
            toast.error('Failed to resend OTP.', { id: 'resend' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-low dotted-grid">
            <main className="w-full max-w-md mx-auto bg-surface border-technical flex flex-col min-h-[400px] shadow-hard">
                <section className="w-full bg-on-background p-6">
                    <h1 className="font-headline-sm text-headline-sm text-primary-fixed tracking-tighter">CampusX Verify</h1>
                </section>
                <section className="w-full flex-1 bg-surface flex flex-col p-8 relative">
                    <div className="mb-8">
                        <h2 className="font-headline-md text-headline-md text-on-background mb-4">&gt; VERIFY YOUR EMAIL</h2>
                        <p className="font-metadata text-metadata text-on-surface-variant uppercase">
                            We sent a 6-digit verification code to:<br />
                            <span className="text-primary mt-1 block font-bold">{email}</span>
                        </p>
                        <div className="mt-2 text-xs">
                            <Link to="/signup" className="text-outline hover:text-primary underline font-metadata">[ CHANGE EMAIL ]</Link>
                        </div>
                        <div className="h-px w-16 bg-primary mt-6"></div>
                    </div>
                    <form onSubmit={handleVerify} className="flex-1 flex flex-col gap-6">
                        <div className="flex flex-col gap-2 items-center">
                            <div className="flex gap-2 w-full justify-center">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-14 bg-transparent border-technical p-1 font-headline-sm text-on-background text-center focus:ring-1 focus:ring-primary outline-none"
                                        maxLength={1}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-4">
                            <button
                                className={`w-full font-label-caps py-4 px-6 border-technical transition-colors flex items-center justify-between group ${isVerifyDisabled ? 'bg-surface-container-lowest text-outline-variant cursor-not-allowed' : 'bg-on-background text-surface hover:bg-primary cursor-pointer'}`}
                                type="submit"
                                disabled={isVerifyDisabled}
                            >
                                <span>[ VERIFY EMAIL ]</span>
                                {!isVerifyDisabled && <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                            </button>
                            <div className="text-center mt-2">
                                <span className="text-sm font-metadata opacity-60">Didn't receive the code?</span>
                                {cooldown > 0 ? (
                                    <div className="w-full text-outline font-label-caps py-2 px-6 flex items-center justify-center mt-1">
                                        <span>[ RESEND AVAILABLE IN {cooldown}S ]</span>
                                    </div>
                                ) : (
                                    <button onClick={handleResend} className="w-full bg-transparent text-primary font-label-caps py-2 px-6 border border-transparent hover:border-technical transition-colors flex items-center justify-center mt-1" type="button">
                                        <span>[ RESEND CODE ]</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default Verify;
