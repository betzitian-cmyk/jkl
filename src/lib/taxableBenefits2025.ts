/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaxableBenefitCategory, TaxableBenefitRecord, ExtractedFinancialItem, BusinessExpense } from '../types';

export interface TaxBenefitRuleDefinition {
  id: TaxableBenefitCategory;
  nameEn: string;
  nameFr: string;
  category: string;
  rl1Boxes: string;
  t4Boxes: string;
  subjectToQpp: boolean;
  subjectToQpip: boolean;
  subjectToEi: boolean;
  subjectToTax: boolean;
  rates2025: string;
  descriptionEn: string;
  descriptionFr: string;
  referencePdf: string;
}

export const REVENU_QUEBEC_2025_RULES: Record<TaxableBenefitCategory, TaxBenefitRuleDefinition> = {
  motor_vehicle_allowance: {
    id: 'motor_vehicle_allowance',
    nameEn: 'Motor Vehicle Allowances',
    nameFr: 'Allocations pour utilisation d\'un véhicule à moteur',
    category: 'Motor Vehicles',
    rl1Boxes: 'A, G, I, L',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: true,
    subjectToEi: true,
    subjectToTax: true,
    rates2025: '$0.72/km (1st 5,000 km), $0.66/km (additional) [+ $0.04 territories]',
    descriptionEn: 'Taxable if not based solely on actual business kilometres or if rate exceeds reasonable ceiling ($0.72/$0.66/km) or is a flat-rate.',
    descriptionFr: 'Imposable si non basée sur les kilomètres réels, si elle dépasse le taux raisonnable (0,72 $/0,66 $/km) ou s\'il s\'agit d\'un montant forfaitaire.',
    referencePdf: 'IN-253-V p.7, 14-15 | T4130 p.14-15'
  },
  automobile_operating: {
    id: 'automobile_operating',
    nameEn: 'Automobile Operating-Costs Benefit',
    nameFr: 'Avantage relatif aux frais de fonctionnement d\'une automobile',
    category: 'Motor Vehicles',
    rl1Boxes: 'A, W, (G)',
    t4Boxes: '14, Code 34',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: '$0.34/km (standard), $0.31/km (auto sales/leasing employees)',
    descriptionEn: 'Benefit for personal use of employer-provided automobile. Calculated at $0.34/km or 50% of standby charge (optional).',
    descriptionFr: 'Avantage pour l\'utilisation personnelle d\'une automobile fournie par l\'employeur (0,34 $/km ou 50 % du droit d\'usage).',
    referencePdf: 'IN-253-V p.7, 18-19 | T4130 p.12-13'
  },
  standby_charge: {
    id: 'standby_charge',
    nameEn: 'Automobile Standby Charge',
    nameFr: 'Droit d\'usage d\'une automobile',
    category: 'Motor Vehicles',
    rl1Boxes: 'A, W, (G) [or Box O code RO/RP]',
    t4Boxes: '14, Code 34',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Simplified: 24% of auto cost | Detailed: 2% x (days/30) | Leased: 2/3 (66.67%) of lease',
    descriptionEn: 'Standby charge for employer-owned or leased vehicle available for personal use, reduced if >50% business driving.',
    descriptionFr: 'Droit d\'usage pour automobile possédée ou louée par l\'employeur mise à disposition, réduit si >50% usage d\'affaires.',
    referencePdf: 'IN-253-V p.15-18 | T4130 p.10-12'
  },
  non_auto_motor_vehicle: {
    id: 'non_auto_motor_vehicle',
    nameEn: 'Non-Automobile Motor Vehicles (Vans / Trucks)',
    nameFr: 'Véhicule à moteur autre qu\'une automobile (fourgonnette, camionnette)',
    category: 'Motor Vehicles',
    rl1Boxes: 'A, W, (G)',
    t4Boxes: '14, Code 34',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: '$0.34/km under home-at-night policy or reasonable FMV',
    descriptionEn: 'Commuting in employer-provided trucks/vans under written policy where tool storage or emergency call is mandatory.',
    descriptionFr: 'Déplacements domicile-travail avec véhicule utilitaire sous directive écrite (outillage ou urgence).',
    referencePdf: 'IN-253-V p.27-28 | T4130 p.13-14'
  },
  restaurant_hotel_meals: {
    id: 'restaurant_hotel_meals',
    nameEn: 'Restaurant or Hotel Employee Meals',
    nameFr: 'Repas fournis à un employé d\'hôtel ou de restaurant',
    category: 'Meals & Lodging',
    rl1Boxes: 'A, V, (G)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Capped at $11.57 per meal (2025) / $11.93 (2026) minus 20% discount',
    descriptionEn: 'Benefit equals lowest menu price up to $11.57 max, minus 20% standard discount, minus amount paid by employee.',
    descriptionFr: 'Égale au prix le plus bas facturé aux clients jusqu\'à 11,57 $ max, moins rabais de 20%, moins montant payé.',
    referencePdf: 'IN-253-V p.7, 42 | T4130 p.27-28'
  },
  restaurant_hotel_lodging: {
    id: 'restaurant_hotel_lodging',
    nameEn: 'Restaurant or Hotel Employee Lodging',
    nameFr: 'Logement fourni à un employé d\'hôtel ou de restaurant',
    category: 'Meals & Lodging',
    rl1Boxes: 'A, V, (G)',
    t4Boxes: '14, Code 30',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Capped at $61.71 per week (2025) / $65.68 (2026)',
    descriptionEn: 'Benefit equals lowest weekly room rate up to $61.71/week max, minus rent paid by employee.',
    descriptionFr: 'Égale au tarif hebdomadaire le plus bas jusqu\'à 61,71 $/semaine max, moins le loyer payé par l\'employé.',
    referencePdf: 'IN-253-V p.7, 42 | T4130 p.23'
  },
  free_subsidized_lodging: {
    id: 'free_subsidized_lodging',
    nameEn: 'Free or Subsidized Lodging',
    nameFr: 'Logement gratuit ou subventionné',
    category: 'Meals & Lodging',
    rl1Boxes: 'A, V, (G or I)',
    t4Boxes: '14, Code 30',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Fair Market Value (FMV) rent minus employee paid amount',
    descriptionEn: 'FMV of rent for house or apartment provided by employer minus any amount paid by employee.',
    descriptionFr: 'Juste valeur marchande du loyer moins le montant payé par l\'employé.',
    referencePdf: 'IN-253-V p.37 | T4130 p.23'
  },
  remote_work_site: {
    id: 'remote_work_site',
    nameEn: 'Remote Work Sites & Special Work Sites',
    nameFr: 'Chantiers particuliers et lieux de travail éloignés',
    category: 'Remote Work',
    rl1Boxes: 'Exempt if >= 80 km; otherwise Boxes A, V (code V-1)',
    t4Boxes: 'Exempt or Code 31 / 32',
    subjectToQpp: false,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: false,
    rates2025: 'Exemption condition: >= 80 km from principal residence or community >= 1,000 people',
    descriptionEn: 'Board, lodging and travel are tax-exempt if site is >= 80 km away and temporary (>= 36 hours). Otherwise fully taxable.',
    descriptionFr: 'Pension et transport exonérés si chantier à >= 80 km et durée temporaire (>= 36h). Sinon imposable.',
    referencePdf: 'IN-253-V p.38-41 | T4130 p.17-18, 40-41'
  },
  remote_allowance: {
    id: 'remote_allowance',
    nameEn: 'Remote Allowances (Check-out & Compensation)',
    nameFr: 'Allocations de départ et de compensation en lieu éloigné',
    category: 'Remote Work',
    rl1Boxes: 'A, G, I, L',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: true,
    subjectToEi: true,
    subjectToTax: true,
    rates2025: '100% Taxable Cash Benefit',
    descriptionEn: 'Check-out allowances and compensation allowances paid to employees leaving or remaining at remote sites.',
    descriptionFr: 'Allocations versées pour le départ en fin de semaine ou pour avoir renoncé au droit de quitter le chantier.',
    referencePdf: 'IN-253-V p.39-40 | T4130 p.18'
  },
  group_insurance_health: {
    id: 'group_insurance_health',
    nameEn: 'Private Health Services Plan (PHSP)',
    nameFr: 'Régime privé d\'assurance maladie (frais médicaux / dentaires)',
    category: 'Insurance Plans',
    rl1Boxes: 'A, J, (G)',
    t4Boxes: 'Exempt federally (T4 Box 85 info)',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Employer premium + 9% Quebec tax minus RAMQ reduction if applicable',
    descriptionEn: 'Taxable in Quebec (Box J) including 9% insurance tax. Exempt from federal taxable income.',
    descriptionFr: 'Imposable au Québec (Case J) incluant la taxe de 9 % sur les primes. Exonéré au fédéral.',
    referencePdf: 'IN-253-V p.29-34 | T4130 p.30'
  },
  group_insurance_life: {
    id: 'group_insurance_life',
    nameEn: 'Group Term Life & Critical Illness Insurance',
    nameFr: 'Assurance-vie collective temporaire et maladies graves',
    category: 'Insurance Plans',
    rl1Boxes: 'A, L, (G)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Employer premium + 9% tax (QC) / 8% (ON)',
    descriptionEn: 'Employer-paid life and critical illness premiums are taxable for both federal and Quebec provincial tax.',
    descriptionFr: 'Primes payées par l\'employeur imposables au fédéral et au provincial.',
    referencePdf: 'IN-253-V p.29, 35 | T4130 p.22-23'
  },
  non_group_insurance: {
    id: 'non_group_insurance',
    nameEn: 'Non-Group Insurance Plans',
    nameFr: 'Régimes d\'assurance non collectifs',
    category: 'Insurance Plans',
    rl1Boxes: 'A, L, (G)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Full employer contribution + applicable taxes',
    descriptionEn: 'Individual health, accident, disability or life policies paid by employer.',
    descriptionFr: 'Primes individuelles de santé, accident, invalidité ou vie payées par l\'employeur.',
    referencePdf: 'IN-253-V p.35 | T4130 p.24'
  },
  ramq_equivalency: {
    id: 'ramq_equivalency',
    nameEn: 'RAMQ Equivalency Reduction',
    nameFr: 'Réduction pour services assurés par la RAMQ (non assujetti)',
    category: 'Insurance Plans',
    rl1Boxes: 'Reduces Box A & J',
    t4Boxes: 'N/A',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: '$2.74/day (individual) | $10.96/day (family/other)',
    descriptionEn: 'Reduces taxable health premium for employees not subject to Health Insurance Act (e.g. posted abroad).',
    descriptionFr: 'Réduit l\'avantage imposable santé pour employés non assujettis à la RAMQ (ex: en poste à l\'étranger).',
    referencePdf: 'IN-253-V p.33-34'
  },
  low_interest_loan: {
    id: 'low_interest_loan',
    nameEn: 'Interest-Free or Low-Interest Loans',
    nameFr: 'Prêts sans intérêt ou à taux d\'intérêt réduit',
    category: 'Financial Benefits',
    rl1Boxes: 'A, L, (G) [or Box O for shareholders]',
    t4Boxes: '14, Code 36',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Q1: 4% | Q2: 4% | Q3: 3% | Q4: 3%',
    descriptionEn: 'Benefit is interest calculated at prescribed quarterly rates minus interest paid within 30 days after year-end. Exemption for <=$10k <=60 days.',
    descriptionFr: 'Intérêt au taux prescrit trimestriel moins intérêt payé dans les 30 jours suivant la fin d\'année.',
    referencePdf: 'IN-253-V p.7, 66-68 | T4130 p.25-27'
  },
  tfsa_fhsa_rrsp: {
    id: 'tfsa_fhsa_rrsp',
    nameEn: 'Employer Contributions to TFSA / FHSA / RRSP',
    nameFr: 'Cotisations de l\'employeur au CELI / CELIAPP / REER',
    category: 'Financial Benefits',
    rl1Boxes: 'A, L, (G, I)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: true,
    subjectToEi: true,
    subjectToTax: true,
    rates2025: 'Full amount contributed by employer',
    descriptionEn: 'Employer contributions and paid admin fees are taxable cash benefits subject to deductions.',
    descriptionFr: 'Cotisations et frais administratifs payés par l\'employeur imposables et cotisables.',
    referencePdf: 'IN-253-V p.56-57 | T4130 p.31, 37'
  },
  gifts_rewards: {
    id: 'gifts_rewards',
    nameEn: 'Gifts and Rewards',
    nameFr: 'Cadeaux et récompenses',
    category: 'Other Benefits',
    rl1Boxes: 'A, L (portion > $500) | Cash: A, G, I, L',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Non-cash special occasion: $500 exempt/yr | Long-service (5+ yrs): $500 exempt | Cash: 100% taxable',
    descriptionEn: 'Non-cash gifts up to $500/year and long-service awards up to $500 are exempt. Excess and all cash gifts are taxable.',
    descriptionFr: 'Cadeaux en nature jusqu\'à 500 $/an et prix pour années de service (5+ ans) jusqu\'à 500 $ exonérés. Excédent et argent imposables.',
    referencePdf: 'IN-253-V p.53-54 | T4130 p.21-22'
  },
  cryptoassets: {
    id: 'cryptoassets',
    nameEn: 'Cryptoassets Remuneration',
    nameFr: 'Rémunération en cryptoactifs',
    category: 'Other Benefits',
    rl1Boxes: 'A, L, (G)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'FMV in CAD at time of transfer',
    descriptionEn: 'Cryptoassets are treated as property (benefit in kind) valued at fair market value in Canadian dollars.',
    descriptionFr: 'Les cryptoactifs sont traités comme un bien évalué à la JVM en dollars canadiens.',
    referencePdf: 'IN-253-V p.61 | T4130 p.6'
  },
  moving_relocation: {
    id: 'moving_relocation',
    nameEn: 'Moving & Relocation Expenses / Housing Loss',
    nameFr: 'Frais de déménagement et perte sur vente d\'habitation',
    category: 'Other Benefits',
    rl1Boxes: 'A, G, I, L',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: true,
    subjectToEi: true,
    subjectToTax: true,
    rates2025: 'Non-accountable allowance > $650 is taxable | Housing loss: 50% of amount > $15,000 is taxable',
    descriptionEn: 'Eligible moving reimbursements are tax-free. Non-accountable moving allowances over $650 and 50% of housing loss compensation over $15,000 are taxable.',
    descriptionFr: 'Déménagement admissible non imposable. Allocation forfaitaire > 650 $ et 50% des pertes immobilières > 15 000 $ imposables.',
    referencePdf: 'IN-253-V p.58-59 | T4130 p.28-29'
  },
  security_options: {
    id: 'security_options',
    nameEn: 'Security Options (Stock Options)',
    nameFr: 'Options d\'achat de titres (options d\'achat d\'actions)',
    category: 'Other Benefits',
    rl1Boxes: 'A, L (code L-9/L-10)',
    t4Boxes: '14, Code 38/39/90',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'Benefit = FMV at acquisition - price paid | 25% or 50% deduction available',
    descriptionEn: 'Taxable benefit when exercised (or when CCPC shares sold). Security option deduction of 25% or 50% applies under conditions.',
    descriptionFr: 'Avantage lors de l\'exercice de l\'option. Déduction de 25 % ou 50 % applicable selon les critères.',
    referencePdf: 'IN-253-V p.7, 61-66 | T4130 p.3, 32-36'
  },
  other_benefit: {
    id: 'other_benefit',
    nameEn: 'Other Taxable Benefits',
    nameFr: 'Autres avantages imposables',
    category: 'Other Benefits',
    rl1Boxes: 'A, L, (G, I)',
    t4Boxes: '14, Code 40',
    subjectToQpp: true,
    subjectToQpip: false,
    subjectToEi: false,
    subjectToTax: true,
    rates2025: 'FMV including GST & QST',
    descriptionEn: 'Any other personal advantage provided to employee due to employment office.',
    descriptionFr: 'Tout autre avantage personnel consenti à l\'employé en raison de sa charge ou de son emploi.',
    referencePdf: 'IN-253-V p.10-12 | T4130 p.6-7'
  }
};

