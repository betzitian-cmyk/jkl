import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';
import { LogIn, LogOut, Shield, User, ChevronRight, Sparkles } from 'lucide-react';

interface UserAuthBadgeProps {
  variant?: 'sidebar' | 'header';
}

export const UserAuthBadge: React.FC<UserAuthBadgeProps> = ({ variant = 'sidebar' }) => {
  const { user, userProfile, role, isAdmin, openAuthModal, signOut, switchRoleDemo } = useAuth();
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const displayName = userProfile?.displayName || user?.displayName || (user?.email ? user.email.split('@')[0] : (isFr ? 'Utilisateur Démo' : 'Demo User'));
  const userEmail = user?.email || (isFr ? 'Non connecté (Mode Démo)' : 'Not signed in (Demo Mode)');
  const initials = displayName.charAt(0).toUpperCase();

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-3">
        {/* Role Pill Switcher */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => switchRoleDemo('admin')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              isAdmin 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => switchRoleDemo('employee')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              !isAdmin 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3 h-3" />
            <span>{isFr ? 'Employé' : 'Employee'}</span>
          </button>
        </div>

        {/* User Status / Login Button */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {initials}
              </div>
              <div className="text-left leading-none hidden md:block">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{displayName}</p>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{role}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              title={isFr ? 'Se déconnecter' : 'Sign Out'}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isFr ? 'Connexion' : 'Sign In'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="space-y-2">
      <div 
        onClick={() => {
          if (!user) openAuthModal('login');
        }}
        className={`flex items-center justify-between p-2 rounded-xl transition-all ${
          user ? 'bg-slate-800/80 border border-slate-700/80' : 'bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 cursor-pointer'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
            isAdmin ? 'bg-indigo-600' : 'bg-blue-600'
          }`}>
            {initials}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs text-white font-medium truncate">{displayName}</p>
            <div className="flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                user ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {role} {user ? '' : (isFr ? '(Simulé)' : '(Demo)')}
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              signOut();
            }}
            title={isFr ? 'Se déconnecter' : 'Sign out'}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800"
          >
            {isFr ? 'Connexion' : 'Log In'}
          </button>
        )}
      </div>

      {/* Role Switcher Pill in sidebar */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/50 rounded-lg border border-slate-800 text-[10px]">
        <button
          type="button"
          onClick={() => switchRoleDemo('admin')}
          className={`py-1 rounded font-semibold transition-all ${
            isAdmin ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => switchRoleDemo('employee')}
          className={`py-1 rounded font-semibold transition-all ${
            !isAdmin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isFr ? 'Employé' : 'Employee'}
        </button>
      </div>
    </div>
  );
};
