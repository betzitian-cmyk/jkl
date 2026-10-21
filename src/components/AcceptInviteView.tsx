/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';
import { ApplepAILogo } from './ApplepAILogo';
import { Lock, CheckCircle2, ShieldCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const AcceptInviteView: React.FC<{ token: string; onAccepted?: () => void }> = ({ 
  token, 
  onAccepted 
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const { refreshCurrentUser } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError(lt('Jeton d\'invitation manquant.', 'Invitation token missing.'));
      setIsValidating(false);
      return;
    }

    Storage.validateInviteToken(token)
      .then((res) => {
        if (res.valid) {
          setEmployeeInfo(res.employee);
        } else {
          setError(res.error || lt('Lien d\'invitation invalide ou expiré.', 'Invalid or expired invitation link.'));
        }
      })
      .catch((err) => {
        setError(err.message || lt('Lien d\'invitation invalide.', 'Invalid invitation link.'));
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError(lt('Le mot de passe doit contenir au moins 6 caractères.', 'Password must be at least 6 characters.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(lt('Les mots de passe ne correspondent pas.', 'Passwords do not match.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await Storage.acceptInviteToken(token, password);
      
      if (refreshCurrentUser) {
        await refreshCurrentUser();
      }

      if (onAccepted) {
        onAccepted();
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setError(err.message || lt('Échec du traitement de l\'invitation.', 'Failed to process invitation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {lt('Vérification du lien d\'invitation sécurisé...', 'Validating secure invitation link...')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !employeeInfo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {lt('Invitation Non Valide', 'Invalid Invitation')}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            {error || lt('Ce lien d\'invitation a expiré ou a déjà été utilisé.', 'This invitation link has expired or has already been used.')}
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              <span>{lt('Retour à l\'accueil', 'Return to Login')}</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white space-y-3">
          <div className="flex items-center justify-between">
            <ApplepAILogo size="md" variant="dark" showWordmark={true} name="ApplepAI" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
              {lt('Invitation Ouverte', 'Invite Pending')}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white">
              {lt(`Bienvenue, ${employeeInfo.firstName} !`, `Welcome, ${employeeInfo.firstName}!`)}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lt('Initialisez le mot de passe de votre compte employé pour continuer.', 'Set up your employee portal account password to get started.')}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Position details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{lt('Courriel professionnel :', 'Work Email:')}</span>
              <span className="font-extrabold text-slate-900">{employeeInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{lt('Titre du poste :', 'Position:')}</span>
              <span className="font-extrabold text-slate-900">{employeeInfo.jobTitle || 'Spécialiste'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Créer un mot de passe *', 'Create Account Password *')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Confirmer le mot de passe *', 'Confirm Account Password *')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>{lt('Activation du compte...', 'Activating Account...')}</span>
                </>
              ) : (
                <>
                  <span>{lt('Activer mon compte & Remplir le questionnaire', 'Activate Account & Fill Questionnaire')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