/**
 * Helper calculation functions for specific 2025 Revenu Québec rules
 */
export const TaxableBenefitCalculators = {
  /**
   * 1. Motor Vehicle Allowance Reasonable Rate (2025)
   */
  calculateMotorVehicleAllowance: (totalKm: number, allowancePaid: number, inTerritory: boolean = false) => {
    const rateFirst5000 = inTerritory ? 0.76 : 0.72;
    const rateOver5000 = inTerritory ? 0.70 : 0.66;
    
    let reasonableMax = 0;
    if (totalKm <= 5000) {
      reasonableMax = totalKm * rateFirst5000;
    } else {
      reasonableMax = 5000 * rateFirst5000 + (totalKm - 5000) * rateOver5000;
    }

    const isExcess = allowancePaid > reasonableMax;
    const taxableAmount = isExcess ? allowancePaid - reasonableMax : 0;
    const nonTaxableAmount = Math.min(allowancePaid, reasonableMax);

    return {
      reasonableMax,
      taxableAmount,
      nonTaxableAmount,
      isReasonable: !isExcess,
      explanationEn: `2025 Rate: $${rateFirst5000.toFixed(2)}/km for first 5,000 km, $${rateOver5000.toFixed(2)}/km thereafter. Max reasonable allowance: $${reasonableMax.toFixed(2)}.`,
      explanationFr: `Taux 2025 : ${rateFirst5000.toFixed(2)} $/km pour les 5 000 1ers km, ${rateOver5000.toFixed(2)} $/km ensuite. Plafond raisonnable : ${reasonableMax.toFixed(2)} $.`
    };
  },

  /**
   * 2. Automobile Operating-Costs Benefit (2025)
   */
  calculateOperatingCostBenefit: (personalKm: number, isAutoSalesEmployee: boolean = false, reimbursementPaid: number = 0) => {
    const ratePerKm = isAutoSalesEmployee ? 0.31 : 0.34;
    const grossBenefit = personalKm * ratePerKm;
    const taxableBenefit = Math.max(0, grossBenefit - reimbursementPaid);

    return {
      ratePerKm,
      grossBenefit,
      taxableBenefit,
      reimbursementPaid,
      explanationEn: `2025 Prescribed Rate: $${ratePerKm.toFixed(2)}/km x ${personalKm} personal km = $${grossBenefit.toFixed(2)}. Minus reimbursement: $${reimbursementPaid.toFixed(2)} = Taxable Benefit $${taxableBenefit.toFixed(2)}.`,
      explanationFr: `Taux prescrit 2025 : ${ratePerKm.toFixed(2)} $/km x ${personalKm} km perso = ${grossBenefit.toFixed(2)} $. Moins remboursement : ${reimbursementPaid.toFixed(2)} $ = Avantage imposable ${taxableBenefit.toFixed(2)} $.`
    };
  },

  /**
   * 3. Automobile Standby Charge (2025)
   */
  calculateStandbyCharge: (
    costOrLease: number,
    type: 'owned_simplified' | 'owned_detailed' | 'leased',
    daysAvailable: number = 365,
    businessKmPercent: number = 0,
    personalKm: number = 0,
    reimbursement: number = 0
  ) => {
    let baseCharge = 0;
    if (type === 'owned_simplified') {
      baseCharge = costOrLease * 0.24;
    } else if (type === 'owned_detailed') {
      const periods = Math.max(1, Math.round(daysAvailable / 30));
      baseCharge = costOrLease * 0.02 * periods;
    } else {
      // Leased (2/3 of leasing cost)
      baseCharge = (costOrLease * (2 / 3));
    }

    // Check reduction if > 50% business driving and personal km <= (days/30)*1667
    let reductionFactor = 1.0;
    const periods = Math.max(1, Math.round(daysAvailable / 30));
    const capKm = periods * 1667;
    if (businessKmPercent > 50 && personalKm <= capKm && personalKm > 0) {
      reductionFactor = Math.min(1.0, personalKm / capKm);
    }

    const netCharge = Math.max(0, (baseCharge * reductionFactor) - reimbursement);
    return {
      baseCharge,
      reductionFactor,
      netCharge,
      explanationEn: `Standby Charge: Base $${baseCharge.toFixed(2)} (Reduction factor: ${(reductionFactor * 100).toFixed(1)}%) - Reimbursement $${reimbursement.toFixed(2)} = $${netCharge.toFixed(2)}.`,
      explanationFr: `Droit d'usage : Base ${baseCharge.toFixed(2)} $ (Facteur de réduction : ${(reductionFactor * 100).toFixed(1)} %) - Remboursement ${reimbursement.toFixed(2)} $ = ${netCharge.toFixed(2)} $.`
    };
  },

  /**
   * 4. Restaurant / Hotel Employee Meals (2025: max $11.57/meal)
   */
  calculateRestaurantMealBenefit: (mealCount: number, menuPricePerMeal: number, employeePaidPerMeal: number = 0) => {
    const cappedPrice = Math.min(menuPricePerMeal, 11.57);
    const discount = cappedPrice * 0.20;
    const perMealBenefit = Math.max(0, cappedPrice - discount - employeePaidPerMeal);
    const totalBenefit = perMealBenefit * mealCount;

    return {
      cappedPrice,
      perMealBenefit,
      totalBenefit,
      explanationEn: `2025 Meal Ceiling: $11.57. Value per meal: $${cappedPrice.toFixed(2)} - 20% discount ($${discount.toFixed(2)}) - employee paid ($${employeePaidPerMeal.toFixed(2)}) = $${perMealBenefit.toFixed(2)} x ${mealCount} meals = $${totalBenefit.toFixed(2)}.`,
      explanationFr: `Plafond repas 2025 : 11,57 $. Valeur par repas : ${cappedPrice.toFixed(2)} $ - rabais 20% (${discount.toFixed(2)} $) - payé (${employeePaidPerMeal.toFixed(2)} $) = ${perMealBenefit.toFixed(2)} $ x ${mealCount} repas = ${totalBenefit.toFixed(2)} $.`
    };
  },

  /**
   * 5. Restaurant / Hotel Employee Lodging (2025: max $61.71/week)
   */
  calculateRestaurantLodgingBenefit: (weeks: number, roomRatePerWeek: number, employeePaidPerWeek: number = 0) => {
    const cappedWeekly = Math.min(roomRatePerWeek, 61.71);
    const perWeekBenefit = Math.max(0, cappedWeekly - employeePaidPerWeek);
    const totalBenefit = perWeekBenefit * weeks;

    return {
      cappedWeekly,
      perWeekBenefit,
      totalBenefit,
      explanationEn: `2025 Lodging Ceiling: $61.71/week. Benefit per week: $${cappedWeekly.toFixed(2)} - rent paid ($${employeePaidPerWeek.toFixed(2)}) = $${perWeekBenefit.toFixed(2)} x ${weeks} weeks = $${totalBenefit.toFixed(2)}.`,
      explanationFr: `Plafond logement 2025 : 61,71 $/semaine. Avantage par semaine : ${cappedWeekly.toFixed(2)} $ - payé (${employeePaidPerWeek.toFixed(2)} $) = ${perWeekBenefit.toFixed(2)} $ x ${weeks} semaines = ${totalBenefit.toFixed(2)} $.`
    };
  },

  /**
   * 6. Low-Interest Loan Benefit (2025 Prescribed Rates: Q1=4%, Q2=4%, Q3=3%, Q4=3%)
   */
  calculateLowInterestLoanBenefit: (
    principal: number,
    quarterDays: { q1: number; q2: number; q3: number; q4: number },
    interestPaidByEmployee: number = 0
  ) => {
    const q1Interest = (0.04 * principal * (quarterDays.q1 / 365));
    const q2Interest = (0.04 * principal * (quarterDays.q2 / 365));
    const q3Interest = (0.03 * principal * (quarterDays.q3 / 365));
    const q4Interest = (0.03 * principal * (quarterDays.q4 / 365));
    const totalPrescribedInterest = q1Interest + q2Interest + q3Interest + q4Interest;
    const taxableBenefit = Math.max(0, totalPrescribedInterest - interestPaidByEmployee);

    return {
      q1Interest,
      q2Interest,
      q3Interest,
      q4Interest,
      totalPrescribedInterest,
      interestPaidByEmployee,
      taxableBenefit,
      explanationEn: `2025 Prescribed Interest (Q1 4%: $${q1Interest.toFixed(2)}, Q2 4%: $${q2Interest.toFixed(2)}, Q3 3%: $${q3Interest.toFixed(2)}, Q4 3%: $${q4Interest.toFixed(2)}) Total: $${totalPrescribedInterest.toFixed(2)} - Interest Paid: $${interestPaidByEmployee.toFixed(2)} = Taxable Benefit $${taxableBenefit.toFixed(2)}.`,
      explanationFr: `Intérêt prescrit 2025 (T1 4%: ${q1Interest.toFixed(2)} $, T2 4%: ${q2Interest.toFixed(2)} $, T3 3%: ${q3Interest.toFixed(2)} $, T4 3%: ${q4Interest.toFixed(2)} $) Total : ${totalPrescribedInterest.toFixed(2)} $ - Intérêt payé : ${interestPaidByEmployee.toFixed(2)} $ = Avantage ${taxableBenefit.toFixed(2)} $.`
    };
  },

  /**
   * 7. RAMQ Equivalency Reduction (2025)
   */
  calculateRamqReduction: (days: number, isFamily: boolean = false) => {
    const perDay = isFamily ? 10.96 : 2.74;
    const reductionAmount = days * perDay;
    const taxReduction = reductionAmount * 0.09; // 9% insurance tax reduction

    return {
      perDay,
      reductionAmount,
      taxReduction,
      totalReduction: reductionAmount + taxReduction,
      explanationEn: `2025 RAMQ Reduction: $${perDay.toFixed(2)}/day x ${days} days = $${reductionAmount.toFixed(2)} (Tax reduction 9%: $${taxReduction.toFixed(2)}).`,
      explanationFr: `Réduction RAMQ 2025 : ${perDay.toFixed(2)} $/jour x ${days} jours = ${reductionAmount.toFixed(2)} $ (Réduction taxe 9% : ${taxReduction.toFixed(2)} $).`
    };
  },

  /**
   * 8. Gifts & Rewards ($500 non-cash annual exemption, cash 100% taxable)
   */
  calculateGiftsRewards: (amount: number, isCashOrNearCash: boolean, priorNonCashYearTotal: number = 0) => {
    if (isCashOrNearCash) {
      return {
        taxableAmount: amount,
        nonTaxableAmount: 0,
        explanationEn: 'Cash and near-cash gift cards/certificates are 100% taxable with no exemption (Boxes A, G, I, L).',
        explanationFr: 'Les cadeaux en argent et cartes-cadeaux quasi-espèces sont 100 % imposables sans exemption (Cases A, G, I, L).'
      };
    }

    const availableExemption = Math.max(0, 500 - priorNonCashYearTotal);
    const nonTaxableAmount = Math.min(amount, availableExemption);
    const taxableAmount = Math.max(0, amount - nonTaxableAmount);

    return {
      taxableAmount,
      nonTaxableAmount,
      explanationEn: `Non-cash gift: $500 annual exemption limit applied. Taxable: $${taxableAmount.toFixed(2)}, Exempt: $${nonTaxableAmount.toFixed(2)}.`,
      explanationFr: `Cadeau en nature : Plafond d'exemption annuel de 500 $ appliqué. Imposable : ${taxableAmount.toFixed(2)} $, Exonéré : ${nonTaxableAmount.toFixed(2)} $.`
    };
  }
};

