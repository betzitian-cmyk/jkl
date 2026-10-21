import React, { useState, useMemo } from 'react';
import { ExpenseItem, FilterRule, SortRule, GroupByType } from './types';
import { applyFilters, applySorting, applyGrouping } from './reportEngine';
import { formatCurrency } from '../../src/lib/utils';
import { 
  Filter, Plus, Trash2, ArrowUpDown, Download, Printer, 
  Search, SlidersHorizontal, CheckSquare, Square, Layers, 
  ChevronDown, RefreshCw, FileSpreadsheet 
} from 'lucide-react';

interface ExpensesReportBuilderProps {
  expenses: ExpenseItem[];
  language?: string;
}

const ALL_EXPENSE_COLUMNS = [
  { key: 'date', labelFr: 'Date', labelEn: 'Date' },
  { key: 'vendor', labelFr: 'Fournisseur / Vendeur', labelEn: 'Vendor' },
  { key: 'category', labelFr: 'Catégorie / Compte', labelEn: 'Category / Account' },
  { key: 'amount', labelFr: 'Montant ($)', labelEn: 'Amount ($)' },
  { key: 'taxAmount', labelFr: 'Montant Taxe', labelEn: 'Tax Amount' },
  { key: 'taxRate', labelFr: 'Taux Taxe (%)', labelEn: 'Tax Rate (%)' },
  { key: 'description', labelFr: 'Description / Mémo', labelEn: 'Description / Memo' },
  { key: 'referenceNumber', labelFr: 'Réf. / No. Pièce', labelEn: 'Ref / Check No.' },
  { key: 'status', labelFr: 'Statut', labelEn: 'Status' },
  { key: 'paymentMethod', labelFr: 'Mode de Paiement', labelEn: 'Payment Method' },
  // Expense Tab Fields
  { key: 'deductibleAmount', labelFr: 'Montant Déductible', labelEn: 'Deductible Amount' },
  { key: 'notes', labelFr: 'Notes / Remarques', labelEn: 'Notes' },
  { key: 'employeeName', labelFr: 'Employé Soumetteur', labelEn: 'Submitting Employee' },
  { key: 'source', labelFr: 'Source de Dépense', labelEn: 'Expense Source' },
  { key: 'taxStatus', labelFr: 'Statut Fiscal (Taxability)', labelEn: 'Tax Status' },
  { key: 'itcGst', labelFr: 'CTI TPS (ITC)', labelEn: 'ITC GST' },
  { key: 'itrQst', labelFr: 'RTI TVQ (ITR)', labelEn: 'ITR QST' },
  { key: 'approvedBy', labelFr: 'Approuvé Par', labelEn: 'Approved By' },
  { key: 'reimbursementMethod', labelFr: 'Méthode de Remboursement', labelEn: 'Reimbursement Method' },
  { key: 'reimbursementRef', labelFr: 'Réf. Remboursement', labelEn: 'Reimbursement Ref' },
  // Invoice Audit Result Dashboard Fields
  { key: 'invoiceNumber', labelFr: 'No. de Facture (Inv No.)', labelEn: 'Invoice Number' },
  { key: 'poNumber', labelFr: 'No. Bon de Commande (PO)', labelEn: 'PO Number' },
  { key: 'dueDate', labelFr: "Date d'Échéance", labelEn: 'Due Date' },
  { key: 'paymentTerms', labelFr: 'Conditions de Paiement', labelEn: 'Payment Terms' },
  { key: 'vendorAddress', labelFr: 'Adresse Fournisseur', labelEn: 'Vendor Address' },
  { key: 'customerName', labelFr: 'Nom du Client', labelEn: 'Customer Name' },
  { key: 'customerAddress', labelFr: 'Adresse du Client', labelEn: 'Customer Address' },
  { key: 'subtotal', labelFr: 'Sous-total Facture', labelEn: 'Subtotal' },
  { key: 'zeroRatedSubtotal', labelFr: 'Sous-total Taux Zéro', labelEn: 'Zero-Rated Subtotal' },
  { key: 'exemptSubtotal', labelFr: 'Sous-total Exonéré', labelEn: 'Exempt Subtotal' },
  { key: 'shipping', labelFr: "Frais d'Expédition", labelEn: 'Shipping Fee' },
  { key: 'freight', labelFr: 'Fret (Freight)', labelEn: 'Freight' },
  { key: 'delivery', labelFr: 'Livraison (Delivery)', labelEn: 'Delivery' },
  { key: 'handling', labelFr: 'Manutention (Handling)', labelEn: 'Handling' },
  { key: 'recycleFee', labelFr: 'Frais Recyclage (Éco)', labelEn: 'Recycle Fee' },
  { key: 'fuelSurcharge', labelFr: 'Surcharge Carburant', labelEn: 'Fuel Surcharge' },
  { key: 'surcharge', labelFr: 'Surcharges Diverses', labelEn: 'Surcharge' },
  { key: 'deposit', labelFr: 'Consigne (Deposit)', labelEn: 'Deposit' },
  { key: 'containerFee', labelFr: 'Frais Contenant', labelEn: 'Container Fee' },
  { key: 'environmentalFee', labelFr: 'Frais Environnementaux', labelEn: 'Environmental Fee' },
  { key: 'serviceFee', labelFr: 'Frais de Service', labelEn: 'Service Fee' },
  { key: 'tax', labelFr: 'Total Taxes Facture', labelEn: 'Total Tax' },
  { key: 'total', labelFr: 'Total Facture TTC', labelEn: 'Total Amount' },
  { key: 'currency', labelFr: 'Devise', labelEn: 'Currency' },
  { key: 'province', labelFr: 'Province Fiscale', labelEn: 'Province' },
  { key: 'taxGroup', labelFr: 'Groupe de Taxes', labelEn: 'Tax Group' },
  { key: 'gst', labelFr: 'TPS (GST)', labelEn: 'GST' },
  { key: 'qst', labelFr: 'TVQ (QST)', labelEn: 'QST' },
  { key: 'pst', labelFr: 'TVP (PST)', labelEn: 'PST' },
  { key: 'hst', labelFr: 'TVH (HST)', labelEn: 'HST' },
  { key: 'vendorBusinessNumber', labelFr: "No. d'Entreprise Fournisseur", labelEn: 'Vendor Business Number' },
  { key: 'vendorGstHst', labelFr: 'No. TPS/HST Fournisseur', labelEn: 'Vendor GST/HST No.' },
  { key: 'vendorQst', labelFr: 'No. TVQ Fournisseur', labelEn: 'Vendor QST No.' },
  { key: 'summary', labelFr: "Résumé d'Audit IA", labelEn: 'AI Audit Summary' },
];

