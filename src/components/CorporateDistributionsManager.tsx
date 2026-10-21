/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { 
  Building2, 
  Coins, 
  PieChart, 
  FileText, 
  Sparkles, 
  Scale, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Percent, 
  AlertTriangle,
  Award,
  Wallet,
  TrendingUp,
  Receipt,
  Users2,
  Calendar,
  Briefcase,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { calculateOwnerMix, calculateRetiringAllowance } from '../lib/distributionCalculations';
import { useLanguage } from './LanguageContext';

interface CorporateDistributionsManagerProps {
  employees?: Employee[];
}

export const CorporateDistributionsManager: React.FC<CorporateDistributionsManagerProps> = ({ employees = [] }) => {
  const { isFr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'comparison_guide' | 'owner_optimizer' | 'special_payments' | 'resolutions_generator'>('comparison_guide');

  // Owner Simulator State
  const [corporateNetIncome, setCorporateNetIncome] = useState<number>(150000);
  const [salaryBonusAmount, setSalaryBonusAmount] = useState<number>(75000);
  const [dividendAmount, setDividendAmount] = useState<number>(75000);
  const [dividendType, setDividendType] = useState<'non_eligible' | 'eligible'>('non_eligible');
  const [isCCPC, setIsCCPC] = useState<boolean>(true);
  const [qualifiesForSBD, setQualifiesForSBD] = useState<boolean>(true);
  const [passiveInvestmentIncome, setPassiveInvestmentIncome] = useState<number>(0);
  const [familyShareholderActive, setFamilyShareholderActive] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<2024 | 2025 | 2026>(2025);

  // Severance / Retiring Allowance State
  const [severanceTotal, setSeveranceTotal] = useState<number>(35000);
  const [pre1996Years, setPre1996Years] = useState<number>(6);
  const [pre1979Years, setPre1979Years] = useState<number>(0);
  const [voluntaryRrspSeverance, setVoluntaryRrspSeverance] = useState<number>(5000);
  const [selectedEmployeeForSeverance, setSelectedEmployeeForSeverance] = useState<string>('');

  // Resolution Generator State
  const [selectedResolutionType, setSelectedResolutionType] = useState<'bonus' | 'dividend' | 'epsp' | 'dpsp' | 'severance_rrsp'>('dividend');
  const [corpName, setCorpName] = useState<string>('Entreprise Conseil Québec Inc.');
  const [directorName, setDirectorName] = useState<string>('Jean Dupont');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Alexandre Tremblay');
  const [resolutionDate, setResolutionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resolutionFiscalYearEnd, setResolutionFiscalYearEnd] = useState<string>('2025-12-31');
  const [resolutionAmount, setResolutionAmount] = useState<number>(50000);
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate Owner Simulation
  const ownerResult = useMemo(() => {
    return calculateOwnerMix({
      corporateNetIncome,
      targetPersonalCash: salaryBonusAmount + dividendAmount,
      salaryBonusAmount,
      dividendAmount,
      dividendType,
      isCCPC,
      qualifiesForSBD,
      passiveInvestmentIncome,
      familyShareholderActive,
      year: selectedYear
    });
  }, [
    corporateNetIncome,
    salaryBonusAmount,
    dividendAmount,
    dividendType,
    isCCPC,
    qualifiesForSBD,
    passiveInvestmentIncome,
    familyShareholderActive,
    selectedYear
  ]);

  // Pure Salary Benchmark
  const pureSalaryResult = useMemo(() => {
    return calculateOwnerMix({
      corporateNetIncome,
      targetPersonalCash: corporateNetIncome,
      salaryBonusAmount: Math.min(corporateNetIncome / 1.05, corporateNetIncome),
      dividendAmount: 0,
      dividendType: 'non_eligible',
      isCCPC,
      qualifiesForSBD,
      passiveInvestmentIncome,
      familyShareholderActive: true,
      year: selectedYear
    });
  }, [corporateNetIncome, isCCPC, qualifiesForSBD, passiveInvestmentIncome, selectedYear]);

  // Pure Dividend Benchmark
  const pureDividendResult = useMemo(() => {
    return calculateOwnerMix({
      corporateNetIncome,
      targetPersonalCash: corporateNetIncome,
      salaryBonusAmount: 0,
      dividendAmount: corporateNetIncome * (qualifiesForSBD ? (1 - 0.122) : (1 - 0.265)),
      dividendType,
      isCCPC,
      qualifiesForSBD,
      passiveInvestmentIncome,
      familyShareholderActive,
      year: selectedYear
    });
  }, [corporateNetIncome, dividendType, isCCPC, qualifiesForSBD, passiveInvestmentIncome, familyShareholderActive, selectedYear]);

  // Severance Result
  const severanceResult = useMemo(() => {
    return calculateRetiringAllowance(
      severanceTotal,
      pre1996Years,
      pre1979Years,
      voluntaryRrspSeverance
    );
  }, [severanceTotal, pre1996Years, pre1979Years, voluntaryRrspSeverance]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Resolution Document Text
  const resolutionText = useMemo(() => {
    if (selectedResolutionType === 'bonus') {
      return `RÉSOLUTION DU CONSEIL D'ADMINISTRATION
${corpName.toUpperCase()}
(Ci-après désignée la « Société »)

DÉCLARATION ET ATTRIBUTION D'UN BONUS D'EMPLOI / RÉMUNÉRATION DE RENDEMENT

ATTENDU QUE la Société désire récompenser et verser un bonus de rendement à ${beneficiaryName} pour les services rendus au cours de l'exercice financier se terminant le ${resolutionFiscalYearEnd};

ATTENDU QUE la rémunération versée respecte le critère de raisonnabilité de l'Agence du revenu du Canada (ARC) et de Revenu Québec, établi selon la juste valeur marchande des fonctions exécutées;

IL EST UNANIMEMENT RÉSOLU :
1. Qu'un bonus d'emploi d'un montant total de ${formatCurrency(resolutionAmount)} soit par la présente déclaré et accordé à ${beneficiaryName}.
2. Que ledit bonus soit assujetti aux retenues fiscales usuelles à la source (Impôt fédéral, Impôt du Québec, RRQ, RQAP, AE) et déclaré à la case 14 du feuillet T4 et à la case A du Relevé 1.
3. Que le versement effectif des fonds soit complété dans un délai strict de cent quatre-vingts (180) jours suivant la fin de l'exercice financier de la Société (${resolutionFiscalYearEnd}) afin de garantir la pleine déductibilité fiscale de la charge pour l'exercice en cours.
4. Que les administrateurs et dirigeants de la Société soient autorisés à signer tout document et effectuer les remises requises auprès des autorités fiscales.

ADOPTÉE en date du ${resolutionDate}.

__________________________________________
${directorName}, Administrateur / Dirigeant`;
    }

    if (selectedResolutionType === 'dividend') {
      return `RÉSOLUTION DU CONSEIL D'ADMINISTRATION
${corpName.toUpperCase()}
(Ci-après désignée la « Société »)

DÉCLARATION ET PAIEMENT D'UN DIVIDENDE CORPORATIF

ATTENDU QUE la situation financière de la Société et ses bénéfices non répartis après impôts permettent la distribution d'un dividende aux actionnaires sans compromettre la solvabilité de l'entreprise;

IL EST UNANIMEMENT RÉSOLU :
1. Qu'un dividende ${dividendType === 'eligible' ? 'DÉTERMINÉ (Eligible Dividend)' : 'ORDINAIRE NON DÉTERMINÉ (Non-Eligible Dividend)'} d'un montant global de ${formatCurrency(resolutionAmount)} soit par la présente déclaré et payable à l'actionnaire ${beneficiaryName}.
2. Que ce dividende soit prélevé sur les bénéfices non répartis de la Société et distribué en date du ${resolutionDate}.
3. Que la Société confirme que ce dividende est ${dividendType === 'eligible' ? 'payé à même le Compte de revenu à taux général (CRTG)' : 'payé à même les bénéfices assujettis à la Déduction pour petite entreprise (DPE)'}.
4. Que la Société émette et transmette annuellement, au plus tard le dernier jour de février de l'année civile suivante, le feuillet fédéral T5 (cases 10, 11, 12) et le Relevé 3 québécois (cases A, B, C) appropriés.
5. Qu'il soit consigné au registre que l'actionnaire satisfait aux critères de participation active (TOSI) prévus aux lois fiscales applicables.

ADOPTÉE en date du ${resolutionDate}.

__________________________________________
${directorName}, Administrateur / Dirigeant`;
    }

    if (selectedResolutionType === 'epsp') {
      return `ENTENTE ET RÉSOLUTION DE PARTICIPATION DIFFÉRÉE AUX BÉNÉFICES (EPSP)
${corpName.toUpperCase()}
RÉGIME DE PARTICIPATION DES EMPLOYÉS AUX BÉNÉFICES (NON ENREGISTRÉ)

ATTENDU QUE la Société a institué un Régime de participation des employés aux bénéfices (RPEB / EPSP) au profit de ses employés admissibles;

IL EST RÉSOLU :
1. Que la Société verse une contribution de ${formatCurrency(resolutionAmount)} au fiduciaire désigné du régime, prélevée exclusivement sur les bénéfices réalisés de l'entreprise.
2. Que cette contribution soit déduite par la Société pour l'exercice financier se terminant le ${resolutionFiscalYearEnd}.
3. Que le fiduciaire attribue annuellement et irrévocablement la part revenant à chaque bénéficiaire, incluant ${beneficiaryName}.
4. Que les montants attribués soient déclarés sur le feuillet fédéral T4PS et le Relevé 25 du Québec, en conformité avec les règles d'exemption de retenues d'impôt et d'AE à la source, tout en maintenant l'assujettissement au RRQ et à la cotisation patronale au FSS au Québec.

ADOPTÉE en date du ${resolutionDate}.

__________________________________________
${directorName}, Administrateur`;
    }

    if (selectedResolutionType === 'dpsp') {
      return `RÉSOLUTION DE COTISATION AU RÉGIME DE PARTICIPATION DIFFÉRÉE AUX BÉNÉFICES (RPDB / DPSP)
${corpName.toUpperCase()}
NUMÉRO D'ENREGISTREMENT ARC : DPSP-998822

ATTENDU QUE la Société maintient un Régime de participation différée aux bénéfices (RPDB / DPSP) dûment enregistré auprès de l'Agence du revenu du Canada;

IL EST RÉSOLU :
1. Que la Société effectue une cotisation patronale déductible de ${formatCurrency(resolutionAmount)} en faveur de ${beneficiaryName}.
2. Qu'aucune cotisation salariale ne soit perçue, conformément aux exigences légales strictes du DPSP.
3. Que les droits de propriété des sommes attribuées soient assujettis à la période d'acquisition maximale de deux (2) ans.
4. Que la Société consigne le Facteur d'équivalence (FE / Pension Adjustment) correspondant sur le feuillet T4 et le Relevé 1 de l'employé afin d'ajuster son plafond de cotisation REER pour l'année subséquente.

ADOPTÉE en date du ${resolutionDate}.

__________________________________________
${directorName}, Administrateur`;
    }

    // Severance & RRSP Direct Transfer
    return `CONVENTION D'ALLOCATION DE RETRAITE ET TRANSFERT DIRECT AU REER
(ARTICLE 60 j.1 DE LA LOI DE L'IMPÔT SUR LE REVENU DU CANADA)

ENTRE : ${corpName} (L'Employeur)
ET : ${beneficiaryName} (L'Employé)

ATTENDU QUE l'emploi de l'Employé prend fin en date du ${resolutionDate} et que l'Employeur accorde une allocation de retraite globale de ${formatCurrency(severanceTotal)};

ATTENDU QUE l'Employé compte ${pre1996Years} années de service avant 1996 admissibles au transfert direct au REER sans utilisation de ses droits de cotisation réguliers en vertu de l'article 60 j.1 de la LIR;

IL EST CONVENU :
1. Portion admissible au transfert direct REER (Art. 60 j.1) : ${formatCurrency(severanceResult.directRrspTransferEligible)} (exonérée de retenue fiscale à la source).
2. Portion volontaire transférée au REER régulier : ${formatCurrency(severanceResult.voluntaryRrspContribution)} (exonérée de retenue sur remise d'une preuve d'espace REER).
3. Portion imposable versée au comptant : ${formatCurrency(severanceResult.taxableCashPortion)}.
4. Retenues d'impôt forfaitaires à la source :
   - Fédéral (${(severanceResult.federalLumpSumRate * 100).toFixed(0)}%) : ${formatCurrency(severanceResult.federalWithholdingTax)}
   - Québec (${(severanceResult.quebecLumpSumRate * 100).toFixed(0)}%) : ${formatCurrency(severanceResult.quebecWithholdingTax)}
   - Retenue totale : ${formatCurrency(severanceResult.totalWithholdingTax)}
5. Net remis à l'Employé : ${formatCurrency(severanceResult.netCashToEmployee)}.
6. Exemption légale : Les montants sont totalement exonérés des cotisations RRQ, AE et RQAP.
7. Déclaration : Montants déclarés au feuillet T4 (Codes 66 et 67) et Relevé 1 (Case O, code RJ).

Fait à Montréal, le ${resolutionDate}.

__________________________________________        __________________________________________
Pour l'Employeur : ${directorName}                 L'Employé : ${beneficiaryName}`;
  }, [
    selectedResolutionType,
    corpName,
    directorName,
    beneficiaryName,
    resolutionDate,
    resolutionFiscalYearEnd,
    resolutionAmount,
    dividendType,
    severanceTotal,
    pre1996Years,
    severanceResult
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                {isFr ? 'Rémunération & Distributions Corporatives' : 'Corporate Distributions & Compensation'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                ARC (CRA) & Revenu Québec 2025-2026
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isFr 
                ? 'Guide Fiscal des Distributions, Salaires vs Dividendes & Paiements Hors Paie Régulière'
                : 'Corporate Distributions, Owner Remuneration & Special Payments Tax Framework'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {isFr
                ? 'Architecture comparative des bonus d\'emploi, dividendes (déterminés et ordinaires), régimes de partage des bénéfices (EPSP / DPSP), optimisation fiscale pour dirigeants de CCPC et retenues pour allocations de retraite.'
                : 'Tax integration framework covering employment bonuses, dividends, profit sharing plans (EPSP / DPSP), CCPC owner salary vs dividend optimizer, and non-regular retiring allowances.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-right">
              <p className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Taux DPE Québec' : 'QC Small Business Rate'}</p>
              <p className="text-base font-extrabold text-emerald-400">12.2% <span className="text-[10px] text-slate-400 font-normal">(Fed 9% + QC 3.2%)</span></p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-right">
              <p className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Taux Général' : 'General Corp Rate'}</p>
              <p className="text-base font-extrabold text-blue-400">26.5% <span className="text-[10px] text-slate-400 font-normal">(Fed 15% + QC 11.5%)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('comparison_guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'comparison_guide'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{isFr ? '1. Guide Comparatif & Matrice Fiscale' : '1. Comparative Tax Guide'}</span>
        </button>

        <button
          onClick={() => setActiveTab('owner_optimizer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'owner_optimizer'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-600" />
          <span>{isFr ? '2. Optimiseur Dirigeant (Salaire vs Dividende)' : '2. Owner Salary vs Dividend Optimizer'}</span>
          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-extrabold">
            {isFr ? 'Simulateur' : 'Simulator'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('special_payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'special_payments'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-purple-600" />
          <span>{isFr ? '3. Allocations de Retraite & Paiements Hors Paie' : '3. Severance & Special Payments'}</span>
        </button>

        <button
          onClick={() => setActiveTab('resolutions_generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'resolutions_generator'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>{isFr ? '4. Résolutions Corporatives & Ententes' : '4. Corporate Resolutions & Agreements'}</span>
        </button>
      </div>

      {/* TAB 1: COMPARATIVE GUIDE & DEDUCTIONS REFERENCE MATRIX */}
      {activeTab === 'comparison_guide' && (
        <div className="space-y-6">
          {/* 4 Pillars of Corporate Distributions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1: Bonuses */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                    {isFr ? 'Revenu d\'emploi' : 'Employment Income'}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  {isFr ? '1. Bonus & Primes de Rendement' : '1. Bonuses (Employment Income)'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  {isFr
                    ? 'Rémunération supplémentaire versée à un employé ou dirigeant. 100% déductible pour l\'entreprise si payée dans les 180 jours.'
                    : 'Supplemental employment income. 100% corporate tax deductible if paid within 180 days of fiscal year-end.'}
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Traitement Société :' : 'Corporate Treatment:'}</p>
                    <p className="text-slate-600">{isFr ? 'Déductible à 100% du revenu brut (Règle des 180 jours).' : '100% deductible within 180-day rule.'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Traitement Particulier :' : 'Individual Treatment:'}</p>
                    <p className="text-slate-600">{isFr ? 'Taux marginal régulier. Génère 18% d\'espace REER.' : 'Marginal tax rate. Generates 18% RRSP room.'}</p>
                  </div>
                  <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-blue-900">
                    <p className="font-bold">{isFr ? 'Feuillets Fiscaux :' : 'Tax Slips:'}</p>
                    <p className="font-mono text-[10px]">T4 Case 14 | RL-1 Case A</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="font-bold text-slate-700">{isFr ? 'Test de raisonnabilité ARC' : 'CRA Reasonableness'}:</span> {isFr ? 'Exigé si versé à des membres de la famille.' : 'Enforced for family members.'}
              </div>
            </div>

            {/* Pillar 2: Dividends */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Coins className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    {isFr ? 'Distribution de Capital' : 'Capital Distribution'}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  {isFr ? '2. Dividendes (Ordinaires / Déterminés)' : '2. Dividends (Corporate Payouts)'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  {isFr
                    ? 'Distribution des bénéfices nets après impôts aux actionnaires. Aucune retenue RRQ, RQAP ou AE.'
                    : 'Payout of after-tax retained earnings to shareholders. Exempt from payroll taxes (no QPP, QPIP, EI).'}
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Traitement Société :' : 'Corporate Treatment:'}</p>
                    <p className="text-slate-600">{isFr ? 'Non déductible (déjà imposé à l\'impôt des sociétés).' : 'No tax deduction for corporation.'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Traitement Particulier :' : 'Individual Treatment:'}</p>
                    <p className="text-slate-600">{isFr ? 'Majoration & Crédit d\'impôt (Intégration fiscale).' : 'Gross-up & Dividend Tax Credit system.'}</p>
                  </div>
                  <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-900">
                    <p className="font-bold">{isFr ? 'Feuillets Fiscaux :' : 'Tax Slips:'}</p>
                    <p className="font-mono text-[10px]">T5 (Cases 10-12) | RL-3 (Cases A-C)</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isFr ? 'Attention TOSI : 53.53% si non actif' : 'TOSI: 53.53% top rate if inactive'}</span>
              </div>
            </div>

            {/* Pillar 3: EPSP */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Users2 className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                    {isFr ? 'Non Enregistré' : 'Unregistered Trust'}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  {isFr ? '3. Régime de Partage (EPSP / RPEB)' : '3. Employee Profit Sharing (EPSP)'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  {isFr
                    ? 'L\'employeur verse des sommes à un fiduciaire selon les bénéfices. Imposé immédiatement à l\'employé lors de l\'attribution.'
                    : 'Employer pays trust out of profits. Employee taxed immediately upon allocation, even if retained in trust.'}
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Traitement Société :' : 'Corporate Treatment:'}</p>
                    <p className="text-slate-600">{isFr ? 'Déductible dans l\'année si payé sur les bénéfices.' : 'Deductible in year made to trust.'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Retenues à la source :' : 'Source Deductions:'}</p>
                    <p className="text-slate-600">{isFr ? 'Exempt d\'impôt, AE, RQAP. Au QC: assujetti RRQ et FSS.' : 'Exempt from Tax/EI/QPIP. QC: QPP & HSF apply.'}</p>
                  </div>
                  <div className="p-2 bg-purple-50/60 rounded-lg border border-purple-100 text-purple-900">
                    <p className="font-bold">{isFr ? 'Feuillets Fiscaux :' : 'Tax Slips:'}</p>
                    <p className="font-mono text-[10px]">T4PS | RL-25 (Relevé 25)</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="font-bold text-slate-700">{isFr ? 'Attribution annuelle' : 'Annual Allocation'}:</span> {isFr ? 'Attribué irrévocablement par le fiduciaire.' : 'Irrevocably allocated by trustee.'}
              </div>
            </div>

            {/* Pillar 4: DPSP */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                    {isFr ? 'Enregistré ARC' : 'CRA Registered'}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  {isFr ? '4. Partage Différé (DPSP / RPDB)' : '4. Deferred Profit Sharing (DPSP)'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  {isFr
                    ? 'Régime fiscalement abrité enregistré auprès de l\'ARC. Impôt 100% différé jusqu\'au retrait par l\'employé.'
                    : 'Tax-sheltered CRA-registered plan. Taxes 100% deferred until funds are withdrawn by employee.'}
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Règles de Contribution :' : 'Contribution Rules:'}</p>
                    <p className="text-slate-600">{isFr ? 'Employeur SEULEMENT. Cotisations employé interdites.' : 'Employer ONLY. Employee contributions forbidden.'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{isFr ? 'Acquisition & REER :' : 'Vesting & RRSP Room:'}</p>
                    <p className="text-slate-600">{isFr ? 'Acquisition max 2 ans. Génère un Facteur d\'équivalence (FE).' : 'Max 2-yr vesting. Generates Pension Adjustment.'}</p>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100 text-amber-900">
                    <p className="font-bold">{isFr ? 'Feuillets Fiscaux :' : 'Tax Slips:'}</p>
                    <p className="font-mono text-[10px]">T4/RL-1 (FE) | Retrait: T4A / RL-2</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="font-bold text-slate-700">{isFr ? 'Enregistrement' : 'Registration'}:</span> {isFr ? 'Doit être enregistré officiellement à l\'ARC.' : 'Must be registered with CRA.'}
              </div>
            </div>
          </div>

          {/* Comparative Deep Dive Matrix: Dividends Mechanics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                  {isFr ? 'Mécanique Fiscale des Dividendes : Ordinaires (Non Déterminés) vs Déterminés' : 'Dividend Tax Mechanics: Non-Eligible vs Eligible Dividends'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isFr 
                    ? 'Application de la majoration fiscale (Gross-up) et des crédits d\'impôt pour dividendes de l\'ARC et Revenu Québec (TP-1).'
                    : 'Application of gross-up rates and dividend tax credits under CRA and Revenu Québec TP-1 rules.'}
                </p>
              </div>
              <Percent className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="p-3">{isFr ? 'Attribut Fédéral & Provincial' : 'Tax Attribute'}</th>
                    <th className="p-3 bg-blue-50/50 text-blue-900">{isFr ? 'Dividendes Non Déterminés (Ordinaires)' : 'Non-Eligible Dividends (Small Business)'}</th>
                    <th className="p-3 bg-emerald-50/50 text-emerald-900">{isFr ? 'Dividendes Déterminés (Général)' : 'Eligible Dividends (General Rate)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{isFr ? 'Source des Bénéfices Corporatifs' : 'Corporate Profit Source'}</td>
                    <td className="p-3 text-slate-600">{isFr ? 'Bénéfices imposés au taux réduit de la DPE (12.2% au QC sur les premiers 500 000 $).' : 'Profits taxed at CCPC Small Business Deduction (12.2% in QC).'}</td>
                    <td className="p-3 text-slate-600">{isFr ? 'Bénéfices imposés au taux général (26.5% au QC) ou Compte de revenu à taux général (CRTG).' : 'Profits taxed at general corporate rate (26.5% in QC) or GRIP.'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{isFr ? 'Majoration Fédérale (Gross-Up)' : 'Federal Gross-Up Rate'}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">15% <span className="text-[10px] text-slate-400 font-normal">($100 divis = $115 imposable)</span></td>
                    <td className="p-3 font-mono font-bold text-emerald-700">38% <span className="text-[10px] text-slate-400 font-normal">($100 divis = $138 imposable)</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{isFr ? 'Crédit d\'Impôt Fédéral pour Dividende' : 'Federal Dividend Tax Credit'}</td>
                    <td className="p-3 font-mono text-slate-700">9.03% <span className="text-[10px] text-slate-400">du montant majoré</span></td>
                    <td className="p-3 font-mono text-slate-700">15.02% <span className="text-[10px] text-slate-400">du montant majoré</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{isFr ? 'Traitement Québec (Déclaration TP-1)' : 'Quebec TP-1 Treatment'}</td>
                    <td className="p-3 text-slate-600">{isFr ? 'Majoration provinciale de 15% et crédit d\'impôt québécois de 4.01% du montant majoré.' : 'QC 15% gross-up and 4.01% provincial tax credit on TP-1.'}</td>
                    <td className="p-3 text-slate-600">{isFr ? 'Majoration provinciale de 38% et crédit d\'impôt québécois de 11.78% du montant majoré.' : 'QC 38% gross-up and 11.78% provincial tax credit on TP-1.'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{isFr ? 'Impact Cotisations Sociales & REER' : 'Payroll Taxes & RRSP Room'}</td>
                    <td className="p-3 text-amber-700 font-medium" colSpan={2}>
                      {isFr 
                        ? '0% RRQ, 0% RQAP, 0% AE, 0% FSS. N\'augmente PAS les droits de cotisation REER.' 
                        : '0% QPP, 0% QPIP, 0% EI, 0% HSF. Does NOT generate RRSP contribution room.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOSI Warning Alert */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">{isFr ? 'Règle Anti-Fractionnement TOSI (Tax on Split Income)' : 'Tax on Split Income (TOSI) Rules'}</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  {isFr
                    ? 'Il est interdit de fractionner librement des dividendes avec un conjoint ou des membres de la famille pour réduire l\'impôt. Si le membre de la famille n\'est pas activement impliqué (minimum 20 heures/semaine pendant l\'année ou 5 années antérieures) ou si l\'actionnaire principal a moins de 65 ans, les dividendes versés sont frappés du taux marginal maximal de 53,53 % au Québec sans droit aux crédits pour dividendes.'
                    : 'Income sprinkling dividends to family members is restricted. Unless the family member actively works 20+ hours/week in the business or the business owner is over 65, split dividends will be hit with Canada\'s highest marginal rate (53.53% in Quebec).'}
                </p>
              </div>
            </div>
          </div>

          {/* Master Source Deduction & Non-Regular Payments Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                  {isFr ? 'Matrice Officielle de Traitement des Paiements Hors Paie Régulière' : 'Payroll Deductions Reference Matrix for Special Payments'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isFr 
                    ? 'Assujettissement aux retenues à la source selon l\'ARC et Revenu Québec (Allocations, Avantages en nature, Primes, Sévérances, Remboursements).'
                    : 'Source deductions treatment for payments other than regular wages under CRA & Revenu Québec rules.'}
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="p-3">{isFr ? 'Type de Paiement / Avantage' : 'Payment Type'}</th>
                    <th className="p-3 text-center">{isFr ? 'Impôt Féd/QC ?' : 'Income Tax?'}</th>
                    <th className="p-3 text-center">{isFr ? 'RRQ / CPP ?' : 'QPP / CPP?'}</th>
                    <th className="p-3 text-center">{isFr ? 'AE / RQAP ?' : 'EI / QPIP?'}</th>
                    <th className="p-3">{isFr ? 'Feuillets de Déclaration' : 'Tax Slips Reporting'}</th>
                    <th className="p-3">{isFr ? 'Particularités Légales' : 'Special Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">
                      {isFr ? 'Allocations Forfaitaires au Comptant' : 'Cash / Flat-Rate Allowances'}
                      <span className="block text-[10px] text-slate-400 font-normal">{isFr ? 'ex: Allocation cellulaire fixe, auto mensuelle forfaitaire' : 'e.g. Fixed phone/car allowance'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI' : 'YES'}</td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI' : 'YES'}</td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI' : 'YES'}</td>
                    <td className="p-3 font-mono text-[10px]">T4 Case 14 | RL-1 Case A</td>
                    <td className="p-3 text-[11px] text-slate-600">{isFr ? 'Non-imposable uniquement si calculé au km prescrit (0,72 $/km).' : 'Non-taxable only if per-km reasonable rate.'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">
                      {isFr ? 'Avantages en Nature (Non monétaires)' : 'Non-Cash Benefits (Perks)'}
                      <span className="block text-[10px] text-slate-400 font-normal">{isFr ? 'ex: Droit d\'usage auto, abonnement gym, cadeau > 500 $' : 'e.g. Auto standby, gym, gifts > $500'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI' : 'YES'}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{isFr ? 'OUI (RRQ)' : 'YES (QPP)'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (Exempt)' : 'NO (Exempt)'}</td>
                    <td className="p-3 font-mono text-[10px]">T4 Cases 14 + Codes | RL-1 Cases A, L, W, V</td>
                    <td className="p-3 text-[11px] text-slate-600">{isFr ? 'Assurance santé : Imposable QC (Case J) mais non-imposable Fédéral.' : 'Health insurance taxable in QC (Box J) but Fed exempt.'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">
                      {isFr ? 'Primes Forfaitaires / Rétroactions' : 'Lump-Sum & Retroactive Pay'}
                      <span className="block text-[10px] text-slate-400 font-normal">{isFr ? 'ex: Augmentation rétroactive, prime de signature' : 'e.g. Retro pay, signing bonus'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI (Méthode Bonus)' : 'YES (Bonus Method)'}</td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI (Jusqu\'au max)' : 'YES (Up to cap)'}</td>
                    <td className="p-3 text-center font-bold text-red-600">{isFr ? 'OUI (Jusqu\'au max)' : 'YES (Up to cap)'}</td>
                    <td className="p-3 font-mono text-[10px]">T4 Case 14 | RL-1 Case A</td>
                    <td className="p-3 text-[11px] text-slate-600">{isFr ? 'Calculer selon la méthode de mensualisation du bonus pour éviter la surtaxe.' : 'Use bonus calculation method to prevent tax spikes.'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">
                      {isFr ? 'Allocations de Retraite / Sévérances' : 'Retiring Allowances & Severance'}
                      <span className="block text-[10px] text-slate-400 font-normal">{isFr ? 'Indemnité de départ, fin d\'emploi, reconnaissance' : 'Severance, redundancy, recognition'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-amber-600">{isFr ? 'Taux Forfaitaires' : 'Lump-Sum Rates'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (Exempt)' : 'NO (Exempt)'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (Exempt)' : 'NO (Exempt)'}</td>
                    <td className="p-3 font-mono text-[10px]">T4 Code 66 / 67 | RL-1 Case O (Code RJ)</td>
                    <td className="p-3 text-[11px] text-slate-600">{isFr ? '0% de retenue si transféré directement au REER (Art. 60 j.1 ou REER perso).' : '0% withholding if directly transferred to RRSP.'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">
                      {isFr ? 'Remboursements de Dépenses Justifiées' : 'Business Expense Reimbursements'}
                      <span className="block text-[10px] text-slate-400 font-normal">{isFr ? 'Dépenses engagées avec pièces justificatives/reçus' : 'Receipt-backed business expenses'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (0%)' : 'NO (0%)'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (0%)' : 'NO (0%)'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{isFr ? 'NON (0%)' : 'NO (0%)'}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{isFr ? 'Non déclaré sur les feuillets' : 'Unreported on slips'}</td>
                    <td className="p-3 text-[11px] text-slate-600">{isFr ? 'Simple remboursement de débours. 100% déductible pour l\'entreprise.' : 'Pure reimbursement of corporate out-of-pocket expenses.'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OWNER SALARY VS DIVIDEND OPTIMIZER & SIMULATOR */}
      {activeTab === 'owner_optimizer' && (
        <div className="space-y-6">
          {/* Controls & Presets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    {isFr ? 'Paramètres Corporatifs & Tirage' : 'CCPC & Owner Parameters'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {selectedYear}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Bénéfice Net Corporatif Avant Rémunération ($)' : 'Pre-Tax Corporate Income ($)'}
                  </label>
                  <input
                    type="number"
                    value={corporateNetIncome || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setCorporateNetIncome(val);
                      // Adjust mix defaults
                      setSalaryBonusAmount(val / 2);
                      setDividendAmount(val / 2);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">{isFr ? 'Portion Salaire / Bonus :' : 'Salary / Bonus Share:'}</span>
                    <span className="font-extrabold text-blue-600">{formatCurrency(salaryBonusAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={corporateNetIncome}
                    step={1000}
                    value={salaryBonusAmount}
                    onChange={e => {
                      const sal = parseFloat(e.target.value) || 0;
                      setSalaryBonusAmount(sal);
                      setDividendAmount(Math.max(0, corporateNetIncome - sal));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="font-bold text-slate-700">{isFr ? 'Portion Dividende :' : 'Dividend Share:'}</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(dividendAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={corporateNetIncome}
                    step={1000}
                    value={dividendAmount}
                    onChange={e => {
                      const div = parseFloat(e.target.value) || 0;
                      setDividendAmount(div);
                      setSalaryBonusAmount(Math.max(0, corporateNetIncome - div));
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Catégorie de Dividende' : 'Dividend Category'}
                  </label>
                  <select
                    value={dividendType}
                    onChange={e => setDividendType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="non_eligible">{isFr ? 'Non Déterminé (Petite Entreprise / DPE 12.2%)' : 'Non-Eligible (CCPC SBD 12.2%)'}</option>
                    <option value="eligible">{isFr ? 'Déterminé (Taux Général / CRTG 26.5%)' : 'Eligible (General Rate / GRIP 26.5%)'}</option>
                  </select>
                </div>

                {/* Advanced CCPC Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700">
                      {isFr ? 'Admissible à la DPE (12.2% QC) ?' : 'Eligible for SBD (12.2% QC)?'}
                    </label>
                    <input
                      type="checkbox"
                      checked={qualifiesForSBD}
                      onChange={e => setQualifiesForSBD(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        {isFr ? 'Actionnaire Actif (>20h/sem)?' : 'Active Shareholder (>20h/wk)?'}
                      </label>
                      <span className="text-[9px] text-slate-400">{isFr ? 'Exemption des règles TOSI' : 'TOSI rules exemption'}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={familyShareholderActive}
                      onChange={e => setFamilyShareholderActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2">
                      {isFr ? 'Revenu de Placement Passif Corporatif ($)' : 'Passive Investment Income inside Corp ($)'}
                    </label>
                    <input
                      type="number"
                      value={passiveInvestmentIncome || ''}
                      onChange={e => setPassiveInvestmentIncome(parseFloat(e.target.value) || 0)}
                      placeholder="0 $"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {passiveInvestmentIncome > 50000 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        {isFr 
                          ? `Plafond DPE réduit de ${formatCurrency(ownerResult.sbdGrindReduction)} (Érosion 5:1 pour surplus > 50k$).` 
                          : `SBD limit reduced by ${formatCurrency(ownerResult.sbdGrindReduction)} (5:1 passive grind rule).`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => {
                      setSalaryBonusAmount(corporateNetIncome);
                      setDividendAmount(0);
                    }}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    100% {isFr ? 'Salaire' : 'Salary'}
                  </button>
                  <button
                    onClick={() => {
                      setSalaryBonusAmount(0);
                      setDividendAmount(corporateNetIncome);
                    }}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    100% {isFr ? 'Dividende' : 'Dividend'}
                  </button>
                  <button
                    onClick={() => {
                      setSalaryBonusAmount(corporateNetIncome / 2);
                      setDividendAmount(corporateNetIncome / 2);
                    }}
                    className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    50 / 50 {isFr ? 'Mixte' : 'Hybrid'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Dashboard Comparison */}
            <div className="lg:col-span-2 space-y-4">
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Argent Net en Poche' : 'Net Cash in Pocket'}</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(ownerResult.netCashInHand)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFr ? 'Après impôt corporatif, personnel et retenues' : 'After all corporate & personal taxes'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Taux d\'Impôt Combiné' : 'Effective Tax Rate'}</span>
                    <Percent className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{ownerResult.effectiveTotalTaxRate.toFixed(1)} %</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFr ? 'Impôt Société + Personnel + FSS/RRQ' : 'Total system tax burden'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Droits REER Générés' : 'RRSP Room Created'}</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-purple-700">{formatCurrency(ownerResult.rrspRoomGenerated)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isFr ? '18% du salaire versé pour l\'année prochaine' : '18% of salary for next year'}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Comparison Scenarios Table */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center justify-between">
                  <span>{isFr ? 'Comparaison des Stratégies de Rémunération' : 'Compensation Strategies Benchmark'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{isFr ? 'Base : 150 000 $ bénéfice net corp' : 'Base: Corporate profits'}</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-2.5">{isFr ? 'Scénario de Rémunération' : 'Strategy'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Impôt Société' : 'Corp Tax'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Cotis. Patronales' : 'Payroll Taxes'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Impôt Particulier' : 'Personal Tax'}</th>
                        <th className="p-2.5 text-right font-extrabold">{isFr ? 'Net en Poche' : 'Net in Pocket'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Espace REER' : 'RRSP Room'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className={salaryBonusAmount > 0 && dividendAmount === 0 ? 'bg-blue-50/50 font-semibold' : ''}>
                        <td className="p-2.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>100% {isFr ? 'Salaire / Bonus' : 'Salary / Bonus'}</span>
                        </td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(pureSalaryResult.corporateTax)}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(pureSalaryResult.payrollTaxesEmployer.total)}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(pureSalaryResult.personalIncomeTax.netPersonalTax)}</td>
                        <td className="p-2.5 text-right font-extrabold text-blue-700">{formatCurrency(pureSalaryResult.netCashInHand)}</td>
                        <td className="p-2.5 text-right text-slate-700">{formatCurrency(pureSalaryResult.rrspRoomGenerated)}</td>
                      </tr>

                      <tr className={salaryBonusAmount === 0 && dividendAmount > 0 ? 'bg-emerald-50/50 font-semibold' : ''}>
                        <td className="p-2.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>100% {isFr ? 'Dividendes (Non Déterminés)' : 'Dividends (Non-Eligible)'}</span>
                        </td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(pureDividendResult.corporateTax)}</td>
                        <td className="p-2.5 text-right text-emerald-700 font-bold">0,00 $</td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(pureDividendResult.personalIncomeTax.netPersonalTax)}</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-700">{formatCurrency(pureDividendResult.netCashInHand)}</td>
                        <td className="p-2.5 text-right text-slate-400">0,00 $</td>
                      </tr>

                      <tr className={salaryBonusAmount > 0 && dividendAmount > 0 ? 'bg-purple-50/70 font-semibold' : ''}>
                        <td className="p-2.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          <span className="font-extrabold text-purple-900">{isFr ? 'Votre Mix Personnalisé' : 'Your Custom Mix'}</span>
                        </td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(ownerResult.corporateTax)}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(ownerResult.payrollTaxesEmployer.total)}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatCurrency(ownerResult.personalIncomeTax.netPersonalTax)}</td>
                        <td className="p-2.5 text-right font-extrabold text-purple-800">{formatCurrency(ownerResult.netCashInHand)}</td>
                        <td className="p-2.5 text-right text-purple-700 font-bold">{formatCurrency(ownerResult.rrspRoomGenerated)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Considerations Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 text-xs text-blue-950">
                  <p className="font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    {isFr ? 'Avantages du Salaire / Bonus pour le Dirigeant' : 'Advantages of Salary / Bonus'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-900">
                    <li>{isFr ? 'Crée des droits de cotisation REER (18% jusqu\'au maximum annuel).' : 'Creates RRSP room (18% up to CRA cap).'}</li>
                    <li>{isFr ? 'Cotise au Régime de rentes du Québec (RRQ) garantissant une rente de retraite d\'État.' : 'Builds QPP government retirement pension.'}</li>
                    <li>{isFr ? 'Facilite l\'approbation de prêts hypothécaires personnels (revenu T4 stable).' : 'Easier personal mortgage and bank loan qualification.'}</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    {isFr ? 'Avantages des Dividendes pour le Dirigeant' : 'Advantages of Dividends'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900">
                    <li>{isFr ? 'Exemption totale des charges de paie (0% RRQ, 0% RQAP, 0% FSS, 0% CNESST).' : 'Zero payroll taxes (no QPP, QPIP, HSF, CNESST).'}</li>
                    <li>{isFr ? 'Administration ultra-simplifiée par simple résolution sans paie périodique.' : 'Simpler administration via simple board resolution.'}</li>
                    <li>{isFr ? 'Flexibilité totale de distribution selon les liquidités de l\'entreprise.' : 'Total cash flow distribution flexibility.'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RETIRING ALLOWANCES & SPECIAL PAYMENTS ENGINE */}
      {activeTab === 'special_payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Severance Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    {isFr ? 'Calculateur d\'Allocation de Retraite / Sévérance' : 'Retiring Allowance / Severance Engine'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Sélectionner l\'Employé Admissible' : 'Select Eligible Employee'}
                  </label>
                  <select
                    value={selectedEmployeeForSeverance}
                    onChange={e => {
                      setSelectedEmployeeForSeverance(e.target.value);
                      const emp = employees.find(x => x.id === e.target.value);
                      if (emp) setBeneficiaryName(`${emp.firstName} ${emp.lastName}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">{isFr ? '-- Choisir un employé --' : '-- Choose employee --'}</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employmentType})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Montant Total de la Sévérance ($)' : 'Total Severance / Retiring Allowance ($)'}
                  </label>
                  <input
                    type="number"
                    value={severanceTotal || ''}
                    onChange={e => setSeveranceTotal(parseFloat(e.target.value) || 0)}
                    placeholder="35 000 $"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                  <p className="text-[11px] font-extrabold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    {isFr ? 'Transfert Direct au REER (Article 60 j.1 LIR)' : 'Direct RRSP Rollover (ITA 60(j.1))'}
                  </p>
                  <p className="text-[10px] text-purple-800 leading-relaxed">
                    {isFr 
                      ? 'Permet de transférer 2 000 $/année de service avant 1996 au REER SANS utiliser les droits de cotisation réguliers (Exonéré de retenue d\'impôt).' 
                      : 'Transfer $2,000/yr of service prior to 1996 to RRSP without using regular RRSP room.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[9px] font-bold text-purple-900 uppercase">
                        {isFr ? 'Années Service < 1996' : 'Years of Service < 1996'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={pre1996Years}
                        onChange={e => setPre1996Years(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-purple-200 rounded-lg font-bold text-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-purple-900 uppercase">
                        {isFr ? 'Années Service < 1979' : 'Years of Service < 1979'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={pre1979Years}
                        onChange={e => setPre1979Years(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-purple-200 rounded-lg font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Transfert Volontaire REER Régulier ($)' : 'Voluntary Regular RRSP Rollover ($)'}
                  </label>
                  <input
                    type="number"
                    value={voluntaryRrspSeverance || ''}
                    onChange={e => setVoluntaryRrspSeverance(parseFloat(e.target.value) || 0)}
                    placeholder="0 $"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[9px] text-slate-400">{isFr ? 'Utilise les droits de cotisation personnels (Exonéré de retenue)' : 'Uses personal RRSP room (0% tax at source)'}</span>
                </div>
              </div>
            </div>

            {/* Breakdown & Tax Withholding Output */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                      {isFr ? 'Bilan des Retenues Forfaitaires & Net Versé' : 'Severance Withholding Tax Statement'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {isFr ? 'Taux d\'impôt forfaitaires combinés (Fédéral + Québec) et déclaration fiscale' : 'Lump-sum withholding tax brackets & slip codes'}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    {isFr ? 'Exempt de RRQ / AE / RQAP' : 'Exempt from QPP/EI/QPIP'}
                  </span>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold uppercase text-purple-900">{isFr ? 'Transfert REER 60(j.1)' : 'Art. 60(j.1) Rollover'}</p>
                    <p className="text-xl font-extrabold text-purple-800 mt-1">{formatCurrency(severanceResult.directRrspTransferEligible)}</p>
                    <p className="text-[9px] text-purple-700 mt-0.5">{isFr ? '0% de retenue d\'impôt' : '0% withholding tax'}</p>
                  </div>

                  <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold uppercase text-amber-900">{isFr ? 'Part Imposable au Comptant' : 'Taxable Cash Portion'}</p>
                    <p className="text-xl font-extrabold text-amber-800 mt-1">{formatCurrency(severanceResult.taxableCashPortion)}</p>
                    <p className="text-[9px] text-amber-700 mt-0.5">
                      {isFr ? `Taux forfaitaire : ${(severanceResult.federalLumpSumRate * 100 + severanceResult.quebecLumpSumRate * 100).toFixed(0)}%` : 'Combined lump-sum bracket'}
                    </p>
                  </div>

                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                    <p className="text-[10px] font-bold uppercase text-emerald-900">{isFr ? 'Net Payé à l\'Employé' : 'Net Paid to Employee'}</p>
                    <p className="text-xl font-extrabold text-emerald-800 mt-1">{formatCurrency(severanceResult.netCashToEmployee)}</p>
                    <p className="text-[9px] text-emerald-700 mt-0.5">{isFr ? 'Versement comptant final' : 'Final net cash payment'}</p>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-2.5">{isFr ? 'Composante de la Sévérance' : 'Item'}</th>
                        <th className="p-2.5 text-center">{isFr ? 'Taux Retenue' : 'Tax Rate'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Montant Retenu' : 'Withheld'}</th>
                        <th className="p-2.5 text-right">{isFr ? 'Net Émis' : 'Net Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">{isFr ? 'Retenue d\'Impôt Fédéral (ARC)' : 'Federal Withholding Tax (CRA)'}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{(severanceResult.federalLumpSumRate * 100).toFixed(0)} %</td>
                        <td className="p-2.5 text-right font-bold text-red-600">{formatCurrency(severanceResult.federalWithholdingTax)}</td>
                        <td className="p-2.5 text-right text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">{isFr ? 'Retenue d\'Impôt Provincial (Revenu Québec)' : 'Quebec Withholding Tax (RQ)'}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{(severanceResult.quebecLumpSumRate * 100).toFixed(0)} %</td>
                        <td className="p-2.5 text-right font-bold text-red-600">{formatCurrency(severanceResult.quebecWithholdingTax)}</td>
                        <td className="p-2.5 text-right text-slate-400">-</td>
                      </tr>
                      <tr className="bg-slate-50/80 font-bold">
                        <td className="p-2.5 text-slate-900">{isFr ? 'Total Retenues Fiscales' : 'Total Tax Withheld'}</td>
                        <td className="p-2.5 text-center text-slate-900">{((severanceResult.federalLumpSumRate + severanceResult.quebecLumpSumRate) * 100).toFixed(0)} %</td>
                        <td className="p-2.5 text-right text-red-700">{formatCurrency(severanceResult.totalWithholdingTax)}</td>
                        <td className="p-2.5 text-right text-emerald-700">{formatCurrency(severanceResult.netCashToEmployee)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Reporting Slips Box */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{isFr ? 'Feuillets de Déclaration de Fin d\'Année' : 'Year-End Slip Reporting'}</p>
                    <p className="font-mono text-blue-300 text-[11px] mt-0.5">{severanceResult.t4Box} | {severanceResult.rl1Box}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedResolutionType('severance_rrsp');
                      setActiveTab('resolutions_generator');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {isFr ? 'Générer Convention REER' : 'Generate RRSP Agreement'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CORPORATE RESOLUTIONS & LEGAL DOCUMENTS GENERATOR */}
      {activeTab === 'resolutions_generator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Options Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    {isFr ? 'Générateur de Résolutions' : 'Resolutions Generator'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Type de Document / Résolution' : 'Document / Resolution Type'}
                  </label>
                  <select
                    value={selectedResolutionType}
                    onChange={e => setSelectedResolutionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-semibold text-slate-800"
                  >
                    <option value="bonus">{isFr ? '1. Résolution : Déclaration de Bonus d\'Emploi (Règle 180j)' : '1. Board Resolution: Bonus Declaration (180d)'}</option>
                    <option value="dividend">{isFr ? '2. Résolution : Déclaration de Dividende (T5 / RL-3)' : '2. Board Resolution: Dividend Declaration'}</option>
                    <option value="epsp">{isFr ? '3. Entente : Régime de Partage EPSP / RPEB' : '3. Agreement: Employee Profit Sharing (EPSP)'}</option>
                    <option value="dpsp">{isFr ? '4. Résolution : Cotisation DPSP / RPDB (FE)' : '4. Resolution: DPSP Contribution'}</option>
                    <option value="severance_rrsp">{isFr ? '5. Convention : Allocation Retraite & REER 60(j.1)' : '5. Convention: Retiring Allowance & RRSP 60(j.1)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Raison Sociale de la Société' : 'Corporation Legal Name'}
                  </label>
                  <input
                    type="text"
                    value={corpName}
                    onChange={e => setCorpName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Nom de l\'Administrateur / Signataire' : 'Director / Signatory Name'}
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={e => setDirectorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Bénéficiaire / Actionnaire / Employé' : 'Beneficiary / Shareholder / Employee'}
                  </label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={e => setBeneficiaryName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isFr ? 'Montant Total ($)' : 'Total Amount ($)'}
                    </label>
                    <input
                      type="number"
                      value={resolutionAmount || ''}
                      onChange={e => setResolutionAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isFr ? 'Date d\'Adoption' : 'Date'}
                    </label>
                    <input
                      type="date"
                      value={resolutionDate}
                      onChange={e => setResolutionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {selectedResolutionType === 'bonus' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isFr ? 'Fin de l\'Exercice Financier' : 'Fiscal Year-End Date'}
                    </label>
                    <input
                      type="date"
                      value={resolutionFiscalYearEnd}
                      onChange={e => setResolutionFiscalYearEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[9px] text-blue-600 font-semibold">{isFr ? 'Le paiement doit être effectué dans les 180 jours de cette date.' : 'Must be paid within 180 days of this date.'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Preview & Copy */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between min-h-[500px]">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                        {isFr ? 'Aperçu du Document Légal Conforme' : 'Compliant Legal Document Preview'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isFr ? 'Conforme aux exigences de la Loi sur les sociétés et des lois fiscales canadiennes & québécoises' : 'Compliant with corporate and tax legislation'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(resolutionText)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le Texte' : 'Copy Text')}</span>
                      </button>

                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>${corpName} - Résolution</title>
                                  <style>
                                    body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; white-space: pre-wrap; font-size: 14px; }
                                  </style>
                                </head>
                                <body>${resolutionText}</body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isFr ? 'Imprimer / PDF' : 'Print / PDF'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {resolutionText}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{isFr ? 'Document d\'entreprise généré automatiquement' : 'Auto-generated corporate document'}</span>
                  <span className="font-semibold text-slate-600">{corpName} • {resolutionDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
