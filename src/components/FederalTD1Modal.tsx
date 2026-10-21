/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Check, 
  AlertTriangle, 
  Calculator, 
  Info, 
  ShieldCheck, 
  RotateCcw, 
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';

export interface TD1FormData {
  line1_basic: number;
  line2_caregiver_infirm_children: number;
  line3_age: number;
  line4_pension: number;
  line5_tuition: number;
  line6_disability: number;
  line7_spouse: number;
  line8_dependant: number;
  line9_caregiver_spouse_dependant: number;
  line10_caregiver_adult_dependant: number;
  line11_transfer_spouse: number;
  line12_transfer_dependant: number;
  line13_total: number;
  // Page 2
  multiple_employers: boolean;
  total_less_than_claim: boolean;
  non_resident_status: 'Yes' | 'No' | 'N/A';
  zone_deduction: number;
  additional_tax: number;
}

export interface FederalTD1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLine13?: number;
  initialAdditionalTax?: number;
  onApply: (data: {
    line13: number;
    additionalTax: number;
    formData: TD1FormData;
  }) => void;
}

const DEFAULT_LINE1_BASIC = 16452;
const MAX_LINE3_AGE = 9208;
const MAX_LINE4_PENSION = 2000;

export const FederalTD1Modal: React.FC<FederalTD1ModalProps> = ({
  isOpen,
  onClose,
  initialLine13,
  initialAdditionalTax = 0,
  onApply
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  // Form State
  const [line1, setLine1] = useState<number>(initialLine13 !== undefined && initialLine13 > 0 ? initialLine13 : DEFAULT_LINE1_BASIC);
  const [line2, setLine2] = useState<number>(0);
  const [line3, setLine3] = useState<number>(0);
  const [line4, setLine4] = useState<number>(0);
  const [line5, setLine5] = useState<number>(0);
  const [line6, setLine6] = useState<number>(0);
  const [line7, setLine7] = useState<number>(0);
  const [line8, setLine8] = useState<number>(0);
  const [line9, setLine9] = useState<number>(0);
  const [line10, setLine10] = useState<number>(0);
  const [line11, setLine11] = useState<number>(0);
  const [line12, setLine12] = useState<number>(0);

  // Page 2 Declarations & Additional deductions
  const [multipleEmployers, setMultipleEmployers] = useState<boolean>(false);
  const [totalLess, setTotalLess] = useState<boolean>(false);
  const [nonResident, setNonResident] = useState<'Yes' | 'No' | 'N/A'>('N/A');
  const [zoneDeduction, setZoneDeduction] = useState<number>(0);
  const [additionalTax, setAdditionalTax] = useState<number>(initialAdditionalTax || 0);

  // Warnings for capped values
  const [showAgeWarning, setShowAgeWarning] = useState<boolean>(false);
  const [showPensionWarning, setShowPensionWarning] = useState<boolean>(false);

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen && initialLine13 !== undefined && initialLine13 > 0) {
      if (initialLine13 === DEFAULT_LINE1_BASIC) {
        setLine1(DEFAULT_LINE1_BASIC);
      }
    }
  }, [isOpen, initialLine13]);

  // Handle constrained inputs
  const handleLine3Change = (val: number) => {
    if (val > MAX_LINE3_AGE) {
      setLine3(MAX_LINE3_AGE);
      setShowAgeWarning(true);
    } else {
      setLine3(Math.max(0, val));
      setShowAgeWarning(false);
    }
  };

  const handleLine4Change = (val: number) => {
    if (val > MAX_LINE4_PENSION) {
      setLine4(MAX_LINE4_PENSION);
      setShowPensionWarning(true);
    } else {
      setLine4(Math.max(0, val));
      setShowPensionWarning(false);
    }
  };

  // Line 13 calculation
  const calculatedLine13 = useMemo(() => {
    if (multipleEmployers) {
      return 0;
    }
    const sum = (Number(line1) || 0) +
      (Number(line2) || 0) +
      (Number(line3) || 0) +
      (Number(line4) || 0) +
      (Number(line5) || 0) +
      (Number(line6) || 0) +
      (Number(line7) || 0) +
      (Number(line8) || 0) +
      (Number(line9) || 0) +
      (Number(line10) || 0) +
      (Number(line11) || 0) +
      (Number(line12) || 0);
    return Math.max(0, sum);
  }, [line1, line2, line3, line4, line5, line6, line7, line8, line9, line10, line11, line12, multipleEmployers]);

  const handleReset = () => {
    setLine1(DEFAULT_LINE1_BASIC);
    setLine2(0);
    setLine3(0);
    setLine4(0);
    setLine5(0);
    setLine6(0);
    setLine7(0);
    setLine8(0);
    setLine9(0);
    setLine10(0);
    setLine11(0);
    setLine12(0);
    setMultipleEmployers(false);
    setTotalLess(false);
    setNonResident('N/A');
    setZoneDeduction(0);
    setAdditionalTax(0);
    setShowAgeWarning(false);
    setShowPensionWarning(false);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TD1FormData = {
      line1_basic: line1,
      line2_caregiver_infirm_children: line2,
      line3_age: line3,
      line4_pension: line4,
      line5_tuition: line5,
      line6_disability: line6,
      line7_spouse: line7,
      line8_dependant: line8,
      line9_caregiver_spouse_dependant: line9,
      line10_caregiver_adult_dependant: line10,
      line11_transfer_spouse: line11,
      line12_transfer_dependant: line12,
      line13_total: calculatedLine13,
      multiple_employers: multipleEmployers,
      total_less_than_claim: totalLess,
      non_resident_status: nonResident,
      zone_deduction: zoneDeduction,
      additional_tax: additionalTax
    };

    onApply({
      line13: calculatedLine13,
      additionalTax: Number(additionalTax) || 0,
      formData: payload
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isFr ? 'Déclaration des crédits d\'impôt personnels fédéraux 2026 (TD1)' : '2026 Personal Tax Credits Return (TD1) - Webform'}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30">
                    CRA / ARC 2026
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {isFr 
                    ? 'Remplissez le formulaire ci-dessous pour calculer votre montant total de la Ligne 13 et le transmettre au profil.'
                    : 'Fill out the webform to calculate your Total Claim Amount (Line 13) and transfer it directly to your onboarding profile.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/templates/td1-2026-webform.html"
                target="_blank"
                rel="noreferrer"
                title={isFr ? 'Ouvrir le gabarit HTML autonome' : 'Open standalone HTML source'}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">HTML Standalone</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content - 2 Column Layout (Form on Left, Master Summary on Right) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <form onSubmit={handleApply} id="td1-react-form">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Source Form Inputs */}
                <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* Section Title */}
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      {isFr ? 'Montants des crédits d\'impôt (Lignes 1 à 12)' : 'Tax Credit Amounts (Lines 1 to 12)'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isFr ? 'Inscrivez les montants admissibles pour l\'année d\'imposition 2026.' : 'Enter all qualifying amounts for tax year 2026.'}
                    </p>
                  </div>

                  {/* Lines 1 to 12 */}
                  <div className="space-y-3.5">
                    {/* Line 1 */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="flex justify-between items-start mb-1">
                        <label className="text-xs font-semibold text-slate-800">
                          1. {isFr ? 'Montant personnel de base' : 'Basic personal amount'} <span className="text-blue-600">*</span>
                        </label>
                        <span className="text-[11px] font-medium text-slate-500">
                          {isFr ? 'Montant standard : 16 452 $' : 'Standard: $16,452'}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line1}
                          onChange={(e) => setLine1(parseFloat(e.target.value) || 0)}
                          required
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 2 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2. {isFr ? 'Montant canadien pour aidants naturels pour enfants à charge âgés de moins de 18 ans ayant une déficience' : 'Canada caregiver amount for infirm children under age 18'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line2}
                          onChange={(e) => setLine2(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 3 (Capped at 9,208) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          3. {isFr ? 'Montant en raison de l\'âge (si 65 ans ou plus au 31 déc. 2026)' : 'Age amount (if 65 or older on Dec 31, 2026)'}
                        </label>
                        <span className="text-[10px] text-slate-400">{isFr ? 'Max 9 208 $' : 'Max $9,208'}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line3}
                          onChange={(e) => handleLine3Change(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      {showAgeWarning && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 flex items-center gap-1 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          {isFr ? 'Valeur plafonnée au montant maximum admissible de 9 208 $.' : 'Value capped at maximum allowable $9,208.'}
                        </p>
                      )}
                    </div>

                    {/* Line 4 (Capped at 2,000) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          4. {isFr ? 'Montant pour revenu de pension' : 'Pension income amount'}
                        </label>
                        <span className="text-[10px] text-slate-400">{isFr ? 'Max 2 000 $' : 'Max $2,000'}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line4}
                          onChange={(e) => handleLine4Change(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      {showPensionWarning && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 flex items-center gap-1 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          {isFr ? 'Valeur plafonnée au montant maximum admissible de 2 000 $.' : 'Value capped at maximum allowable $2,000.'}
                        </p>
                      )}
                    </div>

                    {/* Line 5 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        5. {isFr ? 'Frais de scolarité (temps plein et temps partiel)' : 'Tuition (full-time and part-time)'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line5}
                          onChange={(e) => setLine5(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 6 */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          6. {isFr ? 'Montant pour personnes handicapées' : 'Disability amount'}
                        </label>
                        <span className="text-[10px] text-slate-400">{isFr ? 'T2201 : 10 341 $' : 'Enter $10,341 if using Form T2201'}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line6}
                          onChange={(e) => setLine6(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 7 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        7. {isFr ? 'Montant pour époux ou conjoint de fait' : 'Spouse or common-law partner amount'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line7}
                          onChange={(e) => setLine7(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 8 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        8. {isFr ? 'Montant pour une personne à charge admissible' : 'Amount for an eligible dependant'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line8}
                          onChange={(e) => setLine8(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 9 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        9. {isFr ? 'Montant canadien pour aidants naturels pour personne à charge admissible ou époux' : 'Canada caregiver amount for eligible dependant or spouse'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line9}
                          onChange={(e) => setLine9(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 10 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        10. {isFr ? 'Montant canadien pour aidants naturels pour personne(s) à charge âgée(s) de 18 ans ou plus' : 'Canada caregiver amount for dependant(s) age 18 or older'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line10}
                          onChange={(e) => setLine10(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 11 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        11. {isFr ? 'Montants transférés de votre époux ou conjoint de fait' : 'Amounts transferred from your spouse or common-law partner'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line11}
                          onChange={(e) => setLine11(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 12 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        12. {isFr ? 'Montants transférés d\'une personne à charge' : 'Amounts transferred from a dependant'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={line12}
                          onChange={(e) => setLine12(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Line 13 TOTAL (Highlight) */}
                    <div className="p-3.5 bg-blue-50 border-2 border-blue-500 rounded-xl mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-blue-900">
                          13. {isFr ? 'MONTANT TOTAL DE LA DEMANDE (Lignes 1 à 12)' : 'TOTAL CLAIM AMOUNT (Lines 1 to 12)'}
                        </label>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {isFr ? 'Calcul automatique' : 'Auto-calculated'}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-700 font-bold text-base">$</span>
                        <input
                          type="number"
                          readOnly
                          value={calculatedLine13}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-blue-300 rounded-lg text-lg font-extrabold text-blue-900 shadow-inner focus:outline-none"
                        />
                      </div>
                      {multipleEmployers && (
                        <p className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg mt-2 border border-amber-300 font-medium">
                          {isFr 
                            ? '⚠️ Remarque ARC : Vous avez plus d\'un employeur. Vous ne pouvez pas demander les crédits d\'impôt deux fois. La ligne 13 est fixée à 0 $.'
                            : '⚠️ CRA Rule: More than one employer selected. You cannot claim credits with both employers — Line 13 is set to $0.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Page 2 Declarations */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      {isFr ? 'Page 2 : Déclarations & Déductions Supplémentaires' : 'Page 2: Declarations & Additional Deductions'}
                    </h4>

                    {/* Multiple employers checkbox */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="td1_multiple_employers"
                        checked={multipleEmployers}
                        onChange={(e) => setMultipleEmployers(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="td1_multiple_employers" className="text-xs text-slate-700 cursor-pointer select-none">
                        <strong className="block text-slate-900 mb-0.5">
                          {isFr ? 'Plus d\'un employeur ou payeur en même temps' : 'More than one employer or payer at the same time'}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {isFr ? 'Cochez si vous avez déjà réclamé le montant de base auprès d\'un autre employeur (fixe la ligne 13 à 0 $).' : 'Check if you have already claimed the basic personal amount with another employer (forces Line 13 to $0).'}
                        </span>
                      </label>
                    </div>

                    {/* Total less than claim checkbox */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="td1_total_less"
                        checked={totalLess}
                        onChange={(e) => setTotalLess(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor="td1_total_less" className="text-xs text-slate-700 cursor-pointer select-none">
                        <strong className="block text-slate-900 mb-0.5">
                          {isFr ? 'Revenu total inférieur au montant total de la demande' : 'Total income is less than the total claim amount'}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {isFr ? 'Si votre revenu total pour l\'année sera inférieur à la ligne 13, aucun impôt ne sera retenu.' : 'No tax will be deducted if your estimated earnings for the full year are lower than Line 13.'}
                        </span>
                      </label>
                    </div>

                    {/* Non-resident status */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <label className="block text-xs font-semibold text-slate-800">
                        {isFr ? 'Non-résidents uniquement (90 % ou plus du revenu mondial au Canada ?)' : 'For non-residents only (90% or more of world income in Canada?)'}
                      </label>
                      <div className="flex items-center gap-5 text-xs text-slate-700">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="non_resident_status"
                            value="Yes"
                            checked={nonResident === 'Yes'}
                            onChange={() => setNonResident('Yes')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {isFr ? 'Oui' : 'Yes'}
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="non_resident_status"
                            value="No"
                            checked={nonResident === 'No'}
                            onChange={() => setNonResident('No')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {isFr ? 'Non' : 'No'}
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="non_resident_status"
                            value="N/A"
                            checked={nonResident === 'N/A'}
                            onChange={() => setNonResident('N/A')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          N/A ({isFr ? 'Résident canadien' : 'Canadian resident'})
                        </label>
                      </div>
                    </div>

                    {/* Zone deduction and Additional tax */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isFr ? 'Déduction pour zone visée par règlement' : 'Deduction for living in a prescribed zone'}
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            value={zoneDeduction}
                            onChange={(e) => setZoneDeduction(parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isFr ? 'Impôt supplémentaire à retenir par paie' : 'Additional tax to be deducted per pay cheque'}
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            value={additionalTax}
                            onChange={(e) => setAdditionalTax(parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Master Form Data Record */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-white p-5 rounded-xl border-2 border-blue-600 shadow-md">
                    <div className="flex items-center gap-2 border-b border-blue-100 pb-3 mb-4">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {isFr ? 'Dossier Maître TD1 (Master Record)' : 'Master Form Data Record'}
                      </h4>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* Total claim amount Line 13 */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                          {isFr ? 'Montant total de la demande (Ligne 13)' : 'Total Claim Amount (Line 13)'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-blue-700">
                            ${calculatedLine13.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {isFr 
                            ? 'Ce montant sera injecté dans le champ « Ligne 13 » du profil d\'intégration.'
                            : 'This amount will be directly injected into the Line 13 field of your onboarding profile.'}
                        </p>
                      </div>

                      {/* Multiple employers */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isFr ? 'Employeurs multiples / payeurs :' : 'Multiple Employers / Payers:'}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${multipleEmployers ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                          {multipleEmployers ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}
                        </span>
                      </div>

                      {/* Total less */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isFr ? 'Revenu inférieur à la demande :' : 'Income less than Claim Amount:'}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${totalLess ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {totalLess ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}
                        </span>
                      </div>

                      {/* Non resident */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isFr ? 'Statut non-résident (90%+ revenu) :' : 'Non-Resident Status (90%+ income):'}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {nonResident}
                        </span>
                      </div>

                      {/* Zone deduction */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isFr ? 'Déduction zone visée :' : 'Prescribed Zone Deduction:'}
                        </span>
                        <span className="font-bold text-slate-900">
                          ${Number(zoneDeduction || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Additional tax */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isFr ? 'Impôt additionnel retenu :' : 'Additional Tax Deducted:'}
                        </span>
                        <span className="font-bold text-slate-900">
                          ${Number(additionalTax || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Primary Apply Button */}
                    <div className="mt-5 space-y-2">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isFr ? 'Appliquer la Ligne 13 au profil' : 'Submit & Apply Line 13 to Onboarding'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleReset}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isFr ? 'Réinitialiser aux valeurs standards' : 'Reset to Standard Amounts'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Informational Guidance Box */}
                  <div className="p-4 bg-slate-100/90 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{isFr ? 'Pourquoi remplir le formulaire TD1 ?' : 'Why fill out Form TD1?'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {isFr 
                        ? 'Le formulaire fédéral TD1 détermine le montant d\'impôt sur le revenu que votre employeur retiendra sur chacune de vos paies. Réclamer les crédits auxquels vous avez droit évite de payer un surplus d\'impôt à la source.'
                        : 'The federal TD1 form informs your employer how much income tax to withhold from your pay cheques. Claiming the personal tax credits you are eligible for ensures you do not overpay taxes during the year.'}
                    </p>
                  </div>
                </div>

              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isFr ? 'Montant de base 2026 : 16 452 $ | Conformité ARC' : '2026 Baseline Amount: $16,452 | CRA Compliant'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-700 hover:bg-slate-200 font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isFr ? 'Fermer sans appliquer' : 'Cancel'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
