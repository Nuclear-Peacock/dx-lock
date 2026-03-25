import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { logout } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Users, Lock } from 'lucide-react';

interface HomeProps {
  user: User;
  profile: UserProfile | null;
}

export default function Home({ user, profile }: HomeProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-6">
            <Lock size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">DX Lock</h1>
          <p className="text-sm text-secondary font-medium">Radiology Teaching Platform</p>
        </div>

        <div className="space-y-6">
          <div className="apple-card p-6 space-y-2 text-left">
            <p className="text-xs font-medium text-secondary uppercase tracking-wider">Authenticated as</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: profile?.favoriteColor || '#4F46E5' }}
              >
                {profile?.firstNameInitial || '?'}{profile?.lastNameInitial || '?'}
              </div>
              <div>
                <p className="text-lg font-medium text-primary">
                  {profile?.displayAlias || `${profile?.firstNameInitial}${profile?.lastNameInitial}`}
                </p>
                <p className="text-xs text-secondary font-mono uppercase">
                  {profile?.favoriteColor}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <span className="badge badge-blue">
                {profile?.role || 'participant'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {profile?.role === 'educator' && (
              <button
                onClick={() => navigate('/educator')}
                className="btn-primary flex items-center justify-center gap-2 py-3"
              >
                <Shield size={18} />
                Educator Dashboard
              </button>
            )}
            
            {(profile?.role === 'participant' || !profile) && (
              <button
                onClick={() => navigate('/participant')}
                className="btn-primary flex items-center justify-center gap-2 py-3"
              >
                <Users size={18} />
                Participant Dashboard
              </button>
            )}

            <button
              onClick={logout}
              className="btn-secondary flex items-center justify-center gap-2 py-3 text-secondary hover:text-danger hover:border-danger/30"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        <div className="pt-12">
          <p className="text-xs font-medium text-secondary">
            DX Lock &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
