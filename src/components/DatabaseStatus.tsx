/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from './LanguageContext';

export const DatabaseStatus: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [dbDetails, setDbDetails] = useState<any>(null);
  const [dbMessage, setDbMessage] = useState('');
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const checkStatus = async () => {
    setDbStatus('loading');
    try {
      const response = await fetch('/api/db-status');
      const data = await response.json();
      if (data.status === 'connected') {
        setDbStatus('connected');
        setDbDetails(data);
      } else {
        setDbStatus('error');
        setDbMessage(data.message || 'Server reported issue');
      }
    } catch (error: any) {
      setDbStatus('error');
      setDbMessage(error.message);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consolidated PostgreSQL Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className={`w-5 h-5 ${dbStatus === 'connected' ? 'text-blue-600' : 'text-gray-300'}`} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">PostgreSQL Database Engine</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              dbStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 
              dbStatus === 'loading' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
            }`}>
              {dbStatus === 'connected' ? lt('Connecté', 'Connected') : dbStatus === 'loading' ? lt('Connexion...', 'Connecting...') : lt('Erreur', 'Error')}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>{lt('Moteur Actif', 'Active Engine')}</span>
              <span className="text-slate-700 font-semibold">{dbDetails?.engine || 'PostgreSQL (Drizzle ORM)'}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>{lt('Hôte', 'Host')}</span>
              <span className="text-slate-700">{dbDetails?.host || 'Local Container'}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>{lt('Base de données', 'Database')}</span>
              <span className="text-slate-700">{dbDetails?.database || 'postgres'}</span>
            </div>
          </div>

          {/* Module Record Counts */}
          {dbDetails?.counts && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.employee_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Employés', 'Employees')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.expense_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Dépenses', 'Expenses')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.invoice_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Factures INV', 'Invoices')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.pay_stub_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Bulletins', 'Pay Stubs')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.gps_trip_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Trajets GPS', 'GPS Trips')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.vendor_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Fournisseurs', 'Vendors')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.timesheet_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Feuilles Temps', 'Timesheets')}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="block text-xs font-bold text-slate-900">{dbDetails.counts.leave_request_count || 0}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{lt('Congés / Abs.', 'Leaves')}</span>
              </div>
            </div>
          )}

          {dbStatus === 'error' && (
            <div className="bg-red-50 p-3 rounded flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700 leading-tight">
                {dbMessage || lt('Impossible de se connecter à la base de données.', 'Unable to connect to the database.')}
              </p>
            </div>
          )}

          {dbStatus === 'connected' && (
            <div className="bg-emerald-50 p-3 rounded flex gap-2 items-start border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[10px] text-emerald-800 leading-tight">
                {lt('Base de données consolidée active. PaieQuébec, Invoice Audit et GPS TripLog partagent le même schéma relationnel PostgreSQL.', 'Consolidated database active. PaieQuébec, Invoice Audit, and GPS TripLog share the same PostgreSQL relational schema.')}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button 
              onClick={checkStatus}
              className="w-full py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${dbStatus === 'loading' ? 'animate-spin' : ''}`} /> {lt('Actualiser le statut', 'Refresh Status')}
            </button>
          </div>
        </div>

        {/* Unified Architecture Info */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">{lt('Architecture Consolidée', 'Consolidated Architecture')}</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{lt('Environnement Serveur', 'Server Environment')}</span>
                <span className="text-blue-400">Node.js / Express</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{lt('ORM Unique', 'Single Unified ORM')}</span>
                <span className="text-blue-400">Drizzle ORM (PostgreSQL)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{lt('Modules Fédérés', 'Federated Modules')}</span>
                <span className="text-emerald-400">PaieQuébec + GPS + Invoice Audit</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              {lt('Tous les sous-modules (GPS Speedometer, Invoice Audit et PaieQuébec V2) sont fédérés sur une seule source de vérité PostgreSQL. Aucun moteur de base de données tiers (MySQL ou SQLite) n\'est utilisé dans le code.', 'All sub-modules (GPS Speedometer, Invoice Audit, and PaieQuébec V2) are federated onto a single PostgreSQL source of truth. No third-party database engines (MySQL or SQLite) exist in the code.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
