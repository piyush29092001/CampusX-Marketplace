import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import ProductDetails from './pages/ProductDetails';
import Sell from './pages/Sell';
import EditListing from './pages/EditListing';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import useStore from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { isDarkMode, login, setUser, setAuthLoading } = useStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Session restoration on app startup
  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = localStorage.getItem('lumina_token');

      // Strategy 1: Try restoring from existing JWT
      if (existingToken) {
        try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/me', {
            headers: { 'Authorization': `Bearer ${existingToken}` }
          });
          const text = await res.text();
          let data = {};
          if (text) {
            try { data = JSON.parse(text); } catch { /* ignore */ }
          }
          if (data.success) {
            login(existingToken);
            setUser(data.user);
            setAuthLoading(false);
            setInitializing(false);
            return;
          }
        } catch (e) {
          // Token invalid — fall through to Firebase check
        }
        // Token was invalid, clear it
        localStorage.removeItem('lumina_token');
      }

      // Strategy 2: Firebase onAuthStateChanged for Google users
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken(true);
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/refresh-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ firebaseIdToken: idToken })
            });
            const text = await res.text();
            let data = {};
            if (text) {
              try { data = JSON.parse(text); } catch { /* ignore */ }
            }
            if (data.success) {
              login(data.token);
              setUser(data.user);
            }
          } catch (e) {
            console.error('Firebase session restore failed:', e);
          }
        }
        setAuthLoading(false);
        setInitializing(false);
      });

      return () => unsubscribe();
    };

    restoreSession();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tighter animate-pulse">CampusX</h1>
          <p className="font-metadata text-metadata text-on-surface-variant mt-2 uppercase tracking-widest">RESTORING SESSION...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-[100dvh] flex flex-col bg-surface text-on-surface font-body-md relative pt-[64px] md:pt-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0`}>
        <Navbar />
        <main className="w-full relative flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/edit/:id" element={<EditListing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
        </main>
        <Footer />
        <BottomNav />
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
