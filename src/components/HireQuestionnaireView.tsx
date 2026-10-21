/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HireQuestionnaire, Employee } from '../types';
import { Storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';
import { 
  FileText, 
  User, 
  CreditCard, 
  Building, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Lock, 
  Globe, 
  Sparkles 
} from 'lucide-react';

export const HireQuestionnaireView: React.FC<{ employeeId: string; onComplete?: () => void }> = ({ 
  employeeId,
  onComplete 
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const { refreshCurrentUser, user } = useAuth();
  const [questionnaire, setQuestionnaire] = useState<HireQuestionnaire | null>(null);
  const [formData, setFormData] = useState<Partial<HireQuestionnaire>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    setIsLoading(true);
    Storage.getQuestionnaireByEmployeeId(employeeId)
      .then((data) => {
        setQuestionnaire(data);
        setFormData(data || {});
      })
      .catch((err) => {
        console.error('Failed to load questionnaire', err);
        setErrorMsg(err.message || 'Error loading questionnaire.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionnaire) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Mark Questionnaire as Submitted
      const updatedQuestionnaireData: HireQuestionnaire = {
        ...questionnaire,
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      } as HireQuestionnaire;

      // 2. Map Questionnaire Answers into Profile
      const updatedProfileUpdates: Partial<Employee> = {
        status: 'active',
        isFirstLogin: false,
        personalInfo: {
          sin: formData.socialInsuranceNumber,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: {
            street: formData.streetAddress || '',
            city: formData.city || '',
            province: formData.province || 'QC',
            postalCode: formData.postalCode || ''
          },
          emergencyContact: {
            name: formData.emergencyContactName || '',
            relationship: formData.emergencyContactRelationship || '',
            phone: formData.emergencyContactPhone || ''
          }
        },
        bankingInfo: {
          institution: formData.bankInstitutionNumber || '',
          transit: formData.bankTransitNumber || '',
          account: formData.bankAccountNumber || ''
        },
        taxParameters: {
          td1Claim: formData.federalTD1ClaimAmount || 16452,
          tp1015Claim: formData.quebecTP1015ClaimAmount || 18056,
          additionalDeduction: formData.additionalTaxDeductionPerPay || 0,
          bill96Language: formData.bill96LanguagePreference || 'fr'
        }
      };

      // 3. Submit to backend
      await Storage.submitQuestionnaireAndPopulateProfile(
        questionnaire.id,
        updatedQuestionnaireData,
        updatedProfileUpdates
      );

      setSuccessMsg(
        lt(
          'Questionnaire soumis avec succès ! Votre dossier d\'employé est activé.',
          'Questionnaire submitted successfully! Your employee profile is now active.'
        )
      );

      if (refreshCurrentUser) {
        await refreshCurrentUser();
      }

      if (onComplete) {
        onComplete();
      } else {
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || lt('Erreur lors de la soumission.', 'Failed to submit questionnaire.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-bold text-slate-600">
          {lt('Chargement de votre questionnaire d\'embauche...', 'Loading your hire questionnaire...')}
        </p>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <p className="text-sm font-bold text-red-600">
          {lt('Questionnaire introuvable.', 'Questionnaire record not found.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black border border-blue-200 uppercase tracking-wider">
              {lt('Initialisation du dossier employé', 'Employee Profile Onboarding')}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lt('Sécurisé & Conforme Loi 96', 'Secure & Quebec Compliant')}</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {lt('Questionnaire d\'Embauche & Renseignements Personnels', 'Hire Questionnaire & Personal Information')}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {lt(
              'Veuillez compléter vos informations de paie, coordonnées bancaires et déclarations fiscales pour activer votre accès.',
              'Please complete your payroll setup, banking details, and statutory tax returns to unlock your employee portal.'
            )}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Read-Only Admin Prefilled Baseline */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {lt('Informations de poste (Préremplies par la direction)', 'Position Details (Prefilled by Administrator)')}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs pt-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1">{lt('Nom complet :', 'Name:')}</span>
              <span className="font-extrabold text-slate-800 text-sm">{questionnaire.firstName} {questionnaire.lastName}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1">{lt('Courriel professionnel :', 'Work Email:')}</span>
              <span className="font-extrabold text-slate-800 text-sm truncate block">{questionnaire.workEmail}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{lt('Titre du poste :', 'Job Title:')}</span>
              </span>
              <span className="font-extrabold text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{questionnaire.jobTitle}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{lt('Département :', 'Department:')}</span>
              </span>
              <span className="font-extrabold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{questionnaire.departmentId || 'Administration'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{lt('Salaire de base :', 'Base Salary / Rate:')}</span>
              </span>
              <span className="font-extrabold text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                ${Number(questionnaire.baseRate || 60000).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{lt('Fréquence de paie :', 'Pay Frequency:')}</span>
              </span>
              <span className="font-extrabold text-amber-700 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase">{questionnaire.payFrequency}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Personal Identification & Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <User className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              {lt('1. Identification Personnelle & Adresse Civique', '1. Personal Identification & Home Address')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Numéro d\'assurance sociale (NAS / SIN) *', 'Social Insurance Number (SIN / NAS) *')}
              </label>
              <input
                type="text"
                required
                placeholder="123-456-789"
                value={formData.socialInsuranceNumber || ''}
                onChange={(e) => setFormData({ ...formData, socialInsuranceNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Date de naissance *', 'Date of Birth *')}
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Téléphone personnel *', 'Personal Phone *')}
              </label>
              <input
                type="tel"
                required
                placeholder="(514) 555-0123"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Adresse civique (Rue) *', 'Street Address *')}
              </label>
              <input
                type="text"
                required
                placeholder="1234 Rue Sherbrooke Ouest"
                value={formData.streetAddress || ''}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Ville *', 'City *')}
              </label>
              <input
                type="text"
                required
                placeholder="Montréal"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Code Postal *', 'Postal Code *')}
              </label>
              <input
                type="text"
                required
                placeholder="H3A 1B9"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Direct Deposit Banking Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              {lt('2. Dépôt Direct & Informations Bancaires (CPA 005)', '2. Direct Deposit & Banking Details (CPA Standard 005)')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('N° Institution (3 chiffres) *', 'Institution No. (3 digits) *')}
              </label>
              <input
                type="text"
                maxLength={3}
                required
                placeholder="001"
                value={formData.bankInstitutionNumber || ''}
                onChange={(e) => setFormData({ ...formData, bankInstitutionNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('N° Transit (5 chiffres) *', 'Transit No. (5 digits) *')}
              </label>
              <input
                type="text"
                maxLength={5}
                required
                placeholder="12345"
                value={formData.bankTransitNumber || ''}
                onChange={(e) => setFormData({ ...formData, bankTransitNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('N° Compte bancaire *', 'Account Number *')}
              </label>
              <input
                type="text"
                required
                placeholder="1234567"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Tax Declarations & Quebec Compliance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              {lt('3. Déclarations Fiscales & Conformité Linguistique (Loi 96)', '3. Tax Declarations & Language Preference (Bill 96)')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Langue de communication officielle (Loi 96) *', 'Official Communication Language (Bill 96) *')}
              </label>
              <select
                value={formData.bill96LanguagePreference || 'fr'}
                onChange={(e) => setFormData({ ...formData, bill96LanguagePreference: e.target.value as 'fr' | 'en' })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="fr">Français (Recommandé / Loi 96)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Déduction fiscale supplémentaire souhaitée par paie ($)', 'Additional Tax Deduction Per Pay ($)')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.additionalTaxDeductionPerPay || 0}
                onChange={(e) => setFormData({ ...formData, additionalTaxDeductionPerPay: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Emergency Contact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Phone className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              {lt('4. Contact en cas d\'urgence', '4. Emergency Contact')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Nom du contact *', 'Contact Name *')}
              </label>
              <input
                type="text"
                required
                placeholder="Marie Tremblay"
                value={formData.emergencyContactName || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Lien de parenté *', 'Relationship *')}
              </label>
              <input
                type="text"
                required
                placeholder="Conjoint / Conjointe / Parent"
                value={formData.emergencyContactRelationship || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lt('Téléphone du contact *', 'Emergency Phone *')}
              </label>
              <input
                type="tel"
                required
                placeholder="(514) 555-9876"
                value={formData.emergencyContactPhone || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* STRICT SECURITY CONSTRAINT: NO PERMISSION OR ROLE FIELDS ARE RENDERED HERE */}

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-medium">
            {lt('En soumettant ce formulaire, vous certifiez l\'exactitude de vos renseignements personnels.', 'By submitting this form, you certify the accuracy of your personal information.')}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>{lt('Activation en cours...', 'Activating...')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{lt('Soumettre & Activer mon Dossier', 'Submit & Activate Profile')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
