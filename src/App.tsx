import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';

// Pages (to be created)
import Home from './pages/Home';
import EducatorDashboard from './pages/EducatorDashboard';
import SessionManager from './pages/SessionManager';
import ParticipantDashboard from './pages/ParticipantDashboard';
import ActiveGame from './pages/ActiveGame';
import PresenterView from './pages/PresenterView';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CaseEditor from './pages/CaseEditor';

// Components
import Navigation from './components/Navigation';
import RoleSwitcher from './components/RoleSwitcher';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Default profile for new users (though signup handles this, Google login might not)
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            role: 'participant',
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-lg font-medium text-brand">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-text-primary font-sans pt-16">
        {user && <Navigation profile={profile} />}
        {user && <RoleSwitcher profile={profile} />}
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Home user={user} profile={profile} /> : <Navigate to="/login" />} />
          
          {/* Educator Routes */}
          <Route 
            path="/educator" 
            element={user && profile?.role === 'educator' ? <EducatorDashboard profile={profile} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/educator/case/:caseId" 
            element={user && profile?.role === 'educator' ? <CaseEditor profile={profile} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/educator/session/:sessionId" 
            element={user && profile?.role === 'educator' ? <SessionManager profile={profile} /> : <Navigate to="/" />} 
          />

          {/* Participant Routes */}
          <Route 
            path="/participant" 
            element={user && profile?.role === 'participant' ? <ParticipantDashboard profile={profile} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/participant/session/:sessionId" 
            element={user && profile?.role === 'participant' ? <ActiveGame profile={profile} /> : <Navigate to="/" />} 
          />

          {/* Presenter Routes */}
          <Route 
            path="/presenter/:teamId" 
            element={<PresenterView />} 
          />

          {/* Shared Routes */}
          <Route path="/leaderboard/:sessionId" element={<Leaderboard />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
