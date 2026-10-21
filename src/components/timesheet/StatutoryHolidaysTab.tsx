/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../LanguageContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const StatutoryHolidaysTab: React.FC = () => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  // Quebec Statutory Holidays Calendar 2026 (Commission des normes, de l'équité, de la santé et de la sécurité du travail - CNESST)
  const holidays = [
    {
      date: '2026-01-01',
      nameFr: 'Jour de l\'An',
      nameEn: 'New Year\'s Day',
      type: 'Statutory (LNT)',
      descriptionFr: 'Férié chômé et payé selon la Loi sur les normes du travail (art. 60).',
      descriptionEn: 'Statutory holiday with statutory indemnity pursuant to Quebec Labour Standards Act.'
    },
    {
      date: '2026-04-03',
      nameFr: 'Vendredi Saint (ou Lundi de Pâques au choix de l\'employeur)',
      nameEn: 'Good Friday (or Easter Monday at employer\'s choice)',
      type: 'Statutory (LNT)',
      descriptionFr: 'L\'employeur a le choix d\'accorder le congé le Vendredi Saint ou le Lundi de Pâques.',
      descriptionEn: 'The employer decides whether Good Friday or Easter Monday is taken as the statutory holiday.'
    },
    {
      date: '2026-05-18',
      nameFr: 'Journée nationale des patriotes',
      nameEn: 'National Patriots\' Day',
      type: 'Statutory (LNT)',
      descriptionFr: 'Le lundi qui précède le 25 mai de chaque année.',
      descriptionEn: 'The Monday preceding May 25 of each year.'
    },
    {
      date: '2026-06-24',
      nameFr: 'Fête nationale du Québec (Saint-Jean-Baptiste)',
      nameEn: 'National Holiday of Quebec (Saint-Jean-Baptiste)',
      type: 'Fête nationale (Législation spécifique)',
      descriptionFr: 'Loi sur la fête nationale : Tout salarié a droit à un congé payé le 24 juin, sans condition de service continu.',
      descriptionEn: 'National Holiday Act: Every employee has the right to a paid statutory day off with no length-of-service requirement.'
    },
    {
      date: '2026-07-01',
      nameFr: 'Fête du Canada',
      nameEn: 'Canada Day',
      type: 'Statutory (LNT)',
      descriptionFr: 'Férié chômé et payé selon la Loi sur les normes du travail.',
      descriptionEn: 'Statutory holiday with full statutory compensation.'
    },
    {
      date: '2026-09-07',
      nameFr: 'Fête du Travail',
      nameEn: 'Labour Day',
      type: 'Statutory (LNT)',
      descriptionFr: 'Le premier lundi de septembre.',
      descriptionEn: 'First Monday in September.'
    },
    {
      date: '2026-10-12',
      nameFr: 'Action de grâces',
      nameEn: 'Thanksgiving',
      type: 'Statutory (LNT)',
      descriptionFr: 'Le deuxième lundi d\'octobre.',
      descriptionEn: 'Second Monday in October.'
    },
    {
      date: '2026-12-25',
      nameFr: 'Jour de Noël',
      nameEn: 'Christmas Day',
      type: 'Statutory (LNT)',
      descriptionFr: 'Férié chômé et payé selon la Loi sur les normes du travail.',
      descriptionEn: 'Statutory holiday with full statutory compensation.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black tracking-wider uppercase border border-blue-400/30">
              CNESST Québec 2026
            </span>
            <span className="text-xs text-slate-300 font-semibold">
              {lt('Calendrier Officiel des Jours Fériés Chômés et Payés', 'Official Statutory Paid Holidays Schedule')}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black tracking-tight">
            {lt('Calcul de l\'indemnité pour jour férié (Art. 62 LNT)', 'Statutory Holiday Indemnity Calculation (LNT Art. 62)')}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lt(
              'L\'indemnité est égale à 1/20 du salaire brut gagné au cours des 4 semaines complètes de paie précédant la semaine du congé (ou 1/60 pour un salarié à pourboire), excluant les heures supplémentaires.',
              'The statutory indemnity equals 1/20th of the gross wages earned during the 4 complete pay weeks preceding the holiday week (or 1/60th for tipped employees), excluding overtime.'
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex flex-col gap-1 min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-blue-200">
            {lt('Jours Fériés Légaux', 'Statutory Holidays')}
          </span>
          <span className="text-2xl font-black text-white">8 {lt('Jours', 'Days')}</span>
          <span className="text-[10px] text-slate-300">
            {lt('+ Fête nationale obligatoire', '+ Mandatory National Holiday')}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((h, idx) => (
          <div 
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700 font-black">
                  <span className="text-[10px] uppercase font-bold text-blue-500">
                    {new Date(h.date).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { month: 'short' })}
                  </span>
                  <span className="text-base leading-none">
                    {new Date(h.date).getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 tracking-tight">
                    {isFr ? h.nameFr : h.nameEn}
                  </h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                    {h.type}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 whitespace-nowrap">
                {lt('100% Payé', '100% Paid')}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isFr ? h.descriptionFr : h.descriptionEn}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>{lt('Date civile :', 'Civil date:')} {h.date}</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {lt('Pris en compte dans la paie', 'Included in Payroll')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
