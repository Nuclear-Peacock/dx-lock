import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInAnonymously, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { UserPlus, Lock, User, Palette, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

export default function Signup() {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        </div>
      </div>
    </div>
  );
}
