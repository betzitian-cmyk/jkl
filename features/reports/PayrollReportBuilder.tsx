import React, { useState, useMemo } from 'react';
import { PayrollItem, FilterRule, SortRule, GroupByType } from './types';
import { applyFilters, applySorting, applyGrouping } from './reportEngine';
import { formatCurrency } from '../../src/lib/utils';
import { 
  Filter, Plus, Trash2, ArrowUpDown, Download, Printer, 
  Search, SlidersHorizontal, CheckSquare, Square, Layers, 
  ChevronDown, RefreshCw, FileSpreadsheet, Users 
} from 'lucide-react';

interface PayrollReportBuilderProps {
  payrollItems: PayrollItem[];
  language?: string;
}

const ALL_PAYROLL_COLUMNS = [
  { key: 'employeeName', labelFr: 'Employé / Nom', labelEn: 'Employee / Name' },
  { key: 'payPeriod', labelFr: 'Période de Paie', labelEn: 'Pay Period' },
  { key: 'payDate', labelFr: 'Date de Paiement', labelEn: 'Pay Date' },
  { key: 'grossPay', labelFr: 'Salaire Brut ($)', labelEn: 'Gross Pay ($)' },
  { key: 'netPay', labelFr: 'Salaire Net ($)', labelEn: 'Net Pay ($)' },
  { key: 'totalTaxes', labelFr: 'Total Impôts & Cotisations', labelEn: 'Total Taxes & Withholding' },
  { key: 'totalDeductions', labelFr: 'Total Déductions', labelEn: 'Total Deductions' },
  { key: 'totalEarnings', labelFr: 'Total Gains', labelEn: 'Total Earnings' },
  { key: 'employerContributions', labelFr: 'Charges Patronales', labelEn: 'Employer Contributions' },
  { key: 'department', labelFr: 'Département', labelEn: 'Department' },
  { key: 'location', labelFr: 'Lieu / Emplacement', labelEn: 'Location' },
  { key: 'checkNumber', labelFr: 'No. Chèque / Paie', labelEn: 'Check No. / Pay No.' },
  { key: 'ytdEarnings', labelFr: 'Cumul Annuel (YTD) Gains', labelEn: 'YTD Earnings' },
  { key: 'ytdWithholding', labelFr: 'Cumul Annuel (YTD) Impôts', labelEn: 'YTD Withholding' },
  { key: 'status', labelFr: 'Statut', labelEn: 'Status' },
  { key: 'frequency', labelFr: 'Fréquence', labelEn: 'Frequency' },
  { key: 'vacationPay', labelFr: 'Vacances ($)', labelEn: 'Vacation Pay ($)' },
  { key: 'overtimePay', labelFr: 'Heures Sup. ($)', labelEn: 'Overtime Pay ($)' },
  { key: 'bonusPay', labelFr: 'Bonus ($)', labelEn: 'Bonus ($)' },
  { key: 'commissionPay', labelFr: 'Commission ($)', labelEn: 'Commission ($)' },
  { key: 'rrspContribution', labelFr: 'RRSP ($)', labelEn: 'RRSP ($)' },
  { key: 'taxableBenefitsFederal', labelFr: 'Avantages (Féd) ($)', labelEn: 'Taxable Benefits (Fed) ($)' },
  { key: 'taxableBenefitsProvincial', labelFr: 'Avantages (Prov) ($)', labelEn: 'Taxable Benefits (Prov) ($)' },
  { key: 'federalTax', labelFr: 'Impôt Fédéral ($)', labelEn: 'Federal Tax ($)' },
  { key: 'quebecTax', labelFr: 'Impôt Québec ($)', labelEn: 'Quebec Tax ($)' },
  { key: 'qpp', labelFr: 'RRQ ($)', labelEn: 'QPP ($)' },
  { key: 'qpip', labelFr: 'RQAP ($)', labelEn: 'QPIP ($)' },
  { key: 'ei', labelFr: 'AE ($)', labelEn: 'EI ($)' },
  { key: 'hsf', labelFr: 'FSS ($)', labelEn: 'HSF ($)' },
  { key: 'cnesst', labelFr: 'CNESST ($)', labelEn: 'CNESST ($)' },
  { key: 'employerQPP', labelFr: 'Part Patronale RRQ ($)', labelEn: 'Employer QPP ($)' },
  { key: 'employerQPIP', labelFr: 'Part Patronale RQAP ($)', labelEn: 'Employer QPIP ($)' },
  { key: 'employerEI', labelFr: 'Part Patronale AE ($)', labelEn: 'Employer EI ($)' },
  { key: 'employerCNESST', labelFr: 'Part Patronale CNESST ($)', labelEn: 'Employer CNESST ($)' },
  { key: 'totalEmployerCost', labelFr: 'Coût Total Patronal ($)', labelEn: 'Total Employer Cost ($)' },
];

