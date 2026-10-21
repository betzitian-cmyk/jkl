/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Quebec Payroll Constants
export const TAX_CONSTANTS = {
  2024: {
    FEDERAL: {
      BRACKETS: [
        { threshold: 0, rate: 0.15 },
        { threshold: 55867, rate: 0.205 },
        { threshold: 111733, rate: 0.26 },
        { threshold: 173205, rate: 0.29 },
        { threshold: 246752, rate: 0.33 },
      ],
      ABATEMENT_QUEBEC: 0.165,
      BASIC_PERSONAL_AMOUNT: 15705,
    },
    QUEBEC: {
      BRACKETS: [
        { threshold: 0, rate: 0.14 },
        { threshold: 51780, rate: 0.19 },
        { threshold: 103545, rate: 0.24 },
        { threshold: 126000, rate: 0.2575 },
      ],
      BASIC_PERSONAL_AMOUNT: 18056,
      WORKER_DEDUCTION_RATE: 0.06,
      WORKER_DEDUCTION_MAX: 1345,
    },
    QPP: {
      RATE: 0.064,
      EXEMPTION: 3500,
      MAX_MGA: 68500, // 2024 value
      MAX_MGAS: 73200,
      RATE_TIER2: 0.04,
      MAX_ANNUAL_EMPLOYEE_TIER1: 4160.00,
      MAX_ANNUAL_EMPLOYEE_TIER2: 188.00,
      MAX_ANNUAL_EMPLOYEE_TOTAL: 4348.00,
      MAX_ANNUAL_EMPLOYER_TOTAL: 4348.00,
    },
    QPIP: {
      RATE: 0.00494,
      MAX_INSURABLE_EARNINGS: 94000,
      EMPLOYER_RATE: 0.00692,
      MAX_ANNUAL_EMPLOYEE: 464.36,
      MAX_ANNUAL_EMPLOYER: 650.48,
    },
    EI_QUEBEC: {
      RATE: 0.0132,
      MAX_INSURABLE_EARNINGS: 63200,
      EMPLOYER_FACTOR: 1.4,
      MAX_ANNUAL_EMPLOYEE: 834.24,
      MAX_ANNUAL_EMPLOYER: 1167.94,
    },
    EMPLOYER: {
      HSF_RATE: 0.0165,
      LABOUR_STANDARDS_RATE: 0.0006,
      LABOUR_STANDARDS_MAX_EARNINGS: 94000,
    }
  },
  2025: {
    FEDERAL: {
      BRACKETS: [
        { threshold: 0, rate: 0.145 },
        { threshold: 57375, rate: 0.205 },
        { threshold: 114750, rate: 0.26 },
        { threshold: 177882, rate: 0.29 },
        { threshold: 253414, rate: 0.33 },
      ],
      ABATEMENT_QUEBEC: 0.165,
      BASIC_PERSONAL_AMOUNT: 16129,
    },
    QUEBEC: {
      BRACKETS: [
        { threshold: 0, rate: 0.14 },
        { threshold: 53255, rate: 0.19 },
        { threshold: 106495, rate: 0.24 },
        { threshold: 129590, rate: 0.2575 },
      ],
      BASIC_PERSONAL_AMOUNT: 18571,
      WORKER_DEDUCTION_RATE: 0.06,
      WORKER_DEDUCTION_MAX: 1400,
    },
    QPP: {
      RATE: 0.064,
      EXEMPTION: 3500,
      MAX_MGA: 71300,
      MAX_MGAS: 81200,
      RATE_TIER2: 0.04,
      MAX_ANNUAL_EMPLOYEE_TIER1: 4339.20,
      MAX_ANNUAL_EMPLOYEE_TIER2: 396.00,
      MAX_ANNUAL_EMPLOYEE_TOTAL: 4735.20,
      MAX_ANNUAL_EMPLOYER_TOTAL: 4735.20,
    },
    QPIP: {
      RATE: 0.00494,
      MAX_INSURABLE_EARNINGS: 98000,
      EMPLOYER_RATE: 0.00692,
      MAX_ANNUAL_EMPLOYEE: 484.12,
      MAX_ANNUAL_EMPLOYER: 678.16,
    },
    EI_QUEBEC: {
      RATE: 0.0131,
      MAX_INSURABLE_EARNINGS: 65700,
      EMPLOYER_FACTOR: 1.4,
      MAX_ANNUAL_EMPLOYEE: 860.67,
      MAX_ANNUAL_EMPLOYER: 1204.94,
    },
    EMPLOYER: {
      HSF_RATE: 0.0165,
      LABOUR_STANDARDS_RATE: 0.0006,
      LABOUR_STANDARDS_MAX_EARNINGS: 98000,
    }
  },
  2026: {
    FEDERAL: {
      BRACKETS: [
        { threshold: 0, rate: 0.15 },
        { threshold: 58523, rate: 0.205 },
        { threshold: 117045, rate: 0.26 },
        { threshold: 181440, rate: 0.29 },
        { threshold: 258482, rate: 0.33 },
      ],
      ABATEMENT_QUEBEC: 0.165,
      BASIC_PERSONAL_AMOUNT: 16452,
    },
    QUEBEC: {
      BRACKETS: [
        { threshold: 0, rate: 0.14 },
        { threshold: 54345, rate: 0.19 },
        { threshold: 108680, rate: 0.24 },
        { threshold: 132245, rate: 0.2575 },
      ],
      BASIC_PERSONAL_AMOUNT: 18952,
      WORKER_DEDUCTION_RATE: 0.06,
      WORKER_DEDUCTION_MAX: 1450,
    },
    QPP: {
      RATE: 0.063, // 5.30% + 1% = 6.3%
      EXEMPTION: 3500,
      MAX_MGA: 74600,
      MAX_MGAS: 85000,
      RATE_TIER2: 0.04,
      MAX_ANNUAL_EMPLOYEE_TIER1: 4479.30, // (74600-3500) * 0.063
      MAX_ANNUAL_EMPLOYEE_TIER2: 416.00,  // (85000-74600) * 0.04
      MAX_ANNUAL_EMPLOYEE_TOTAL: 4895.30,
      MAX_ANNUAL_EMPLOYER_TOTAL: 4895.30,
    },
    QPIP: {
      RATE: 0.00430,
      MAX_INSURABLE_EARNINGS: 103000,
      EMPLOYER_RATE: 0.00602,
      MAX_ANNUAL_EMPLOYEE: 442.90, // 103000 * 0.00430
      MAX_ANNUAL_EMPLOYER: 620.06, // 103000 * 0.00602
    },
    EI_QUEBEC: {
      RATE: 0.0130,
      MAX_INSURABLE_EARNINGS: 68900,
      EMPLOYER_FACTOR: 1.4,
      MAX_ANNUAL_EMPLOYEE: 895.70, // 68900 * 0.0130
      MAX_ANNUAL_EMPLOYER: 1253.98, // 895.70 * 1.4
    },
    EMPLOYER: {
      HSF_RATE: 0.0165,
      LABOUR_STANDARDS_RATE: 0.0006,
      LABOUR_STANDARDS_MAX_EARNINGS: 103000,
    }
  }
};

