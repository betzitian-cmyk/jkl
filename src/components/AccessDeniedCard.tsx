import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';
import { ShieldAlert, LogIn, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';

interface AccessDeniedCardProps {
  requiredRole?: 'admin';
  featureName?: string;
  onNavigateAllowed?: () => void;
}

export const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({ 
  requiredRole = 'admin', 
  featureName,
  onNavigateAllowed 
}) => {
  const { role, openAuthModal, switchRoleDemo, user } = useAuth();
  const { language } = useLanguage();
  const isFr = language === 'fr';

  return (
    <div className="flex-grow flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isFr ? 'Accès Restreint' : 'Restricted Access'}
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            {isFr ? 'Autorisation Administrateur Requise' : 'Administrator Authorization Required'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {featureName ? (
              isFr 
                ? `La section "${featureName}" est réservée aux administrateurs RH et gestionnaires de paie certifiés.`
                : `The section "${featureName}" is restricted to certified HR administrators and payroll officers.`
            ) : (
              isFr
                ? 'Cette ressource contient des données financières confidentielles et des paramètres de conformité protégés.'
                : 'This module contains sensitive financial data and protected regulatory configurations.'
            )}
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>{isFr ? 'Votre rôle actuel :' : 'Current Active Role:'}</span>
            <span className="font-bold text-blue-700 capitalize">{role}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{isFr ? 'Rôle exigé :' : 'Required Role:'}</span>
            <span className="font-bold text-indigo-700 capitalize">{requiredRole}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {!user ? (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isFr ? 'Se connecter avec un compte Administrateur' : 'Sign in with Administrator Account'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchRoleDemo('admin')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isFr ? 'Activer le mode Administrateur (Démo)' : 'Switch to Administrator Mode (Demo)'}</span>
            </button>
          )}

          {onNavigateAllowed && (
            <button
              type="button"
              onClick={onNavigateAllowed}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isFr ? 'Retourner à mes Fiches de Paie' : 'Back to My Pay History'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
