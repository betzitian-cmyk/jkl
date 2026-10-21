/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Employee, PayStub, PayFrequency } from '../types';
import { X, Calculator, DollarSign, Calendar, CheckCircle2, FileText, User, AlertCircle } from 'lucide-react';
import { calculatePayroll } from '../lib/calculations';
import { calculatePayPeriod, formatCurrency } from '../lib/utils';
import { FREQUENCY_WEEKS } from '../lib/constants';
import { Storage } from '../lib/storage';
import { useLanguage } from './LanguageContext';

interface PayStubModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  employees: Employee[];
  onPayStubCreated?: (stub: PayStub) => void;
}

export const PayStubModal: React.FC<PayStubModalProps> = ({
  isOpen,
  onClose,
  employee: initialEmployee,
  employees,
  onPayStubCreated
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmployee?.id || '');
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || initialEmployee || employees[0];
  }, [employees, selectedEmpId, initialEmployee]);

  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmpId(initialEmployee.id);
    } else if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [initialEmployee, employees]);

  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<PayFrequency>(selectedEmployee?.frequency || 'bi-weekly');

  // Compensation values
  const [hoursWorked, setHoursWorked] = useState<number>(80);
  const [customGrossPay, setCustomGrossPay] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [bonusPay, setBonusPay] = useState<number>(0);
  const [vacationPay, setVacationPay] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto calculate default gross pay whenever employee or frequency changes
  useEffect(() => {
    if (selectedEmployee) {
      setFrequency(selectedEmployee.frequency);
      
      const periodsPerYear = FREQUENCY_WEEKS[selectedEmployee.frequency] ? (52 / FREQUENCY_WEEKS[selectedEmployee.frequency]) : 26;
      const hoursPerPeriod = Math.round((FREQUENCY_WEEKS[selectedEmployee.frequency] || 2) * 40);
      setHoursWorked(hoursPerPeriod);

      if (selectedEmployee.compensationType === 'hourly' && selectedEmployee.hourlyRate) {
        setCustomGrossPay(selectedEmployee.hourlyRate * hoursPerPeriod);
      } else if (selectedEmployee.baseSalary) {
        setCustomGrossPay(Math.round((selectedEmployee.baseSalary / periodsPerYear) * 100) / 100);
      }
    }
  }, [selectedEmployee]);

  const hourlyRateCalculated = useMemo(() => {
    if (!selectedEmployee) return 0;
    if (selectedEmployee.hourlyRate && selectedEmployee.hourlyRate > 0) return selectedEmployee.hourlyRate;
    const annualWeeks = 52;
    return Math.round((selectedEmployee.baseSalary / (annualWeeks * 40)) * 100) / 100;
  }, [selectedEmployee]);

  const regularPay = useMemo(() => {
    if (!selectedEmployee) return customGrossPay;
    if (selectedEmployee.compensationType === 'hourly') {
      return (selectedEmployee.hourlyRate || hourlyRateCalculated) * hoursWorked;
    }
    return customGrossPay;
  }, [selectedEmployee, hoursWorked, customGrossPay, hourlyRateCalculated]);

  const overtimePayCalculated = useMemo(() => {
    return overtimeHours * hourlyRateCalculated * 1.5;
  }, [overtimeHours, hourlyRateCalculated]);

  const totalCalculatedGross = useMemo(() => {
    return Math.round((regularPay + overtimePayCalculated + bonusPay + vacationPay) * 100) / 100;
  }, [regularPay, overtimePayCalculated, bonusPay, vacationPay]);

  const payPeriodText = useMemo(() => {
    const { startDate, endDate } = calculatePayPeriod(payDate, frequency);
    return `${startDate} - ${endDate}`;
  }, [payDate, frequency]);

  const payrollResult = useMemo(() => {
    if (!selectedEmployee) return null;

    return calculatePayroll({
      grossPay: totalCalculatedGross,
      frequency,
      year: 2026,
      employeeId: selectedEmployee.id,
      vacationPay,
      overtimePay: overtimePayCalculated,
      bonusPay,
      garnishments: selectedEmployee.garnishments || [],
      benefitContributions: selectedEmployee.benefitContributions,
      claimFederalBasicPersonalAmount: selectedEmployee.claimFederalBasicPersonalAmount ?? true,
      hasMultipleEmployers: selectedEmployee.hasMultipleEmployers ?? false,
      federalTd1ClaimAmount: selectedEmployee.federalTd1ClaimAmount,
      claimProvincialBasicPersonalAmount: selectedEmployee.claimProvincialBasicPersonalAmount ?? true,
      quebecTp1015Line10Code: selectedEmployee.quebecTp1015Line10Code || 'A',
      t1213FederalReduction: selectedEmployee.t1213Reduction || 0,
      tp1016QuebecReduction: selectedEmployee.tp1016Reduction || 0,
      voluntaryPreTaxRrsp: selectedEmployee.voluntaryPreTaxRrsp || 0,
      voluntaryPostTaxHealth: selectedEmployee.voluntaryPostTaxHealth || 0,
    });
  }, [selectedEmployee, totalCalculatedGross, frequency, vacationPay, overtimePayCalculated, bonusPay]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!selectedEmployee || !payrollResult) return;
    setIsGenerating(true);

    const newStub: Omit<PayStub, 'id'> = {
      ...payrollResult,
      employeeId: selectedEmployee.id,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      date: payDate,
      payPeriod: payPeriodText,
    };

    try {
      const savedStub = await Storage.addPayStub(newStub);
      setSuccessMsg(isFr ? 'Bulletin de paie généré avec succès !' : 'Pay stub successfully generated!');
      
      if (onPayStubCreated) {
        onPayStubCreated(savedStub);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setIsGenerating(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving pay stub', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-tight">
                {isFr ? 'Générer un bulletin de paie' : 'Generate Pay Stub'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFr ? 'Calcul automatique des retenues de paie pour le Québec & Canada' : 'Automated tax withholding calculation for Quebec & Canada'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Employee Selection & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" />
                {t('employees')}
              </label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.compensationType === 'hourly' ? `$${e.hourlyRate}/h` : `$${e.baseSalary}/an`})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                {isFr ? 'Date de versement' : 'Pay Date'}
              </label>
              <input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {t('frequency')}
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as PayFrequency)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="weekly">{t('weekly')}</option>
                <option value="bi-weekly">{t('bi_weekly')}</option>
                <option value="semi-monthly">{t('semi_monthly')}</option>
                <option value="monthly">{t('monthly')}</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{isFr ? 'Période couverte :' : 'Pay Period:'}</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">{payPeriodText}</span>
          </div>

          {/* Earnings Breakdown Inputs */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isFr ? 'Gains & Heures de la période' : 'Period Earnings & Hours'}
            </h4>

            {selectedEmployee?.compensationType === 'hourly' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900 uppercase">
                    {isFr ? 'Heures régulières travaillées' : 'Regular Hours Worked'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={hoursWorked}
                      onChange={e => setHoursWorked(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">hrs</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                    Taux: ${hourlyRateCalculated}/h = {formatCurrency(regularPay)}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-orange-900 uppercase">
                    {isFr ? 'Heures supplémentaires (1.5x)' : 'Overtime Hours (1.5x)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={overtimeHours}
                      onChange={e => setOvertimeHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">hrs</span>
                  </div>
                  <p className="text-[10px] text-orange-600 font-medium mt-0.5">
                    Taux sup: ${(hourlyRateCalculated * 1.5).toFixed(2)}/h = {formatCurrency(overtimePayCalculated)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">
                    {isFr ? 'Salaire brut de base' : 'Base Gross Pay'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customGrossPay}
                      onChange={e => setCustomGrossPay(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isFr ? `Basé sur salaire annuel de $${selectedEmployee?.baseSalary?.toLocaleString()}` : `Based on annual salary of $${selectedEmployee?.baseSalary?.toLocaleString()}`}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-orange-900 uppercase">
                    {isFr ? 'Montant Heures Supp. ($)' : 'Overtime Amount ($)'}
                  </label>
                  <input
                    type="number"
                    value={overtimeHours * hourlyRateCalculated * 1.5 || 0}
                    onChange={e => setOvertimeHours(parseFloat(e.target.value) / (hourlyRateCalculated * 1.5) || 0)}
                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('bonus')}</label>
                <input
                  type="number"
                  value={bonusPay}
                  onChange={e => setBonusPay(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800"
                  placeholder="0,00 $"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('vacation')}</label>
                <input
                  type="number"
                  value={vacationPay}
                  onChange={e => setVacationPay(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800"
                  placeholder="0,00 $"
                />
              </div>
            </div>
          </div>

          {/* Live Deductions & Net Pay Summary */}
          {payrollResult && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isFr ? 'Sommaire du bulletin de paie' : 'Pay Stub Summary'}
                  </p>
                  <p className="text-sm font-bold text-white">
                    {selectedEmployee?.firstName} {selectedEmployee?.lastName} &bull; NAS: {selectedEmployee?.sin.replace(/.(?=.{4})/g, '*')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('gross_pay')}</p>
                  <p className="text-lg font-extrabold text-blue-400">{formatCurrency(payrollResult.grossPay)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('fed_tax')}</p>
                  <p className="font-bold text-red-400">{formatCurrency(payrollResult.federalTax)}</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{isFr ? 'Impôt QC (RQ)' : 'Quebec Tax'}</p>
                  <p className="font-bold text-red-400">{formatCurrency(payrollResult.quebecTax)}</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('qpp')} (RRQ)</p>
                  <p className="font-bold text-amber-400">{formatCurrency(payrollResult.qpp)}</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('ei')} (AE)</p>
                  <p className="font-bold text-amber-400">{formatCurrency(payrollResult.ei)}</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('qpip')} (RQAP)</p>
                  <p className="font-bold text-amber-400">{formatCurrency(payrollResult.qpip)}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('total_deductions')}</p>
                  <p className="text-sm font-bold text-red-400">-{formatCurrency(payrollResult.totalDeductions)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('net_pay')}</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(payrollResult.netPay)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-slate-800 uppercase transition"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedEmployee}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {isFr ? 'Enregistrer & Générer Bulletin' : 'Save & Generate Stub'}
          </button>
        </div>
      </div>
    </div>
  );
};