export const PayrollReportBuilder: React.FC<PayrollReportBuilderProps> = ({ 
  payrollItems, 
  language = 'fr' 
}) => {
  const isFr = language === 'fr';

  // State
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'employeeName', 'payPeriod', 'payDate', 'grossPay', 'netPay', 'totalTaxes', 'department', 'status'
  ]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupBy, setGroupBy] = useState<GroupByType>('none');
  const [sorts, setSorts] = useState<SortRule[]>([{ field: 'payDate', direction: 'desc' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Filter adding helper
  const addFilter = () => {
    const newFilter: FilterRule = {
      id: `filt_${Date.now()}`,
      field: 'employeeName',
      operator: 'CONTAINS',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  // Process data through engine
  const processedData = useMemo(() => {
    let result = [...payrollItems];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.employeeName && p.employeeName.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.payPeriod && p.payPeriod.toLowerCase().includes(q)) ||
        (p.checkNumber && p.checkNumber.toLowerCase().includes(q))
      );
    }
    result = applyFilters(result, filters);
    result = applySorting(result, sorts);
    return result;
  }, [payrollItems, filters, sorts, searchTerm]);

  const groupedResult = useMemo(() => {
    return applyGrouping(processedData, groupBy);
  }, [processedData, groupBy]);

  const totals = useMemo(() => {
    return processedData.reduce((acc, item) => {
      acc.gross += Number(item.grossPay) || 0;
      acc.net += Number(item.netPay) || 0;
      acc.taxes += Number(item.totalTaxes) || 0;
      acc.employer += Number(item.employerContributions) || 0;
      return acc;
    }, { gross: 0, net: 0, taxes: 0, employer: 0 });
  }, [processedData]);

  const toggleColumn = (key: string) => {
    if (selectedColumns.includes(key)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter(c => c !== key));
      }
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const exportToCsv = () => {
    const headers = selectedColumns.join(',');
    const rows = processedData.map(item => 
      selectedColumns.map(col => `"${String(item[col] ?? '')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-grow md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isFr ? "Rechercher employé, département, période..." : "Search employee, department, period..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowColumnModal(!showColumnModal)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isFr ? `Colonnes (${selectedColumns.length})` : `Columns (${selectedColumns.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addFilter}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            {isFr ? 'Ajouter Filtre' : 'Add Filter'}
          </button>
          <button
            onClick={exportToCsv}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            {isFr ? 'Imprimer' : 'Print'}
          </button>
        </div>
      </div>

      {/* Column Customizer Dropdown Drawer */}
      {showColumnModal && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isFr ? 'Personnaliser les Colonnes Affichées' : 'Customize Display Columns'}
            </h4>
            <button onClick={() => setShowColumnModal(false)} className="text-xs text-blue-600 font-bold hover:underline">
              {isFr ? 'Fermer' : 'Close'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ALL_PAYROLL_COLUMNS.map(col => {
              const isSelected = selectedColumns.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                    isSelected ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-slate-600'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}
                  <span className="truncate">{isFr ? col.labelFr : col.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stacked Filter Rules Section */}
      {filters.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              {isFr ? `Filtres actifs (${filters.length})` : `Active Filters (${filters.length})`}
            </span>
            <button onClick={() => setFilters([])} className="text-[11px] text-rose-600 font-bold hover:underline">
              {isFr ? 'Effacer tous les filtres' : 'Clear all filters'}
            </button>
          </div>

          <div className="space-y-2">
            {filters.map(filter => (
              <div key={filter.id} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-amber-200 shadow-sm">
                <select
                  value={filter.field}
                  onChange={e => updateFilter(filter.id, { field: e.target.value })}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="employeeName">{isFr ? 'Nom de l\'employé' : 'Employee Name'}</option>
                  <option value="department">{isFr ? 'Département' : 'Department'}</option>
                  <option value="location">{isFr ? 'Lieu / Emplacement' : 'Location'}</option>
                  <option value="status">{isFr ? 'Statut' : 'Status'}</option>
                  <option value="grossPay">{isFr ? 'Salaire Brut ($)' : 'Gross Pay ($)'}</option>
                  <option value="netPay">{isFr ? 'Salaire Net ($)' : 'Net Pay ($)'}</option>
                  <option value="payDate">{isFr ? 'Date de Paiement' : 'Pay Date'}</option>
                </select>

                <select
                  value={filter.operator}
                  onChange={e => updateFilter(filter.id, { operator: e.target.value as any })}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value="CONTAINS">{isFr ? 'Contient' : 'Contains'}</option>
                  <option value="STARTS WITH">{isFr ? 'Commence par' : 'Starts With'}</option>
                  <option value="IN">IN (séparé par virgules)</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="BETWEEN">BETWEEN</option>
                </select>

                <input
                  type="text"
                  placeholder={isFr ? "Valeur..." : "Value..."}
                  value={filter.value}
                  onChange={e => updateFilter(filter.id, { value: e.target.value })}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-slate-800 outline-none flex-grow"
                />

                {filter.operator === 'BETWEEN' && (
                  <input
                    type="text"
                    placeholder={isFr ? "Max..." : "Max..."}
                    value={filter.secondValue || ''}
                    onChange={e => updateFilter(filter.id, { secondValue: e.target.value })}
                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-slate-800 outline-none w-28"
                  />
                )}

                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group By & Sort By Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{isFr ? 'Regrouper par' : 'Group By'}</span>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupByType)}
              className="block mt-0.5 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 outline-none"
            >
              <option value="none">{isFr ? 'Aucun regroupement' : 'No Grouping'}</option>
              <option value="employeeName">{isFr ? 'Employé' : 'Employee'}</option>
              <option value="payPeriod">{isFr ? 'Période de Paie' : 'Pay Period'}</option>
              <option value="department">{isFr ? 'Département' : 'Department'}</option>
              <option value="payDate">{isFr ? 'Date (Mois YYYY-MM)' : 'Date (Month YYYY-MM)'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <ArrowUpDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{isFr ? 'Trier par' : 'Sort By'}</span>
            <select
              value={`${sorts[0]?.field || 'payDate'}_${sorts[0]?.direction || 'desc'}`}
              onChange={e => {
                const [field, direction] = e.target.value.split('_');
                setSorts([{ field, direction: direction as any }]);
              }}
              className="block mt-0.5 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 outline-none"
            >
              <option value="payDate_desc">{isFr ? 'Date de Paie (récent au ancien)' : 'Pay Date (Newest)'}</option>
              <option value="payDate_asc">{isFr ? 'Date de Paie (ancien au récent)' : 'Pay Date (Oldest)'}</option>
              <option value="employeeName_asc">{isFr ? 'Employé (A-Z)' : 'Employee (A-Z)'}</option>
              <option value="grossPay_desc">{isFr ? 'Salaire Brut (plus élevé)' : 'Gross Pay (Highest)'}</option>
              <option value="netPay_desc">{isFr ? 'Salaire Net (plus élevé)' : 'Net Pay (Highest)'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{isFr ? 'Total Brut' : 'Total Gross'}</span>
            <p className="font-mono font-black text-slate-900 text-sm">{formatCurrency(totals.gross)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{isFr ? 'Total Net' : 'Total Net'}</span>
            <p className="font-mono font-black text-emerald-700 text-sm">{formatCurrency(totals.net)}</p>
          </div>
        </div>
      </div>

      {/* Main Data Table & Grouped Sections */}
      <div className="space-y-4">
        {groupedResult.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {groupBy !== 'none' && (
              <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
                <span className="uppercase tracking-wider">{group.groupKey} ({group.items.length} {isFr ? 'fiches' : 'stubs'})</span>
                <div className="flex gap-4 font-mono">
                  <span>Brut: {formatCurrency(group.items.reduce((s, i) => s + (Number(i.grossPay) || 0), 0))}</span>
                  <span>Net: {formatCurrency(group.items.reduce((s, i) => s + (Number(i.netPay) || 0), 0))}</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold tracking-wider">
                  <tr>
                    {selectedColumns.map(colKey => {
                      const colObj = ALL_PAYROLL_COLUMNS.find(c => c.key === colKey);
                      return (
                        <th key={colKey} className="px-4 py-3">
                          {colObj ? (isFr ? colObj.labelFr : colObj.labelEn) : colKey}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.items.length === 0 ? (
                    <tr>
                      <td colSpan={selectedColumns.length} className="px-4 py-8 text-center text-gray-400 italic">
                        {isFr ? 'Aucune fiche de paie ne correspond aux critères.' : 'No pay stubs match the criteria.'}
                      </td>
                    </tr>
                  ) : (
                    group.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                        {selectedColumns.map(colKey => {
                          const val = item[colKey];
                          let formattedVal = val !== undefined && val !== null ? String(val) : '-';
                          if ([
                            'grossPay', 'netPay', 'totalTaxes', 'totalDeductions', 'totalEarnings', 
                            'employerContributions', 'ytdEarnings', 'ytdWithholding',
                            'vacationPay', 'overtimePay', 'bonusPay', 'commissionPay', 'rrspContribution',
                            'taxableBenefitsFederal', 'taxableBenefitsProvincial', 'federalTax', 'quebecTax',
                            'qpp', 'qpip', 'ei', 'hsf', 'cnesst', 'employerQPP', 'employerQPIP',
                            'employerEI', 'employerCNESST', 'totalEmployerCost'
                          ].includes(colKey)) {
                            formattedVal = formatCurrency(Number(val) || 0);
                          }
                          return (
                            <td key={colKey} className="px-4 py-3 font-medium text-slate-800">
                              {colKey === 'grossPay' ? (
                                <span className="font-mono font-bold text-slate-900">{formattedVal}</span>
                              ) : colKey === 'netPay' ? (
                                <span className="font-mono font-bold text-emerald-700">{formattedVal}</span>
                              ) : colKey === 'status' ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  val === 'Paid' || val === 'Payé' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {formattedVal}
                                </span>
                              ) : (
                                formattedVal
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {groupBy !== 'none' && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{isFr ? 'Sous-total du groupe :' : 'Group Subtotal:'}</span>
                <div className="flex gap-4 font-mono">
                  <span>Brut: {formatCurrency(group.items.reduce((s, i) => s + (Number(i.grossPay) || 0), 0))}</span>
                  <span>Net: {formatCurrency(group.items.reduce((s, i) => s + (Number(i.netPay) || 0), 0))}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
