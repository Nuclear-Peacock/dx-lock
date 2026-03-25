import { UserProfile, UserRole } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Users, Eye, RefreshCw } from 'lucide-react';

interface RoleSwitcherProps {
  profile: UserProfile | null;
}

export default function RoleSwitcher({ profile }: RoleSwitcherProps) {
  if (!profile) return null;

  const roles: { role: UserRole; icon: any; color: string }[] = [
    { role: 'educator', icon: Shield, color: 'text-brand' },
    { role: 'participant', icon: Users, color: 'text-success' },
    { role: 'observer', icon: Eye, color: 'text-secondary' },
  ];

  const switchRole = async (newRole: UserRole) => {
    await updateDoc(doc(db, 'users', profile.uid), {
      role: newRole
    });
    window.location.reload(); // Force reload to apply role changes
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
      <div className="hidden group-hover:flex flex-col gap-1 apple-card p-2 shadow-xl animate-in slide-in-from-bottom-4">
        <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider px-2 pb-2 border-b border-line mb-1">Switch Role (Dev Mode)</p>
        <div className="px-3 py-2 border-b border-line mb-1 flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
            style={{ backgroundColor: profile.favoriteColor }}
          >
            {profile.firstNameInitial}{profile.lastNameInitial}
          </div>
          <span className="text-xs font-medium text-primary uppercase">{profile.displayAlias}</span>
        </div>
        {roles.map(item => {
          const Icon = item.icon;
          const isActive = profile.role === item.role;
          
          return (
            <button
              key={item.role}
              onClick={() => switchRole(item.role)}
              className={`flex items-center justify-between gap-4 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-gray-100 text-primary' : 'text-secondary hover:text-primary hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className={item.color} />
                <span className="capitalize">{item.role}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
      <button className="p-3 bg-surface border border-line rounded-full text-secondary hover:text-brand hover:border-brand/30 hover:shadow-md transition-all shadow-sm">
        <RefreshCw size={20} />
      </button>
    </div>
  );
}