export const FREQUENCY_WEEKS: Record<string, number> = {
  weekly: 52,
  'bi-weekly': 26,
  'semi-monthly': 24,
  monthly: 12,
  annually: 1,
};

export interface CnesstSectorUnit {
  code: string;
  labelFr: string;
  labelEn: string;
  rate: number; // Percentage rate (e.g. 1.50 means 1.50% or $1.50 per $100 insurable payroll)
  riskLevel: 'low' | 'medium' | 'high';
}

export const CNESST_SECTORS: CnesstSectorUnit[] = [
  {
    code: '65110',
    labelFr: '65110 — Services informatiques, logiciels, conseil TI & finance',
    labelEn: '65110 — IT Services, Software Engineering, Consulting & Finance',
    rate: 0.55,
    riskLevel: 'low',
  },
  {
    code: '65120',
    labelFr: '65120 — Services professionnels, comptabilité, droit & administration',
    labelEn: '65120 — Professional Services, Accounting, Legal & Management',
    rate: 0.52,
    riskLevel: 'low',
  },
  {
    code: '54010',
    labelFr: '54010 — Commerce de détail, boutiques & distribution commerciale',
    labelEn: '54010 — Retail Trade, Stores & Commercial Distribution',
    rate: 1.42,
    riskLevel: 'low',
  },
  {
    code: '15000',
    labelFr: '15000 — Taux général moyen CNESST (Services & PME Québec)',
    labelEn: '15000 — General Average CNESST Rate (Quebec SMB & Services)',
    rate: 1.50,
    riskLevel: 'medium',
  },
  {
    code: '68010',
    labelFr: '68010 — Restauration, hôtellerie & services alimentaires',
    labelEn: '68010 — Restaurants, Hospitality & Food Services',
    rate: 1.68,
    riskLevel: 'medium',
  },
  {
    code: '61110',
    labelFr: '61110 — Soins de santé, cliniques médicales & services sociaux',
    labelEn: '61110 — Healthcare, Medical Clinics & Social Assistance',
    rate: 1.85,
    riskLevel: 'medium',
  },
  {
    code: '34010',
    labelFr: '34010 — Fabrication industrielle, usinage & assemblage manufacturier',
    labelEn: '34010 — Industrial Manufacturing, Machining & Assembly',
    rate: 2.65,
    riskLevel: 'medium',
  },
  {
    code: '57010',
    labelFr: '57010 — Transport routier, camionnage, logistique & entreposage',
    labelEn: '57010 — Road Transport, Trucking, Logistics & Warehousing',
    rate: 3.85,
    riskLevel: 'high',
  },
  {
    code: '80030',
    labelFr: '80030 — Construction, génie civil & travaux spécialisés',
    labelEn: '80030 — Construction, Civil Engineering & Specialized Trades',
    rate: 6.45,
    riskLevel: 'high',
  },
];

export const SALES_TAX_RATES = {
  GST: 0.05,       // 5.0% Federal Goods and Services Tax (TPS)
  QST: 0.09975,    // 9.975% Quebec Sales Tax (TVQ)
  COMBINED: 0.14975,
};

