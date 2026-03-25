import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInAnonymously, db, signInWithPopup, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserPlus, Lock, User, Palette, AlertCircle, Shield } from 'lucide-react';
import { UserProfile } from '../types';

export default function Signup() {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEducatorLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (user.email !== 'justin.g.peacock@gmail.com') {
        throw new Error('Unauthorized: Only authorized educators can sign in here.');
      }

      const path = `users/${user.uid}`;
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }

      if (!userDoc?.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          firstNameInitial: 'J',
          lastNameInitial: 'P',
          favoriteColor: 'orange',
          displayAlias: 'Justin Peacock',
          role: 'educator',
        };
        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain: Please add this domain to your Firebase Authorized Domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup Blocked: Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to sign in as educator.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim();
    if (cleanCode.length < 3) {
      setError('Please enter your initials followed by a color (e.g., TMblue)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const firstNameInitial = cleanCode.charAt(0).toUpperCase();
      const lastNameInitial = cleanCode.charAt(1).toUpperCase();
      const rawColor = cleanCode.slice(2);
      const favoriteColor = rawColor.toLowerCase();
      const displayAlias = `${firstNameInitial}${lastNameInitial} ${rawColor.charAt(0).toUpperCase()}${rawColor.slice(1).toLowerCase()}`;

      const newProfile: UserProfile = {
        uid: user.uid,
        firstNameInitial,
        lastNameInitial,
        favoriteColor,
        displayAlias,
        role: 'participant',
      };

      await setDoc(doc(db, 'users', user.uid), newProfile);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join session.');
    } finally {
      setLoading(false);
    }
  };

  const previewInitials = joinCode.trim().slice(0, 2).toUpperCase();
  const previewColor = joinCode.trim().slice(2).toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-6">
            <Lock size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">DX Lock</h1>
          <p className="text-sm text-secondary font-medium">Enter your join code</p>
        </div>

        <div className="apple-card space-y-6 p-8">
          <form onSubmit={handleJoin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Join Code</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="input-field w-full pl-10"
                  placeholder="e.g. TMblue"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">
                Format: [First Initial][Last Initial][Favorite Color]
              </p>
            </div>

            {joinCode.trim().length >= 2 && (
              <div className="p-4 bg-surface border border-line rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm transition-colors duration-300"
                  style={{ backgroundColor: previewColor || '#4F46E5' }}
                >
                  {previewInitials.padEnd(2, '?')}
                </div>
                <div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wider">Profile Preview</p>
                  <p className="text-lg font-semibold text-primary">
                    {previewInitials.padEnd(2, '?')}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || joinCode.trim().length < 3}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <UserPlus size={18} />
              {loading ? 'Joining...' : 'Join Session'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-secondary font-medium">Educators Only</span>
            </div>
          </div>

          <button
            onClick={handleEducatorLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-line bg-white text-sm font-semibold text-primary hover:bg-gray-50 transition-all"
          >
            <Shield size={18} className="text-brand" />
            Sign in as Educator
          </button>
        </div>
      </div>
    </div>
  );
}