/**
 * Intelligent Document & Claim Parser for Revenu Québec 2025 / CRA T4130
 */
export function extractAndCategorizeFinancialDocument(rawText: string): ExtractedFinancialItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const results: ExtractedFinancialItem[] = [];

  const extractNumber = (str: string): number => {
    const match = str.match(/\$?\s*(\d+[\d\s,.]*\d+|\d+)/);
    if (!match) return 0;
    const clean = match[1].replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const extractKm = (str: string): number => {
    const match = str.match(/(\d+[\d\s,.]*)\s*(?:km|kilometres|kilomètres)/i);
    if (!match) return 0;
    return parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) || 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const amount = extractNumber(line);
    const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/) || [new Date().toISOString().split('T')[0]];
    const date = dateMatch[0];

    // 1. Motor Vehicle Allowance / Mileage Claim
    if (lower.includes('km') || lower.includes('kilomètre') || lower.includes('kilometre') || lower.includes('mileage') || lower.includes('indemnité kilométrique') || lower.includes('allocation auto')) {
      const km = extractKm(line) || 120;
      const parsedAmount = amount > 0 ? amount : km * 0.72;
      const isFlatRate = lower.includes('flat') || lower.includes('forfait') || lower.includes('fixe');
      
      if (isFlatRate) {
        // Flat rate is 100% taxable
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: parsedAmount,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'motor_vehicle_allowance',
          taxableAmount: parsedAmount,
          nonTaxableAmount: 0,
          rl1Box: 'A, G, I, L',
          t4Box: '14, Code 40',
          explanation: 'Lump-sum / flat-rate vehicle allowances not based strictly on business kilometres are 100% taxable benefits (IN-253-V p.15).',
          appliedRule: 'Revenu Québec 2025: Section 3.2 (IN-253-V p.15)',
          calculationDetails: { method: 'flat_rate_unreasonable', km: 0 }
        });
      } else {
        const calc = TaxableBenefitCalculators.calculateMotorVehicleAllowance(km, parsedAmount);
        if (calc.taxableAmount > 0) {
          results.push({
            id: `item_${Date.now()}_${i}`,
            date,
            description: `${line} (${km} km)`,
            rawText: line,
            totalAmount: parsedAmount,
            type: 'taxable_benefit',
            taxableBenefitCategory: 'motor_vehicle_allowance',
            taxableAmount: calc.taxableAmount,
            nonTaxableAmount: calc.nonTaxableAmount,
            rl1Box: 'A, G, I, L',
            t4Box: '14, Code 40',
            explanation: calc.explanationFr,
            appliedRule: 'Revenu Québec 2025: Taux raisonnable (0,72 $/km) dépassé',
            calculationDetails: { km, reasonableMax: calc.reasonableMax }
          });
        } else {
          results.push({
            id: `item_${Date.now()}_${i}`,
            date,
            description: `${line} (${km} km @ 0,72 $/km)`,
            rawText: line,
            totalAmount: parsedAmount,
            type: 'non_taxable_reimbursement',
            expenseCategory: 'vehicle',
            deductibleAmount: parsedAmount,
            explanation: 'Allocation raisonnable pour utilisation d\'un véhicule à moteur (0,72 $/km). Non imposable.',
            appliedRule: 'Revenu Québec 2025: Section 3.2 - Allocation exonérée'
          });
        }
      }
      continue;
    }

    // 2. Personal Use of Company Automobile / Standby Charge
    if (lower.includes('droit d\'usage') || lower.includes('standby charge') || lower.includes('auto de fonction') || lower.includes('frais de fonctionnement auto') || lower.includes('operating cost')) {
      const personalKm = extractKm(line) || 500;
      const isOperating = lower.includes('fonctionnement') || lower.includes('operating');
      
      if (isOperating) {
        const calc = TaxableBenefitCalculators.calculateOperatingCostBenefit(personalKm);
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: calc.grossBenefit,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'automobile_operating',
          taxableAmount: calc.taxableBenefit,
          nonTaxableAmount: 0,
          rl1Box: 'A, W, (G)',
          t4Box: '14, Code 34',
          explanation: calc.explanationFr,
          appliedRule: 'Revenu Québec 2025: Taux fixe de fonctionnement 0,34 $/km',
          calculationDetails: { personalKm, rate: 0.34 }
        });
      } else {
        const vehicleCost = amount > 1000 ? amount : 35000;
        const calc = TaxableBenefitCalculators.calculateStandbyCharge(vehicleCost, 'owned_simplified');
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: calc.netCharge,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'standby_charge',
          taxableAmount: calc.netCharge,
          nonTaxableAmount: 0,
          rl1Box: 'A, W, (G)',
          t4Box: '14, Code 34',
          explanation: `Méthode simplifiée 2025 : 24 % du coût du véhicule (${vehicleCost.toFixed(2)} $) = ${calc.netCharge.toFixed(2)} $.`,
          appliedRule: 'Revenu Québec 2025: Section 3.3.1.1',
          calculationDetails: { vehicleCost, method: '24% simplified' }
        });
      }
      continue;
    }

    // 3. Hotel / Restaurant Employee Meals & Lodging
    if (lower.includes('repas employé') || lower.includes('hotel meal') || lower.includes('restaurant meal') || lower.includes('repas restaurant')) {
      const mealCount = 1;
      const mealCost = amount > 0 ? amount : 18.0;
      const calc = TaxableBenefitCalculators.calculateRestaurantMealBenefit(mealCount, mealCost);
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: mealCost,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'restaurant_hotel_meals',
        taxableAmount: calc.totalBenefit,
        nonTaxableAmount: mealCost - calc.totalBenefit,
        rl1Box: 'A, V, (G)',
        t4Box: '14, Code 40',
        explanation: calc.explanationFr,
        appliedRule: 'Revenu Québec 2025: Plafond de 11,57 $/repas moins 20% (IN-253-V p.7, 42)',
        calculationDetails: { mealCount, cappedPrice: calc.cappedPrice }
      });
      continue;
    }

    // 4. Hotel / Restaurant Lodging
    if (lower.includes('logement employé') || lower.includes('hotel lodging') || lower.includes('chambre employe') || lower.includes('hébergement hôtel')) {
      const lodgingCost = amount > 0 ? amount : 120.0;
      const calc = TaxableBenefitCalculators.calculateRestaurantLodgingBenefit(1, lodgingCost);
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: lodgingCost,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'restaurant_hotel_lodging',
        taxableAmount: calc.totalBenefit,
        nonTaxableAmount: lodgingCost - calc.totalBenefit,
        rl1Box: 'A, V, (G)',
        t4Box: '14, Code 30',
        explanation: calc.explanationFr,
        appliedRule: 'Revenu Québec 2025: Plafond hebdomadaire de 61,71 $/semaine (IN-253-V p.7, 42)',
        calculationDetails: { weeks: 1, cappedWeekly: calc.cappedWeekly }
      });
      continue;
    }

    // 5. Free or Subsidized Lodging (Standard Rent)
    if (lower.includes('loyer subventionné') || lower.includes('free lodging') || lower.includes('subsidized housing') || lower.includes('logement gratuit')) {
      const fmvRent = amount > 0 ? amount : 950.0;
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: fmvRent,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'free_subsidized_lodging',
        taxableAmount: fmvRent,
        nonTaxableAmount: 0,
        rl1Box: 'A, V, (G or I)',
        t4Box: '14, Code 30',
        explanation: `Juste valeur marchande du loyer fourni par l'employeur (${fmvRent.toFixed(2)} $). Avantage imposable en nature.`,
        appliedRule: 'Revenu Québec 2025: Section 5.1 (IN-253-V p.37)',
        calculationDetails: { fmvRent }
      });
      continue;
    }

    // 6. Remote Work Sites & Remote Allowances
    if (lower.includes('allocation de départ') || lower.includes('check-out allowance') || lower.includes('compensation lieu éloigné') || lower.includes('remote allowance')) {
      const parsedAmount = amount > 0 ? amount : 250.0;
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: parsedAmount,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'remote_allowance',
        taxableAmount: parsedAmount,
        nonTaxableAmount: 0,
        rl1Box: 'A, G, I, L',
        t4Box: '14, Code 40',
        explanation: 'Les allocations de départ et de compensation pour séjour en région éloignée sont 100% imposables en espèces (IN-253-V p.39-40).',
        appliedRule: 'Revenu Québec 2025: Section 5.2.3 / 5.2.4',
        calculationDetails: { parsedAmount }
      });
      continue;
    }

    if (lower.includes('chantier particulier') || lower.includes('remote work site') || lower.includes('pension chantier')) {
      const isRemote = lower.includes('80 km') || lower.includes('éloigné') || lower.includes('remote');
      const parsedAmount = amount > 0 ? amount : 650.0;
      if (isRemote) {
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: parsedAmount,
          type: 'non_taxable_reimbursement',
          expenseCategory: 'travel',
          deductibleAmount: parsedAmount,
          explanation: 'Pension et hébergement sur chantier particulier situé à >= 80 km de la résidence principale. Exonéré d\'impôt (formulaire TD4/TP-1015).',
          appliedRule: 'Revenu Québec 2025: Section 5.2.1 (IN-253-V p.38)'
        });
      } else {
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: parsedAmount,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'remote_work_site',
          taxableAmount: parsedAmount,
          nonTaxableAmount: 0,
          rl1Box: 'A, V, (G, I)',
          t4Box: '14, Code 30',
          explanation: 'Chantier situé à moins de 80 km de la résidence. Non admissible à l\'exemption, valeur imposable.',
          appliedRule: 'Revenu Québec 2025: Section 5.2.1 (< 80 km)',
          calculationDetails: { parsedAmount }
        });
      }
      continue;
    }

    // 7. Group & Non-Group Insurance Plans
    if (lower.includes('assurance santé') || lower.includes('assurance maladie') || lower.includes('health insurance') || lower.includes('phsp') || lower.includes('dentaire')) {
      const premium = amount > 0 ? amount : 180.0;
      const premiumWithTax = premium * 1.09; // 9% QC Tax
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: premium,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'group_insurance_health',
        taxableAmount: premiumWithTax,
        nonTaxableAmount: 0,
        rl1Box: 'A, J, (G)',
        t4Box: 'Exonéré fédéral (T4 Case 85)',
        explanation: `Prime employeur ${premium.toFixed(2)} $ + taxe de 9 % (${(premium * 0.09).toFixed(2)} $) = ${premiumWithTax.toFixed(2)} $. Imposable au Québec (Case J), exonéré au fédéral.`,
        appliedRule: 'Revenu Québec 2025: Section 4.1.1 (IN-253-V p.29-30)',
        calculationDetails: { premium, tax9Percent: premium * 0.09, totalBenefit: premiumWithTax }
      });
      continue;
    }

    if (lower.includes('assurance-vie') || lower.includes('life insurance') || lower.includes('maladie grave') || lower.includes('critical illness')) {
      const premium = amount > 0 ? amount : 45.0;
      const premiumWithTax = premium * 1.09;
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: premium,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'group_insurance_life',
        taxableAmount: premiumWithTax,
        nonTaxableAmount: 0,
        rl1Box: 'A, L, (G)',
        t4Box: '14, Code 40',
        explanation: `Assurance-vie collective temporaire / maladies graves : ${premium.toFixed(2)} $ + taxe 9% = ${premiumWithTax.toFixed(2)} $. Imposable au fédéral et au Québec.`,
        appliedRule: 'Revenu Québec 2025: Section 4.1 | CRA T4130 p.22',
        calculationDetails: { premium, totalBenefit: premiumWithTax }
      });
      continue;
    }

    // 8. Low-Interest Loan
    if (lower.includes('prêt employé') || lower.includes('low interest loan') || lower.includes('emprunt à faible intérêt') || lower.includes('taux prescrit')) {
      const principal = amount > 1000 ? amount : 25000.0;
      const calc = TaxableBenefitCalculators.calculateLowInterestLoanBenefit(principal, { q1: 90, q2: 91, q3: 92, q4: 92 }, 0);
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: principal,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'low_interest_loan',
        taxableAmount: calc.taxableBenefit,
        nonTaxableAmount: 0,
        rl1Box: 'A, L, (G)',
        t4Box: '14, Code 36',
        explanation: calc.explanationFr,
        appliedRule: 'Revenu Québec 2025: Taux prescrits 2025 (T1: 4%, T2: 4%, T3: 3%, T4: 3%)',
        calculationDetails: { principal, totalPrescribedInterest: calc.totalPrescribedInterest }
      });
      continue;
    }

    // 9. Gifts & Rewards
    if (lower.includes('cadeau') || lower.includes('gift') || lower.includes('récompense') || lower.includes('carte-cadeau') || lower.includes('gift card') || lower.includes('bonus performance')) {
      const giftAmount = amount > 0 ? amount : 250.0;
      const isCash = lower.includes('argent') || lower.includes('cash') || lower.includes('carte-cadeau') || lower.includes('gift card') || lower.includes('performance');
      const calc = TaxableBenefitCalculators.calculateGiftsRewards(giftAmount, isCash, 0);
      
      if (calc.taxableAmount > 0) {
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: giftAmount,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'gifts_rewards',
          taxableAmount: calc.taxableAmount,
          nonTaxableAmount: calc.nonTaxableAmount,
          rl1Box: isCash ? 'A, G, I, L' : 'A, L, (G)',
          t4Box: '14, Code 40',
          explanation: calc.explanationFr,
          appliedRule: isCash ? 'Revenu Québec 2025: Cadeau en espèces 100% imposable' : 'Revenu Québec 2025: Seuil d\'exemption 500 $ (IN-253-V p.53-54)',
          calculationDetails: { giftAmount, isCash }
        });
      } else {
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: `${line} (Exonéré <= 500 $)`,
          rawText: line,
          totalAmount: giftAmount,
          type: 'non_taxable_reimbursement',
          expenseCategory: 'other',
          deductibleAmount: giftAmount,
          explanation: 'Cadeau non monétaire pour occasion spéciale inférieur ou égal à 500 $/an. Entièrement exonéré.',
          appliedRule: 'Revenu Québec 2025: Section 7.5 Exemption 500 $'
        });
      }
      continue;
    }

    // 10. TFSA / FHSA / RRSP / Crypto
    if (lower.includes('celi') || lower.includes('celiapp') || lower.includes('tfsa') || lower.includes('fhsa') || lower.includes('reer') || lower.includes('rrsp')) {
      const parsedAmount = amount > 0 ? amount : 500.0;
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: parsedAmount,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'tfsa_fhsa_rrsp',
        taxableAmount: parsedAmount,
        nonTaxableAmount: 0,
        rl1Box: 'A, L, (G, I)',
        t4Box: '14, Code 40',
        explanation: 'Cotisation patronale versée au compte d\'épargne de l\'employé (CELI/CELIAPP/REER). Avantage imposable en espèces.',
        appliedRule: 'Revenu Québec 2025: Section 7.9 - 7.11 (IN-253-V p.56-57)',
        calculationDetails: { parsedAmount }
      });
      continue;
    }

    if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('ethereum')) {
      const parsedAmount = amount > 0 ? amount : 1000.0;
      results.push({
        id: `item_${Date.now()}_${i}`,
        date,
        description: line,
        rawText: line,
        totalAmount: parsedAmount,
        type: 'taxable_benefit',
        taxableBenefitCategory: 'cryptoassets',
        taxableAmount: parsedAmount,
        nonTaxableAmount: 0,
        rl1Box: 'A, L, (G)',
        t4Box: '14, Code 40',
        explanation: 'Rémunération en cryptoactifs évaluée à la JVM en CAD au moment du versement (bien en nature imposable).',
        appliedRule: 'Revenu Québec 2025: Section 7.19 (IN-253-V p.61)',
        calculationDetails: { parsedAmount }
      });
      continue;
    }

    // 11. Relocation & Moving
    if (lower.includes('déménagement') || lower.includes('moving') || lower.includes('relocation') || lower.includes('perte habitation') || lower.includes('housing loss')) {
      const parsedAmount = amount > 0 ? amount : 800.0;
      const isHousingLoss = lower.includes('perte') || lower.includes('housing loss');
      
      if (isHousingLoss) {
        const taxable = Math.max(0, 0.5 * (parsedAmount - 15000));
        results.push({
          id: `item_${Date.now()}_${i}`,
          date,
          description: line,
          rawText: line,
          totalAmount: parsedAmount,
          type: 'taxable_benefit',
          taxableBenefitCategory: 'moving_relocation',
          taxableAmount: taxable,
          nonTaxableAmount: parsedAmount - taxable,
          rl1Box: 'A, G, I, L',
          t4Box: '14, Code 40',
          explanation: `Compensation pour perte sur vente d'habitation : 50% de l'excédent de 15 000 $ est imposable = ${taxable.toFixed(2)} $.`,
          appliedRule: 'Revenu Québec 2025: Section 7.15.3 (IN-253-V p.59)',
          calculationDetails: { parsedAmount, taxable }
        });
      } else {
        const nonAccountableOver650 = parsedAmount > 650 ? parsedAmount - 650 : 0;
        if (nonAccountableOver650 > 0 && (lower.includes('forfait') || lower.includes('non justifié') || lower.includes('allowance'))) {
          results.push({
            id: `item_${Date.now()}_${i}`,
            date,
            description: line,
            rawText: line,
            totalAmount: parsedAmount,
            type: 'taxable_benefit',
            taxableBenefitCategory: 'moving_relocation',
            taxableAmount: nonAccountableOver650,
            nonTaxableAmount: 650,
            rl1Box: 'A, G, I, L',
            t4Box: '14, Code 40',
            explanation: `Allocation non justifiable de déménagement supérieure à 650 $ : ${nonAccountableOver650.toFixed(2)} $ imposable.`,
            appliedRule: 'Revenu Québec 2025: Section 7.15.2 (IN-253-V p.59)',
            calculationDetails: { parsedAmount, taxable: nonAccountableOver650 }
          });
        } else {
          results.push({
            id: `item_${Date.now()}_${i}`,
            date,
            description: line,
            rawText: line,
            totalAmount: parsedAmount,
            type: 'non_taxable_reimbursement',
            expenseCategory: 'travel',
            deductibleAmount: parsedAmount,
            explanation: 'Remboursement de frais réels de déménagement d\'un employé muté. Non imposable.',
            appliedRule: 'Revenu Québec 2025: Section 7.15.1'
          });
        }
      }
      continue;
    }

    // 12. Standard Business Expenses
    let category = 'office';
    let deductible = 1.0;
    if (lower.includes('pub') || lower.includes('ad') || lower.includes('google') || lower.includes('facebook') || lower.includes('marketing')) {
      category = 'advertising';
    } else if (lower.includes('repas') || lower.includes('dîner') || lower.includes('lunch') || lower.includes('restaurant') || lower.includes('meal') || lower.includes('client')) {
      category = 'meals';
      deductible = 0.5;
    } else if (lower.includes('loyer') || lower.includes('rent') || lower.includes('bail')) {
      category = 'rent';
    } else if (lower.includes('logiciel') || lower.includes('software') || lower.includes('saas') || lower.includes('fournitures') || lower.includes('bureau')) {
      category = 'office';
    } else if (lower.includes('avocat') || lower.includes('comptable') || lower.includes('honoraires') || lower.includes('juridique')) {
      category = 'professional';
    } else if (lower.includes('vol') || lower.includes('avion') || lower.includes('train') || lower.includes('voyage')) {
      category = 'travel';
    } else if (lower.includes('hydro') || lower.includes('électricité') || lower.includes('internet') || lower.includes('télécom')) {
      category = 'utilities';
    }

    const parsedAmount = amount > 0 ? amount : 100.0;
    results.push({
      id: `item_${Date.now()}_${i}`,
      date,
      description: line,
      rawText: line,
      totalAmount: parsedAmount,
      type: 'business_expense',
      expenseCategory: category,
      deductibleAmount: parsedAmount * deductible,
      explanation: deductible === 0.5 
        ? 'Dépense d\'affaires standard de repas & représentation déductible à 50 % selon la Loi sur les impôts.' 
        : 'Dépense d\'exploitation déductible à 100 % pour l\'entreprise.',
      appliedRule: deductible === 0.5 ? 'Règle CRA / Revenu Québec 50% repas' : 'Dépense d\'entreprise standard déductible à 100%'
    });
  }

  return results;
}
