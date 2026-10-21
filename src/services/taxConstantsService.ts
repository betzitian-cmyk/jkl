import { fetchWithRetry } from '../lib/fetchWithRetry';

export interface QcTaxConstants {
  taxYear: number;
  qppBasicExemption: number;
  qppMpe: number;
  qppYampe: number;
  qppTier1EeRate: number;
  qppTier1ErRate: number;
  qppTier2EeRate: number;
  qppTier2ErRate: number;
  qpipMie: number;
  qpipEeRate: number;
  qpipErRate: number;
  cnesstMaxInsurable: number;
}

export function getDefaultTaxConstants(year: number = 2026): QcTaxConstants {
  return {
    taxYear: year,
    qppBasicExemption: 3500,
    qppMpe: 68500,
    qppYampe: year >= 2026 ? 77200 : 73200,
    qppTier1EeRate: 0.0640,
    qppTier1ErRate: 0.0640,
    qppTier2EeRate: 0.0400,
    qppTier2ErRate: 0.0400,
    qpipMie: 94000,
    qpipEeRate: 0.00494,
    qpipErRate: 0.00692,
    cnesstMaxInsurable: year === 2024 ? 94000 : year === 2025 ? 98000 : 103000,
  };
}

export async function fetchTaxConstants(year: number): Promise<QcTaxConstants | null> {
  const defaultTaxConstants = getDefaultTaxConstants(year);
  return await fetchWithRetry<QcTaxConstants>(
    `/api/tax-constants/${year}`,
    {},
    2,
    defaultTaxConstants
  );
}
