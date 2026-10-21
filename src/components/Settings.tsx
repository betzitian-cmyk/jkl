/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { 
  Building2, 
  Landmark, 
  Globe, 
  ShieldCheck, 
  Loader2, 
  FileText, 
  CreditCard, 
  Briefcase, 
  Percent, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Server,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { Storage } from '../lib/storage';
import { CompanySettings, PayFrequency } from '../types';
import { ApplepAILogo } from './ApplepAILogo';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const isFr = language === 'fr';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('ApplepAI Inc.');
  const [tradeName, setTradeName] = useState('ApplepAI');
  const [address, setAddress] = useState('1000 Rue de la Gauchetière Ouest, Suite 2400');
  const [city, setCity] = useState('Montréal');
  const [province, setProvince] = useState('QC');
  const [postalCode, setPostalCode] = useState('H3B 4W5');
  const [phone, setPhone] = useState('514-555-0199');
  const [email, setEmail] = useState('contact@applepai.com');

  // Tax IDs (PDF Section 2)
  const [federalId, setFederalId] = useState('123456789 RP 0001');
  const [neq, setNeq] = useState('1178901234');
  const [revenuQuebecId, setRevenuQuebecId] = useState('1234567890 RS 0001');
  const [cnesstNumber, setCnesstNumber] = useState('987654321-001');

  // Statutory Fringe Taxes (PDF Section 4)
  const [hsfRateModifier, setHsfRateModifier] = useState<number>(1.65);
  const [hsfSector, setHsfSector] = useState<'primary_manufacturing' | 'services_other' | 'large_enterprise'>('services_other');
  const [cnesstRate, setCnesstRate] = useState<number>(1.85);
  const [cnesstRiskCode, setCnesstRiskCode] = useState<string>('69990');
  const [wsdrfApplicable, setWsdrfApplicable] = useState<boolean>(false);
  const [estimatedAnnualPayroll, setEstimatedAnnualPayroll] = useState<number>(750000);

  // CPA Standard 005 Direct Deposit Configuration (PDF Section 5)
  const [cpaOriginatorId, setCpaOriginatorId] = useState<string>('0001234567');
  const [cpaDataCenter, setCpaDataCenter] = useState<string>('00100');
  const [cpaFormat, setCpaFormat] = useState<'1464_byte' | '80_byte'>('1464_byte');
  const [disbursingBankName, setDisbursingBankName] = useState<string>('Mouvement Desjardins');
  const [disbursingInstitution, setDisbursingInstitution] = useState<string>('815');
  const [disbursingTransit, setDisbursingTransit] = useState<string>('00012');
  const [disbursingAccount, setDisbursingAccount] = useState<string>('1234567');

  // Record of Employment (ROE) API (PDF Section 5)
  const [roeContactName, setRoeContactName] = useState<string>('Marie Tremblay');
  const [roeContactPhone, setRoeContactPhone] = useState<string>('514-555-0199 poste 204');
  const [roeContactEmail, setRoeContactEmail] = useState<string>('rh@monentreprise.qc.ca');
  const [roeWebApiKey, setRoeWebApiKey] = useState<string>('BLK-PROD-QC-2026-9901');

  // System Defaults
  const [defaultFrequency, setDefaultFrequency] = useState<PayFrequency>('bi-weekly');
  const [defaultProvince, setDefaultProvince] = useState<string>('QC');

  useEffect(() => {
    const loadSettings = async () => {
      const settings: CompanySettings | null = await Storage.getSettings();
      if (settings) {
        if (settings.companyName) setCompanyName(settings.companyName);
        if (settings.tradeName) setTradeName(settings.tradeName);
        if (settings.address) setAddress(settings.address);
        if (settings.city) setCity(settings.city);
        if (settings.province) setProvince(settings.province);
        if (settings.postalCode) setPostalCode(settings.postalCode);
        if (settings.phone) setPhone(settings.phone);
        if (settings.email) setEmail(settings.email);

        if (settings.federalId) setFederalId(settings.federalId);
        if (settings.neq) setNeq(settings.neq);
        if (settings.revenuQuebecId) setRevenuQuebecId(settings.revenuQuebecId);
        if (settings.cnesstNumber) setCnesstNumber(settings.cnesstNumber);

        if (settings.hsfRateModifier !== undefined) setHsfRateModifier(Number(settings.hsfRateModifier));
        if (settings.hsfSector) setHsfSector(settings.hsfSector);
        if (settings.cnesstRate !== undefined) setCnesstRate(Number(settings.cnesstRate));
        if (settings.cnesstRiskCode) setCnesstRiskCode(settings.cnesstRiskCode);
        if (settings.wsdrfApplicable !== undefined) setWsdrfApplicable(Boolean(settings.wsdrfApplicable));
        if (settings.estimatedAnnualPayroll !== undefined) setEstimatedAnnualPayroll(Number(settings.estimatedAnnualPayroll));

        if (settings.cpaOriginatorId) setCpaOriginatorId(settings.cpaOriginatorId);
        if (settings.cpaDataCenter) setCpaDataCenter(settings.cpaDataCenter);
        if (settings.cpaFormat) setCpaFormat(settings.cpaFormat);
        if (settings.disbursingBankName) setDisbursingBankName(settings.disbursingBankName);
        if (settings.disbursingInstitution) setDisbursingInstitution(settings.disbursingInstitution);
        if (settings.disbursingTransit) setDisbursingTransit(settings.disbursingTransit);
        if (settings.disbursingAccount) setDisbursingAccount(settings.disbursingAccount);

        if (settings.roeContactName) setRoeContactName(settings.roeContactName);
        if (settings.roeContactPhone) setRoeContactPhone(settings.roeContactPhone);
        if (settings.roeContactEmail) setRoeContactEmail(settings.roeContactEmail);
        if (settings.roeWebApiKey) setRoeWebApiKey(settings.roeWebApiKey);

        if (settings.defaultFrequency) setDefaultFrequency(settings.defaultFrequency);
        if (settings.defaultProvince) setDefaultProvince(settings.defaultProvince);
        if (settings.language && settings.language !== language) {
          setLanguage(settings.language);
        }
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await Storage.saveSettings({
        companyName,
        tradeName,
        address,
        city,
        province,
        postalCode,
        phone,
        email,
        federalId,
        neq,
        revenuQuebecId,
        cnesstNumber,
        hsfRateModifier,
        hsfSector,
        cnesstRate,
        cnesstRiskCode,
        wsdrfApplicable: estimatedAnnualPayroll > 2000000 || wsdrfApplicable,
        estimatedAnnualPayroll,
        cpaOriginatorId,
        cpaDataCenter,
        cpaFormat,
        disbursingBankName,
        disbursingInstitution,
        disbursingTransit,
        disbursingAccount,
        roeContactName,
        roeContactPhone,
        roeContactEmail,
        roeWebApiKey,
        defaultFrequency,
        defaultProvince,
        language
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  // Automatically check WSDRF applicability based on payroll
  const isWsdrfMandatory = estimatedAnnualPayroll > 2000000;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner: Architecture & Dual-Tax Scope */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isFr 
                    ? 'Architecture de Paie Québec & Canada — Paramètres de Conformité' 
                    : 'Quebec & Canadian Payroll Software Architecture — Compliance Scope'}
                </h2>
                <p className="text-xs text-slate-300">
                  {isFr 
                    ? 'Double infrastructure fiscale : Agence du revenu du Canada (ARC) & Revenu Québec (RQ)' 
                    : 'Dual-tax infrastructure interfacing cleanly with the CRA and Revenu Québec (RQ)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isFr ? 'Moteur Fiscal Actif 2026' : 'Tax Engine Active 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">
              {isFr ? 'Tous les paramètres de paie et identifiants fiscaux ont été enregistrés avec succès !' : 'All payroll settings and statutory tax identifiers saved successfully!'}
            </span>
          </div>
        </motion.div>
      )}

      {/* 1. General Company Profile */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('company_settings')}</h3>
              <p className="text-xs text-gray-500">{isFr ? 'Raison sociale légale et adresse de correspondance' : 'Legal business entity profile and address'}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
            {isFr ? 'Section 1' : 'Section 1'}
          </span>
        </div>

        {/* Brand & Logo Preview */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <ApplepAILogo size="lg" variant="light" name={companyName.replace(/ Inc\.?$/i, '') || 'ApplepAI'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{companyName}</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {isFr ? 'Logo Actif' : 'Active Logo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFr 
                  ? 'Générateur de marque propulsé par ApplepAI avec logo vectoriel et mention "Powered by"' 
                  : 'Brand identity powered by ApplepAI with vector neural logo and "Powered by" badge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Badge:</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              Powered by ApplepAI
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('company_name')} <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)}
              placeholder="ex: Entreprise ABC Inc."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('trade_name')}</label>
            <input 
              type="text" 
              value={tradeName} 
              onChange={e => setTradeName(e.target.value)}
              placeholder="ex: ABC Solutions"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" 
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('street_address')}</label>
            <input 
              type="text" 
              value={address} 
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Rue Principale"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('city')}</label>
            <input 
              type="text" 
              value={city} 
              onChange={e => setCity(e.target.value)}
              placeholder="Montréal"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('province')}</label>
            <select 
              value={province} 
              onChange={e => setProvince(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            >
              <option value="QC">Québec (QC)</option>
              <option value="ON">Ontario (ON)</option>
              <option value="BC">Colombie-Britannique (BC)</option>
              <option value="AB">Alberta (AB)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('postal_code')}</label>
            <input 
              type="text" 
              value={postalCode} 
              onChange={e => setPostalCode(e.target.value)}
              placeholder="H1A 1A1"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{isFr ? 'Téléphone officiel' : 'Phone number'}</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="514-555-0100"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{isFr ? 'Courriel du service de paie / RH' : 'Payroll / HR email'}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="paie@entreprise.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>
      </section>

      {/* 2. Statutory Fiscal Identification Numbers (PDF Section 2) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('fiscal_info')}</h3>
              <p className="text-xs text-gray-500">
                {isFr ? 'Identifiants obligatoires ARC, Revenu Québec, REQ et CNESST' : 'CRA, Revenu Québec, REQ and CNESST regulatory registration numbers'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
            {isFr ? 'Section 2' : 'Section 2'}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Federal BN */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                {t('federal_id')}
              </label>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">ARC / CRA</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isFr ? 'Numéro à 9 chiffres attribué par l\'ARC, suivi de RP0001 (ex: 123456789RP0001).' : '9-digit registration number assigned by the CRA (e.g., 123456789RP0001).'}
            </p>
            <input 
              type="text" 
              value={federalId} 
              onChange={e => setFederalId(e.target.value)}
              placeholder="123456789 RP 0001"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>

          {/* RQ Identification Number */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                {t('revenu_quebec_id')}
              </label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Revenu Québec</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isFr ? 'Numéro à 10 chiffres suivi d\'un identifiant de dossier à 4 caractères (ex: 1234567890RS0001).' : '10-digit number followed by a 4-digit file identifier (e.g., 1234567890RS0001).'}
            </p>
            <input 
              type="text" 
              value={revenuQuebecId} 
              onChange={e => setRevenuQuebecId(e.target.value)}
              placeholder="1234567890 RS 0001"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>

          {/* NEQ */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                {t('ne_number')}
              </label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">REQ</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isFr ? 'Identifiant légal à 10 chiffres délivré par le Registraire des entreprises du Québec.' : '10-digit legal identifier issued by the Registraire des entreprises.'}
            </p>
            <input 
              type="text" 
              value={neq} 
              onChange={e => setNeq(e.target.value)}
              placeholder="1178901234"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>

          {/* CNESST Account ID */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                {t('cnesst_account')}
              </label>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">CNESST</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isFr ? 'Code unique pour la déclaration et l\'assurance de santé et sécurité du travail.' : 'Unique code for handling worker\'s compensation insurance reporting.'}
            </p>
            <input 
              type="text" 
              value={cnesstNumber} 
              onChange={e => setCnesstNumber(e.target.value)}
              placeholder="987654321-001"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
        </div>
      </section>

      {/* 3. Statutory Employer Contributions & Fringe Taxes (PDF Section 4) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('fringe_taxes_title')}</h3>
              <p className="text-xs text-gray-500">
                {isFr ? 'Charges patronales opérationnelles payées directement par l\'employeur (non retenues sur l\'employé)' : 'Employer-side operational tax liabilities calculated per pay run'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            {isFr ? 'Section 4' : 'Section 4'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Health Services Fund (HSF / FSS) */}
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-xl border border-amber-200/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" />
                  {t('hsf_settings')}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isFr 
                    ? 'Calculé en pourcentage variable de la masse salariale brute totale. Ajustement automatique selon le palier de la société.' 
                    : 'Calculated as a variable percentage of total gross payroll. Automatically tracks annual payroll brackets.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{t('hsf_rate')}:</span>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-amber-300 font-mono font-bold text-amber-900">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1.0" 
                    max="5.0"
                    value={hsfRateModifier} 
                    onChange={e => setHsfRateModifier(parseFloat(e.target.value) || 1.65)}
                    className="w-16 outline-none bg-transparent text-right"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{t('hsf_sector')}</label>
                <select 
                  value={hsfSector}
                  onChange={e => {
                    const sector = e.target.value as any;
                    setHsfSector(sector);
                    if (sector === 'primary_manufacturing') setHsfRateModifier(1.25);
                    else if (sector === 'services_other') setHsfRateModifier(1.65);
                    else setHsfRateModifier(4.26);
                  }}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="primary_manufacturing">{isFr ? 'Secteur primaire & manufacturier (Taux réduit: 1.25% - 4.26%)' : 'Primary & Manufacturing Sector (Reduced rate: 1.25% - 4.26%)'}</option>
                  <option value="services_other">{isFr ? 'Autres secteurs / Services & Commerce (Taux standard: 1.65% - 4.26%)' : 'Other Sectors / Services (Standard rate: 1.65% - 4.26%)'}</option>
                  <option value="large_enterprise">{isFr ? 'Grande entreprise (> 7,5 M$ masse salariale : Taux fixe 4.26%)' : 'Large Enterprise (> $7.5M payroll: Flat 4.26%)'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{t('estimated_annual_payroll')}</label>
                <input 
                  type="number"
                  step="10000"
                  value={estimatedAnnualPayroll}
                  onChange={e => setEstimatedAnnualPayroll(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* CNESST & Labour Standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t('cnesst_settings')}</h4>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-900 text-xs">
                  <input 
                    type="number" 
                    step="0.05" 
                    value={cnesstRate} 
                    onChange={e => setCnesstRate(parseFloat(e.target.value) || 1.85)}
                    className="w-14 outline-none bg-transparent text-right"
                  />
                  <span>%</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                {isFr ? 'Taux combiné couvrant les normes du travail et la santé/sécurité. Varie selon le code de risque sectoriel.' : 'Combined rate covering labor standards and occupational health/safety.'}
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{t('cnesst_risk_code')}</label>
                <input 
                  type="text" 
                  value={cnesstRiskCode} 
                  onChange={e => setCnesstRiskCode(e.target.value)}
                  placeholder="69990"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-mono" 
                />
              </div>
            </div>

            {/* WSDRF / FDRCMT (1% Training Law) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t('wsdrf_title')}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  isWsdrfMandatory 
                    ? 'bg-red-50 text-red-700 border-red-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {isWsdrfMandatory ? (isFr ? 'Masse > 2 M$ (Assujetti)' : '> $2M (Subject)') : (isFr ? 'Exempté (< 2 M$)' : 'Exempt (< $2M)')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {t('wsdrf_desc')}
              </p>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={isWsdrfMandatory || wsdrfApplicable}
                  onChange={e => setWsdrfApplicable(e.target.checked)}
                  disabled={isWsdrfMandatory}
                  className="w-4 h-4 text-blue-600 rounded" 
                />
                <span className="text-xs font-medium text-slate-700">
                  {isFr ? 'Activer le suivi comptable de 1% pour la formation' : 'Enable mandatory 1% training expenditure tracking'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Critical Technical Outputs & Integrations (PDF Section 5) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{isFr ? 'Intégrations Techniques & Protocoles Bancaires' : 'Technical Outputs & Banking Integrations'}</h3>
              <p className="text-xs text-gray-500">
                {isFr ? 'Norme CPA 005 (Paiements Canada) et API Relevé d\'Emploi (ROE)' : 'CPA Standard 005 direct deposit file specs and Service Canada ROE web API'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            {isFr ? 'Section 5' : 'Section 5'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* CPA Standard 005 Direct Deposit Configuration */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t('cpa_title')}</h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                1464-byte / 80-byte flat text
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {isFr 
                ? 'Génération de fichiers de dépôt direct normalisés pour le télévirement bancaire canadien (Association canadienne des paiements).' 
                : 'Direct deposit pipelines generating Canadian Payments Association (Payments Canada) flat text transmission files.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('cpa_originator_id')}</label>
                <input 
                  type="text" 
                  value={cpaOriginatorId} 
                  onChange={e => setCpaOriginatorId(e.target.value)}
                  placeholder="0001234567"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('cpa_datacenter')}</label>
                <input 
                  type="text" 
                  value={cpaDataCenter} 
                  onChange={e => setCpaDataCenter(e.target.value)}
                  placeholder="00100"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('cpa_format')}</label>
                <select 
                  value={cpaFormat} 
                  onChange={e => setCpaFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="1464_byte">{isFr ? 'Format standard 1464 octets (CPA 005)' : 'Standard 1464-byte format'}</option>
                  <option value="80_byte">{isFr ? 'Format condensé 80 octets' : '80-byte flat text format'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{isFr ? 'Nom de la banque payeuse' : 'Disbursing Bank'}</label>
                <input 
                  type="text" 
                  value={disbursingBankName} 
                  onChange={e => setDisbursingBankName(e.target.value)}
                  placeholder="Desjardins / RBC"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('disbursing_institution')}</label>
                <input 
                  type="text" 
                  value={disbursingInstitution} 
                  onChange={e => setDisbursingInstitution(e.target.value)}
                  placeholder="815"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('disbursing_transit')}</label>
                <input 
                  type="text" 
                  value={disbursingTransit} 
                  onChange={e => setDisbursingTransit(e.target.value)}
                  placeholder="00012"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" 
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('disbursing_account')}</label>
                <input 
                  type="text" 
                  value={disbursingAccount} 
                  onChange={e => setDisbursingAccount(e.target.value)}
                  placeholder="1234567"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Record of Employment (ROE) Service Canada Web API */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t('roe_title')}</h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Service Canada BLK Layout
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {isFr 
                ? 'Coordonnées de l\'agent responsable pour la transmission électronique des relevés d\'emploi (ROE Web).' 
                : 'Electronic compilation (BLK layout strings) allowing HR to push employment termination logs directly to Service Canada.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('roe_contact_name')}</label>
                <input 
                  type="text" 
                  value={roeContactName} 
                  onChange={e => setRoeContactName(e.target.value)}
                  placeholder="Nom du responsable"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('roe_contact_phone')}</label>
                <input 
                  type="text" 
                  value={roeContactPhone} 
                  onChange={e => setRoeContactPhone(e.target.value)}
                  placeholder="514-555-0199 p. 200"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase">{t('roe_contact_email')}</label>
                <input 
                  type="email" 
                  value={roeContactEmail} 
                  onChange={e => setRoeContactEmail(e.target.value)}
                  placeholder="rh@entreprise.com"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. System Defaults & Bill 96 Language Settings */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('language_settings')}</h3>
              <p className="text-xs text-gray-500">
                {isFr ? 'Langue d\'interface et conformité à la Charte de la langue française (Loi 96)' : 'Interface language and compliance with Charter of the French Language (Bill 96)'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            {isFr ? 'Loi 96' : 'Bill 96'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('payroll_frequency_default')}</label>
              <select 
                value={defaultFrequency}
                onChange={e => setDefaultFrequency(e.target.value as PayFrequency)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">{t('weekly')}</option>
                <option value="bi-weekly">{t('bi_weekly')}</option>
                <option value="semi-monthly">{t('semi_monthly')}</option>
                <option value="monthly">{t('monthly')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('province_of_employment_label')}</label>
              <select 
                value={defaultProvince}
                onChange={e => setDefaultProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="QC">Québec (QC) — Double infrastructure ARC / RQ (RRQ, RQAP, FSS)</option>
                <option value="ON">Ontario (ON) — Régime Fédéral ARC (RPC / AE)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-3">
              {t('language_preference_label')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setLanguage('fr')}
                className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                  language === 'fr' 
                    ? 'border-blue-600 bg-blue-50/80 shadow-md text-blue-900' 
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <span className="text-2xl">⚜️</span>
                <span className="text-xs font-bold uppercase tracking-wider">Français (Québec)</span>
                <span className="text-[10px] text-gray-500">Conforme Charte de la langue française</span>
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                  language === 'en' 
                    ? 'border-blue-600 bg-blue-50/80 shadow-md text-blue-900' 
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <span className="text-2xl">🇨🇦</span>
                <span className="text-xs font-bold uppercase tracking-wider">English (Canada)</span>
                <span className="text-[10px] text-gray-500">Official Canadian Bilingual Standard</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Save Action Bar */}
      <div className="sticky bottom-6 z-20 flex justify-between items-center bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/60 text-white">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300">
            {isFr ? 'Paramètres synchronisés avec le moteur de calcul 2026' : 'Settings synchronized with 2026 calculation engine'}
          </span>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {isFr ? 'Enregistrer tous les paramètres' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};
