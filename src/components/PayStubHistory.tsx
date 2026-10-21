/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PayStub, Employee } from '../types';
import { FileText, Download, Calendar, ArrowRight, Search, Plus, Filter, Calculator, ShieldCheck, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { PayStubDetail } from './PayStubDetail';
import { PayStubModal } from './PayStubModal';
import { useLanguage } from './LanguageContext';

interface PayStubHistoryProps {
  stubs: PayStub[];
  employees: Employee[];
  onPayStubCreated?: (stub: PayStub) => void;
}

export const PayStubHistory: React.FC<PayStubHistoryProps> = ({ 
  stubs, 
  employees,
  onPayStubCreated 
}) => {
  const { t, language } = useLanguage();
  const isFr = language === 'fr';

  const [selectedStub, setSelectedStub] = useState<PayStub | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [isPayStubModalOpen, setIsPayStubModalOpen] = useState(false);

  const getEmployeeForStub = (employeeId: string) => {
    return employees.find(e => e.id === employeeId);
  };

  const filteredStubs = useMemo(() => {
    return stubs.filter(stub => {
      const matchesSearch = stub.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            stub.payPeriod.includes(searchTerm) ||
                            stub.date.includes(searchTerm);
      const matchesEmp = selectedEmpFilter === 'all' || stub.employeeId === selectedEmpFilter;
      return matchesSearch && matchesEmp;
    });
  }, [stubs, searchTerm, selectedEmpFilter]);

  const summary = useMemo(() => {
    const totalGross = filteredStubs.reduce((acc, s) => acc + (s.grossPay || 0), 0);
    const totalDeductions = filteredStubs.reduce((acc, s) => acc + (s.totalDeductions || 0), 0);
    const totalNet = filteredStubs.reduce((acc, s) => acc + (s.netPay || 0), 0);
    const totalFedTax = filteredStubs.reduce((acc, s) => acc + (s.federalTax || 0), 0);
    const totalQcTax = filteredStubs.reduce((acc, s) => acc + (s.quebecTax || 0), 0);
    return { totalGross, totalDeductions, totalNet, totalFedTax, totalQcTax, count: filteredStubs.length };
  }, [filteredStubs]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
            {isFr ? 'Historique des bulletins de paie' : 'Pay Stub History'}
          </h3>
          <p className="text-xs text-slate-500">
            {isFr ? 'Consultez, filtrez, imprimez et téléchargez les fiches de paie transmises' : 'View, filter, print and download generated pay stubs'}
          </p>
        </div>

        <button
          onClick={() => setIsPayStubModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition shadow-lg active:scale-95 shrink-0"
        >
          <Calculator className="w-4 h-4 text-blue-200" />
          {isFr ? 'Générer un bulletin' : 'Generate Pay Stub'}
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isFr ? 'Bulletins Générés' : 'Stubs Count'}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{summary.count}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('gross_pay')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary.totalGross)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{isFr ? 'Impôts & Retenues' : 'Taxes & Deductions'}</p>
          <p className="text-2xl font-black text-rose-600 mt-1">-{formatCurrency(summary.totalDeductions)}</p>
          <p className="text-[9px] text-gray-400 font-medium">Fed: {formatCurrency(summary.totalFedTax)} | QC: {formatCurrency(summary.totalQcTax)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t('net_pay')}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(summary.totalNet)}</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder={isFr ? "Filtrer par employé ou période..." : "Search employee or period..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedEmpFilter}
            onChange={e => setSelectedEmpFilter(e.target.value)}
            className="w-full sm:w-56 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">{isFr ? 'Tous les employés' : 'All Employees'}</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pay Stubs Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStubs.map(stub => (
          <div key={stub.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-colors shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-800 truncate">{stub.employeeName}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" /> Date: <span className="font-bold text-slate-700">{stub.date}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 hidden sm:inline">&bull;</div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {isFr ? 'Période :' : 'Period:'} <span className="font-bold text-slate-700">{stub.payPeriod}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('net_pay')}</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-600">{formatCurrency(stub.netPay)}</p>
                </div>
                <button 
                  onClick={() => setSelectedStub(stub)}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
                  title={isFr ? 'Voir le bulletin détaillé' : 'View Full Stub'}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>

            {/* Itemized Deductions & Earnings Bar */}
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold">{t('gross_pay')}</p>
                <p className="text-xs font-extrabold text-slate-800">{formatCurrency(stub.grossPay)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold text-rose-500">
                  {isFr ? 'Impôt Fédéral' : 'Fed Tax'}
                </p>
                <p className="text-xs font-bold text-slate-700">{formatCurrency(stub.federalTax)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold text-rose-500">
                  {isFr ? 'Impôt Québec (RQ)' : 'Quebec Tax'}
                </p>
                <p className="text-xs font-bold text-slate-700">{formatCurrency(stub.quebecTax)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold text-amber-600">
                  RRQ / AE / RQAP
                </p>
                <p className="text-xs font-bold text-slate-700">{formatCurrency(stub.qpp + stub.ei + stub.qpip)}</p>
              </div>
              <div className="flex items-end justify-start sm:justify-end col-span-2 sm:col-span-1">
                <button 
                  onClick={() => setSelectedStub(stub)}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
                >
                  {isFr ? 'Voir le bulletin' : 'View Details'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredStubs.length === 0 && (
          <div className="p-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <FileText className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-sm font-medium">
              {isFr ? 'Aucun bulletin de paie ne correspond à votre recherche.' : 'No pay stubs found matching your search.'}
            </p>
            <button
              onClick={() => setIsPayStubModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5" />
              {isFr ? 'Créer un bulletin de paie' : 'Create Pay Stub'}
            </button>
          </div>
        )}
      </div>

      {/* Pay Stub Detail Modal */}
      {selectedStub && (
        <PayStubDetail 
          stub={selectedStub} 
          employee={getEmployeeForStub(selectedStub.employeeId)}
          onClose={() => setSelectedStub(null)}
        />
      )}

      {/* Pay Stub Creation Modal */}
      <PayStubModal
        isOpen={isPayStubModalOpen}
        onClose={() => setIsPayStubModalOpen(false)}
        employees={employees}
        onPayStubCreated={onPayStubCreated}
      />
    </div>
  );
};
