/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PayStub, Employee } from '../types';
import { formatCurrency } from '../lib/utils';
import { Printer, X, Download } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import jsPDF from 'jspdf';
import { safeAutoTable } from '../lib/pdfAutoTable';

interface PayStubDetailProps {
  stub: PayStub;
  employee?: Employee | null;
  onClose: () => void;
}

export const PayStubDetail: React.FC<PayStubDetailProps> = ({ stub, employee, onClose }) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(isFr ? 'BULLETIN DE PAIE OFFICIEL (QUÉBEC)' : 'OFFICIAL PAY STUB (QUEBEC)', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${isFr ? 'Date de versement' : 'Pay Date'}: ${stub.date}`, 14, 28);
    doc.text(`${isFr ? 'Période de paie' : 'Pay Period'}: ${stub.payPeriod}`, 14, 34);

    // Employee & Company Box
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(isFr ? 'EMPLOYÉ :' : 'EMPLOYEE:', 14, 46);
    doc.text(stub.employeeName, 14, 52);
    if (employee?.sin) {
      doc.text(`NAS / SIN: ${employee.sin.replace(/.(?=.{4})/g, '*')}`, 14, 58);
    }
    if (employee?.address) {
      doc.text(`${employee.address}, ${employee.city || ''} ${employee.postalCode || ''}`, 14, 64);
    }

    // Earnings Table
    const earningsData = [
      [isFr ? 'Salaire de base / Gains bruts' : 'Base Earnings / Gross Pay', formatCurrency(stub.grossPay - (stub.bonusPay || 0) - (stub.vacationPay || 0) - (stub.overtimePay || 0))],
      ...(stub.overtimePay ? [[isFr ? 'Heures en surtemps' : 'Overtime Pay', formatCurrency(stub.overtimePay)]] : []),
      ...(stub.bonusPay ? [[t('bonus'), formatCurrency(stub.bonusPay)]] : []),
      ...(stub.vacationPay ? [[t('vacation'), formatCurrency(stub.vacationPay)]] : []),
    ];

    safeAutoTable(doc, {
      startY: 72,
      head: [[isFr ? 'DESCRIPTION DES GAINS' : 'EARNINGS DESCRIPTION', 'MONTANT']],
      body: [
        ...earningsData,
        [{ content: isFr ? 'TOTAL GAINS BRUTS' : 'TOTAL GROSS EARNINGS', styles: { fontStyle: 'bold' } }, { content: formatCurrency(stub.grossPay), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] }
    });

    // Deductions Table
    const deductionsData = [
      [isFr ? 'Impôt Fédéral (ARC / CRA)' : 'Federal Income Tax (CRA)', formatCurrency(stub.federalTax)],
      [isFr ? 'Impôt du Québec (RQ / Revenu QC / QST)' : 'Quebec Provincial Tax (RQ)', formatCurrency(stub.quebecTax)],
      [isFr ? 'Régime de Rentes du Québec (RRQ / QPP)' : 'Quebec Pension Plan (QPP)', formatCurrency(stub.qpp)],
      [isFr ? 'Assurance-Emploi (AE / EI)' : 'Employment Insurance (EI)', formatCurrency(stub.ei)],
      [isFr ? 'Régime Québécois Assurance Parentale (RQAP / QPIP)' : 'Quebec Parental Insurance (QPIP)', formatCurrency(stub.qpip)],
    ];

    safeAutoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 120,
      head: [[isFr ? 'RETENUES À LA SOURCE (ITEMISÉES)' : 'ITEMIZED DEDUCTIONS', 'MONTANT']],
      body: [
        ...deductionsData,
        [{ content: isFr ? 'TOTAL RETENUES' : 'TOTAL DEDUCTIONS', styles: { fontStyle: 'bold' } }, { content: `-${formatCurrency(stub.totalDeductions)}`, styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }
    });

    // Net Pay Box
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 180;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, finalY, pageWidth - 28, 22, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(isFr ? 'SALAIRE NET PAYÉ :' : 'NET AMOUNT PAID:', 20, finalY + 14);
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(formatCurrency(stub.netPay), pageWidth - 20, finalY + 14, { align: 'right' });

    doc.save(`Bulletin_${stub.employeeName.replace(/\s+/g, '_')}_${stub.date}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 my-auto">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tight">
              {isFr ? 'Bulletin de Paie Officiel (Québec)' : 'Official Quebec Pay Stub'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {stub.employeeName} &bull; {stub.payPeriod}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={isFr ? 'Télécharger PDF' : 'Download PDF'}
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePrint} 
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={isFr ? 'Imprimer' : 'Print'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">ApplepAI Inc.</h2>
              <p className="text-xs text-gray-500 mt-0.5">1000 Rue Sherbrooke Ouest, Montréal, QC H3A 3G4</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">No. Employeur: 1234567890RS0001</p>
            </div>
            <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isFr ? 'Date de versement' : 'Pay Date'}</p>
              <p className="text-sm font-black text-slate-900">{stub.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{isFr ? 'Employé' : 'Employee'}</p>
              <p className="text-sm font-extrabold text-slate-900">{stub.employeeName}</p>
              {employee && (
                <>
                  <p className="text-xs text-gray-500 mt-0.5">{employee.address}, {employee.city} {employee.postalCode}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">NAS / SIN: {employee.sin ? employee.sin.replace(/.(?=.{4})/g, '*') : '***'}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{isFr ? 'Détails de la période' : 'Period Details'}</p>
              <p className="text-xs text-slate-800"><span className="font-bold">{isFr ? 'Période :' : 'Period:'}</span> {stub.payPeriod}</p>
              {employee && <p className="text-xs text-slate-800"><span className="font-bold">{isFr ? 'Fréquence :' : 'Frequency:'}</span> {employee.frequency}</p>}
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Earnings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-gray-200 pb-1">
                  {isFr ? 'Gains de la période' : 'Period Earnings'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'Salaire de base' : 'Base Earnings'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.grossPay - (stub.bonusPay || 0) - (stub.vacationPay || 0) - (stub.overtimePay || 0))}</span>
                  </div>
                  {stub.overtimePay ? (
                    <div className="flex justify-between items-center text-orange-700">
                      <span>{isFr ? 'En surtemps' : 'Overtime'}</span>
                      <span className="font-bold">{formatCurrency(stub.overtimePay)}</span>
                    </div>
                  ) : null}
                  {stub.bonusPay ? (
                    <div className="flex justify-between items-center text-blue-700">
                      <span>{t('bonus')}</span>
                      <span className="font-bold">{formatCurrency(stub.bonusPay)}</span>
                    </div>
                  ) : null}
                  {stub.vacationPay ? (
                    <div className="flex justify-between items-center text-blue-700">
                      <span>{t('vacation')}</span>
                      <span className="font-bold">{formatCurrency(stub.vacationPay)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>{isFr ? 'Total Gains Bruts' : 'Total Gross Earnings'}</span>
                  <span>{formatCurrency(stub.grossPay)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100 space-y-3">
                <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-widest border-b border-rose-200 pb-1">
                  {isFr ? 'Retenues à la source (Itemisées)' : 'Itemized Deductions'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'Impôt Fédéral (ARC)' : 'Federal Tax (CRA)'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.federalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'Impôt Québec (RQ / QST)' : 'Quebec Tax (RQ)'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.quebecTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'RRQ / QPP (Retraite QC)' : 'QPP Contribution'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.qpp)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'AE / EI (Assurance-Emploi)' : 'EI Contribution'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.ei)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{isFr ? 'RQAP / QPIP (Parental QC)' : 'QPIP Contribution'}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stub.qpip)}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-rose-200 flex justify-between items-center text-sm font-extrabold text-rose-800">
                  <span>{isFr ? 'Total Retenues' : 'Total Deductions'}</span>
                  <span>-{formatCurrency(stub.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* CNESST Sector Assessment & GST/QST Supplies Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold text-amber-900">
                  <span>{isFr ? 'Cotisation CNESST (Secteur)' : 'CNESST Sector Dues'}</span>
                  <span className="font-mono">{formatCurrency(stub.cnesst || stub.employerCNESST || 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-amber-800">
                  <span>{isFr ? `Unité #${stub.cnesstSectorCode || '15000'} (${(stub.cnesstRateApplied ?? 1.50).toFixed(2)}%)` : `Unit #${stub.cnesstSectorCode || '15000'} (${(stub.cnesstRateApplied ?? 1.50).toFixed(2)}%)`}</span>
                  <span>{isFr ? 'Normes (CNT) :' : 'Labour Standards:'} {formatCurrency(stub.labourStandards || 0)}</span>
                </div>
              </div>

              {((stub.taxableSupplyAmount || 0) > 0 || (stub.nonTaxableSupplyAmount || 0) > 0 || (stub.gst || 0) > 0 || (stub.qst || 0) > 0) ? (
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-emerald-900">
                    <span>{isFr ? 'Taxes TPS (5%) & TVQ (9,975%)' : 'GST (5%) & QST (9.975%)'}</span>
                    <span className="font-mono">{formatCurrency((stub.gst || 0) + (stub.qst || 0))}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-800">
                    <span>TPS: {formatCurrency(stub.gst || 0)} | TVQ: {formatCurrency(stub.qst || 0)}</span>
                    <span>{isFr ? 'Non-Taxable :' : 'Non-Taxable:'} {formatCurrency(stub.nonTaxableSupplyAmount || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-blue-900">
                    <span>{isFr ? 'Charges Patronales (FSS & RRQ/RQAP)' : 'Employer Statutory Contributions'}</span>
                    <span className="font-mono">{formatCurrency((stub.hsf || 0) + (stub.employerQPP || 0) + (stub.employerQPIP || 0) + (stub.employerEI || 0))}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-blue-700">
                    <span>FSS: {formatCurrency(stub.hsf || 0)}</span>
                    <span>{isFr ? 'Coût Total Employeur :' : 'Total Employer Cost:'} {formatCurrency(stub.totalEmployerCost || stub.grossPay)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Net Pay Box */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isFr ? 'Salaire Net Payé' : 'Net Amount Paid'}</p>
              <p className="text-xs text-slate-400 italic">{isFr ? 'Montant versé par dépôt direct / chèque' : 'Take-home amount disburse'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400">{formatCurrency(stub.netPay)}</p>
            </div>
          </div>

          <div className="pt-4 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 italic">
              {isFr
                ? 'Ce bulletin de paie est généré conformément aux normes de paie Revenu Québec et Agence du revenu du Canada.'
                : 'This pay stub is generated in accordance with Revenu Québec and Canada Revenue Agency payroll standards.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
