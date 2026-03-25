import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { logout } from '../firebase';
import { Home, Shield, Users, LogOut, Trophy, Activity, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  profile: UserProfile | null;
}

export default function Navigation({ profile }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!profile) return null;

  const navItems = [
    { label: 'HOME', path: '/', icon: Home },
    { label: 'EDUCATOR', path: '/educator', icon: Shield, role: 'educator' },
    { label: 'PARTICIPANT', path: '/participant', icon: Users, role: 'participant' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-line z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-text-primary">
              DX <span className="text-brand">Lock</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              if (item.role && profile.role !== item.role) return null;
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-medium text-text-primary leading-none">
                {profile.displayAlias}
              </p>
              <p className="text-[10px] text-text-secondary capitalize mt-1 font-semibold tracking-wider">{profile.role}</p>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ backgroundColor: profile.favoriteColor }}
            >
              {profile.firstNameInitial}{profile.lastNameInitial}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-text-secondary hover:text-danger transition-colors rounded-full hover:bg-danger/10"
          >
            <LogOut size={18} />
          </button>
          
          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-text-secondary hover:bg-gray-100 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-surface border-b border-line p-4 md:hidden shadow-lg"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 border-b border-line mb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: profile.favoriteColor }}
                >
                  {profile.firstNameInitial}{profile.lastNameInitial}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {profile.displayAlias}
                  </p>
                  <p className="text-[10px] text-text-secondary capitalize font-semibold tracking-wider">{profile.role}</p>
                </div>
              </div>
              {navItems.map(item => {
                if (item.role && profile.role !== item.role) return null;
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors text-left mt-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