export const ExpensesReportBuilder: React.FC<ExpensesReportBuilderProps> = ({ 
  expenses, 
  language = 'fr' 
}) => {
  const isFr = language === 'fr';

  // State
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'date', 'vendor', 'category', 'amount', 'taxAmount', 'status', 'paymentMethod'
  ]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupBy, setGroupBy] = useState<GroupByType>('none');
  const [sorts, setSorts] = useState<SortRule[]>([{ field: 'date', direction: 'desc' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Filter adding helper
  const addFilter = () => {
    const newFilter: FilterRule = {
      id: `filt_${Date.now()}`,
      field: 'category',
      operator: '=',
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
    let result = [...expenses];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(e => 
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q)) ||
        (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(q))
      );
    }
    result = applyFilters(result, filters);
    result = applySorting(result, sorts);
    return result;
  }, [expenses, filters, sorts, searchTerm]);

  const groupedResult = useMemo(() => {
    return applyGrouping(processedData, groupBy);
  }, [processedData, groupBy]);

  const totalAmountSum = useMemo(() => {
    return processedData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
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
    link.setAttribute("download", `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder={isFr ? "Rechercher fournisseur, catégorie, facture..." : "Search vendor, category, invoice..."}
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
            {isFr ? `Colonnes (${selectedColumns.length}/${ALL_EXPENSE_COLUMNS.length})` : `Columns (${selectedColumns.length}/${ALL_EXPENSE_COLUMNS.length})`}
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
              {isFr ? 'Personnaliser les Colonnes Affichées (Dépenses + Audit Factures)' : 'Customize Display Columns (Expenses + Invoice Audit)'}
            </h4>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedColumns(ALL_EXPENSE_COLUMNS.map(c => c.key))} 
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {isFr ? 'Tout sélectionner' : 'Select All'}
              </button>
              <button onClick={() => setShowColumnModal(false)} className="text-xs text-slate-500 font-bold hover:underline">
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1">
            {ALL_EXPENSE_COLUMNS.map(col => {
              const isSelected = selectedColumns.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                    isSelected ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-slate-600'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
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
                  <option value="category">{isFr ? 'Catégorie / Compte' : 'Category / Account'}</option>
                  <option value="vendor">{isFr ? 'Fournisseur' : 'Vendor'}</option>
                  <option value="status">{isFr ? 'Statut' : 'Status'}</option>
                  <option value="paymentMethod">{isFr ? 'Mode Paiement' : 'Payment Method'}</option>
                  <option value="amount">{isFr ? 'Montant ($)' : 'Amount ($)'}</option>
                  <option value="date">{isFr ? 'Date' : 'Date'}</option>
                  <option value="invoiceNumber">{isFr ? 'No. Facture' : 'Invoice No.'}</option>
                  <option value="source">{isFr ? 'Source' : 'Source'}</option>
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
              <option value="category">{isFr ? 'Catégorie / Compte' : 'Category / Account'}</option>
              <option value="vendor">{isFr ? 'Fournisseur' : 'Vendor'}</option>
              <option value="paymentMethod">{isFr ? 'Mode de Paiement' : 'Payment Method'}</option>
              <option value="source">{isFr ? 'Source de Dépense' : 'Expense Source'}</option>
              <option value="date">{isFr ? 'Date (Mois YYYY-MM)' : 'Date (Month YYYY-MM)'}</option>
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
              value={`${sorts[0]?.field || 'date'}_${sorts[0]?.direction || 'desc'}`}
              onChange={e => {
                const [field, direction] = e.target.value.split('_');
                setSorts([{ field, direction: direction as any }]);
              }}
              className="block mt-0.5 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 outline-none"
            >
              <option value="date_desc">{isFr ? 'Date (récent au ancien)' : 'Date (Newest)'}</option>
              <option value="date_asc">{isFr ? 'Date (ancien au récent)' : 'Date (Oldest)'}</option>
              <option value="amount_desc">{isFr ? 'Montant (élevé au bas)' : 'Amount (Highest)'}</option>
              <option value="amount_asc">{isFr ? 'Montant (bas au élevé)' : 'Amount (Lowest)'}</option>
              <option value="vendor_asc">{isFr ? 'Fournisseur (A-Z)' : 'Vendor (A-Z)'}</option>
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{isFr ? 'Total Dépenses' : 'Total Expenses'}</span>
          <p className="font-mono font-black text-slate-900 text-sm">{formatCurrency(totalAmountSum)}</p>
        </div>
      </div>

      {/* Main Data Table & Grouped Sections */}
      <div className="space-y-4">
        {groupedResult.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {groupBy !== 'none' && (
              <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
                <span className="uppercase tracking-wider">{group.groupKey} ({group.items.length} {isFr ? 'éléments' : 'items'})</span>
                <span className="font-mono">{formatCurrency(group.aggregates.sumAmount || 0)}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold tracking-wider">
                  <tr>
                    {selectedColumns.map(colKey => {
                      const colObj = ALL_EXPENSE_COLUMNS.find(c => c.key === colKey);
                      return (
                        <th key={colKey} className="px-4 py-3 whitespace-nowrap">
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
                        {isFr ? 'Aucune dépense ne correspond aux critères.' : 'No expenses match the criteria.'}
                      </td>
                    </tr>
                  ) : (
                    group.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                        {selectedColumns.map(colKey => {
                          const val = item[colKey];
                          let formattedVal = val !== undefined && val !== null ? String(val) : '-';
                          if ([
                            'amount', 'taxAmount', 'deductibleAmount', 'subtotal', 'zeroRatedSubtotal', 
                            'exemptSubtotal', 'shipping', 'freight', 'delivery', 'handling', 'recycleFee', 
                            'fuelSurcharge', 'surcharge', 'deposit', 'containerFee', 'environmentalFee', 
                            'serviceFee', 'tax', 'total', 'itcGst', 'itrQst', 'gst', 'qst', 'pst', 'hst'
                          ].includes(colKey)) {
                            formattedVal = formatCurrency(Number(val) || 0);
                          }
                          return (
                            <td key={colKey} className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                              {colKey === 'amount' || colKey === 'total' ? (
                                <span className="font-mono font-bold text-slate-900">{formattedVal}</span>
                              ) : colKey === 'status' ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  val === 'Paid' || val === 'Payé' || val === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                <span className="font-mono">{formatCurrency(group.aggregates.sumAmount || 0)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
