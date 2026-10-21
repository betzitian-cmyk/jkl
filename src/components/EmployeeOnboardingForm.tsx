import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeOnboardingSchema, EmployeeOnboardingInput } from '../types/onboarding';
import { FileText, Calculator, CheckCircle2, FileSpreadsheet, FileCheck2, ShieldCheck } from 'lucide-react';
import { FederalTD1Modal, TD1FormData } from './FederalTD1Modal';
import { FederalT1213Modal, T1213FormData } from './FederalT1213Modal';
import { QuebecTP1015Modal, TP1015FormData } from './QuebecTP1015Modal';
import { QuebecTP1016Modal, TP1016FormData } from './QuebecTP1016Modal';
import { useLanguage } from './LanguageContext';
import { PermissionsChecklist } from './PermissionsChecklist';
import { UserPermissions } from '../types';
import { STANDARD_EMPLOYEE_PRESET } from '../utils/permissionPresets';

export const EmployeeOnboardingForm: React.FC = () => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(EmployeeOnboardingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      middleInitial: '',
      sin: '',
      dob: '',
      address: '',
      city: '',
      postalCode: '',
      mailingAddress: '',
      phone: '',
      email: '',
      bankName: '',
      accountNumber: '',
      transitNumber: '',
      institutionNumber: '',
      payPeriodsPerYear: 26,
      estimatedAnnualIncome: 75000,
      fedAdditionalTax: 0,
      provAdditionalTax: 0,
      group_insurance: {
        is_covered_by_spouse_plan: false,
        selected_plan_post_validation: 'single',
      },
      garnishments: {
        has_active_garnishments: false,
        categories: [],
      },
      tax_distribution: {
        electronic_consent_t4_rl1: true,
        delivery_email: ''
      }
    }
  });

  const [spousalFiles, setSpousalFiles] = useState<FileList | null>(null);
  const [garnishmentFiles, setGarnishmentFiles] = useState<FileList | null>(null);
  const [isTD1ModalOpen, setIsTD1ModalOpen] = useState<boolean>(false);
  const [td1AppliedData, setTd1AppliedData] = useState<TD1FormData | null>(null);
  const [isT1213ModalOpen, setIsT1213ModalOpen] = useState<boolean>(false);
  const [t1213AppliedData, setT1213AppliedData] = useState<T1213FormData | null>(null);
  const [isTP1015ModalOpen, setIsTP1015ModalOpen] = useState<boolean>(false);
  const [tp1015AppliedData, setTp1015AppliedData] = useState<TP1015FormData | null>(null);
  const [isTP1016ModalOpen, setIsTP1016ModalOpen] = useState<boolean>(false);
  const [tp1016AppliedData, setTp1016AppliedData] = useState<TP1016FormData | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(STANDARD_EMPLOYEE_PRESET);

  // Avatar Upload States & Handlers
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const processAvatarFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(lt("Le fichier est trop volumineux. La taille maximale autorisée est de 5 Mo.", "File is too large. Max size allowed is 5MB."));
      return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(lt("Format de fichier invalide. Seuls les formats PNG, JPEG et WebP sont autorisés.", "Invalid file format. Only PNG, JPEG, and WebP images are allowed."));
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Watch values for conditional rendering
  const isCoveredBySpouse = watch('group_insurance.is_covered_by_spouse_plan');
  const hasGarnishments = watch('garnishments.has_active_garnishments');
  const garnishmentCategories = watch('garnishments.categories') || [];
  const electronicConsent = watch('tax_distribution.electronic_consent_t4_rl1');
  const userEmail = watch('email');
  const watchFirstName = watch('firstName');
  const watchLastName = watch('lastName');
  const applicantFullName = [watchFirstName, watchLastName].filter(Boolean).join(' ');
  const watchFedTaxCreditAmount = watch('fedTaxCreditAmount');
  const watchFedAdditionalTax = watch('fedAdditionalTax');
  const watchFedTaxReductionAmount = watch('fedTaxReductionAmount');
  const watchProvTaxCreditAmount = watch('provTaxCreditAmount');
  const watchProvAdditionalTax = watch('provAdditionalTax');
  const watchProvTaxReductionAmount = watch('provTaxReductionAmount');
  const watchProvTaxReductionCredits = watch('provTaxReductionCredits');

  const handleTD1Apply = (result: {
    line13: number;
    additionalTax: number;
    formData: TD1FormData;
  }) => {
    setValue('fedTaxCreditAmount', result.line13, { shouldValidate: true, shouldDirty: true });
    if (result.additionalTax > 0) {
      setValue('fedAdditionalTax', result.additionalTax, { shouldValidate: true, shouldDirty: true });
    }
    setTd1AppliedData(result.formData);
  };

  const handleT1213Apply = (result: {
    netWaiverAmount: number;
    reductionTarget: 'Salary' | 'Lump Sum';
    isCrossProvince: boolean;
    formData: T1213FormData;
  }) => {
    setValue('fedTaxReductionAmount', result.netWaiverAmount, { shouldValidate: true, shouldDirty: true });
    setT1213AppliedData(result.formData);
  };

  const handleTP1015Apply = (result: {
    line10: number;
    additionalTax: number;
    deductions: number;
    box20Exemption: boolean;
    formData: TP1015FormData;
  }) => {
    setValue('provTaxCreditAmount', result.line10, { shouldValidate: true, shouldDirty: true });
    if (result.additionalTax > 0) {
      setValue('provAdditionalTax', result.additionalTax, { shouldValidate: true, shouldDirty: true });
    }
    setTp1015AppliedData(result.formData);
  };

  const handleTP1016Apply = (result: {
    line10NetDeductions: number;
    line15TaxCredits: number;
    isEligible: boolean;
    formData: TP1016FormData;
  }) => {
    setValue('provTaxReductionAmount', result.line10NetDeductions, { shouldValidate: true, shouldDirty: true });
    setValue('provTaxReductionCredits', result.line15TaxCredits, { shouldValidate: true, shouldDirty: true });
    setTp1016AppliedData(result.formData);
  };

  const handleCategoryToggle = (category: "child_support" | "alimony" | "back_taxes" | "civil_judgment") => {
    const current = garnishmentCategories;
    const exists = current.includes(category);
    const next = exists 
      ? current.filter(c => c !== category)
      : [...current, category];
    setValue('garnishments.categories', next as any, { shouldValidate: true });
  };

  const onFormSubmit = async (data: any) => {
    const payload = new FormData();
    
    // Append simple fields
    payload.append('firstName', data.firstName);
    payload.append('lastName', data.lastName);
    payload.append('preferredName', data.preferredName || '');
    payload.append('middleInitial', data.middleInitial || '');
    payload.append('sin', data.sin);
    payload.append('dob', data.dob || '');
    payload.append('dateOfBirth', data.dob || '');
    payload.append('address', data.address);
    payload.append('city', data.city);
    payload.append('postalCode', data.postalCode);
    payload.append('mailingAddress', data.mailingAddress || '');
    payload.append('phone', data.phone || '');
    payload.append('email', data.email);

    // Direct Deposit
    payload.append('bankName', data.bankName || '');
    payload.append('accountNumber', data.accountNumber || '');
    payload.append('transitNumber', data.transitNumber || '');
    payload.append('institutionNumber', data.institutionNumber || '');

    payload.append('payPeriodsPerYear', String(data.payPeriodsPerYear));
    payload.append('estimatedAnnualIncome', String(data.estimatedAnnualIncome));
    
    // Explicitly handle blank strings as undefined to trigger backend statutory fallbacks
    const fedCredit = data.fedTaxCreditAmount === "" ? undefined : Number(data.fedTaxCreditAmount);
    const fedReduction = data.fedTaxReductionAmount === "" ? undefined : Number(data.fedTaxReductionAmount);
    const provCredit = data.provTaxCreditAmount === "" ? undefined : Number(data.provTaxCreditAmount);
    const provReduction = data.provTaxReductionAmount === "" ? undefined : Number(data.provTaxReductionAmount);
    const provCredits = data.provTaxReductionCredits === "" ? undefined : Number(data.provTaxReductionCredits);

    const taxPayload = {
      fedTaxCreditAmount: fedCredit,
      fedAdditionalTax: data.fedAdditionalTax === "" ? 0 : Number(data.fedAdditionalTax),
      fedTaxReductionAmount: fedReduction,
      provTaxCreditAmount: provCredit,
      provAdditionalTax: data.provAdditionalTax === "" ? 0 : Number(data.provAdditionalTax),
      provTaxReductionAmount: provReduction,
      provTaxReductionCredits: provCredits,
      metadata: {
        isFedDefaultApplied: fedCredit === undefined,
        isProvDefaultApplied: provCredit === undefined,
        td1Worksheet: td1AppliedData || undefined,
        t1213Worksheet: t1213AppliedData || undefined,
        tp1015Worksheet: tp1015AppliedData || undefined,
        tp1016Worksheet: tp1016AppliedData || undefined
      }
    };

    if (taxPayload.fedTaxCreditAmount !== undefined) payload.append('fedTaxCreditAmount', String(taxPayload.fedTaxCreditAmount));
    payload.append('fedAdditionalTax', String(taxPayload.fedAdditionalTax));
    if (taxPayload.fedTaxReductionAmount !== undefined) payload.append('fedTaxReductionAmount', String(taxPayload.fedTaxReductionAmount));
    if (taxPayload.provTaxCreditAmount !== undefined) payload.append('provTaxCreditAmount', String(taxPayload.provTaxCreditAmount));
    payload.append('provAdditionalTax', String(taxPayload.provAdditionalTax));
    if (taxPayload.provTaxReductionAmount !== undefined) payload.append('provTaxReductionAmount', String(taxPayload.provTaxReductionAmount));
    if (taxPayload.provTaxReductionCredits !== undefined) payload.append('provTaxReductionCredits', String(taxPayload.provTaxReductionCredits));
    payload.append('tax_metadata', JSON.stringify(taxPayload.metadata));

    // Complex Objects (JSON strings for backend parser)
    payload.append('group_insurance', JSON.stringify(data.group_insurance));
    payload.append('garnishments', JSON.stringify(data.garnishments));
    payload.append('background_check', JSON.stringify(data.background_check || { consent_criminal_record: false }));
    
    const taxDist = { ...data.tax_distribution };
    taxDist.delivery_email = taxDist.delivery_email || data.email;
    if (taxDist.electronic_consent_t4_rl1) {
      taxDist.consent_timestamp = new Date().toISOString();
    }
    payload.append('tax_distribution', JSON.stringify(taxDist));

    if (spousalFiles) {
      Array.from(spousalFiles).forEach(file => payload.append('spousalProofFiles', file as Blob));
    }

    if (garnishmentFiles) {
      Array.from(garnishmentFiles).forEach(file => payload.append('garnishmentFiles', file as Blob));
    }

    if (avatarFile) {
      payload.append('avatarFile', avatarFile);
    }

    try {
      const res = await fetch('/api/v1/onboard', {
        method: 'POST',
        body: payload
      });

      const result = await res.json();
      if (result.success) {
        alert('Onboarding profile successfully submitted!');
        window.location.reload();
      } else {
        console.error('Validation / submission errors:', result);
        const errorDetails = Array.isArray(result.errors) 
          ? result.errors.map((err: any) => `• ${err.path?.join('.') || 'Field'}: ${err.message}`).join('\n')
          : (result.message || 'Validation error');
        alert(`Error submitting onboarding form:\n\n${errorDetails}`);
      }
    } catch (err: any) {
      console.error('Network error during onboarding submit:', err);
      alert('Network error submitting onboarding form. Please check backend log.');
    }
  };

  const ErrorMsg = ({ name }: { name: string }) => {
    const getNestedError = (path: string) => {
      return path.split('.').reduce((obj, key) => obj?.[key], errors as any);
    };
    const error = getNestedError(name);
    if (!error) return null;
    return <p className="text-red-500 text-[10px] mt-1 font-medium">{error.message}</p>;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg space-y-8 font-sans">
      
      {/* HEADER */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{lt('Profil d\'intégration de l\'employé', 'Employee Onboarding Profile')}</h2>
        <p className="text-sm text-gray-600">
          {lt('Veuillez remplir vos informations personnelles, adresse, coordonnées de dépôt direct et préférences de conformité.', 'Please fill out your personal information, address, direct deposit details, and compliance preferences.')}
        </p>
      </div>

      {/* PART A: PERSONAL INFORMATION */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">{lt('Partie A : Informations personnelles et identification', 'Part A: Personal Information & Identification')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avatar Upload Dropzone */}
          <div className="col-span-1 md:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Photo de profil (Optionnel)', 'Avatar Profile Photo (Optional)')}</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!avatarPreview) {
                  document.getElementById('avatar-input')?.click();
                }
              }}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 transition-all duration-200 min-h-[160px] relative ${
                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              } ${!avatarPreview ? 'cursor-pointer' : ''}`}
            >
              <input 
                id="avatar-input"
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                className="hidden" 
                onChange={handleAvatarChange}
              />
              
              {avatarPreview ? (
                <div className="flex flex-col items-center space-y-3">
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-[150px] h-[150px] object-cover rounded-full border-2 border-white shadow-md"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('avatar-input')?.click();
                      }}
                      className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
                    >
                      {lt('Remplacer', 'Replace')}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAvatar();
                      }}
                      className="px-3 py-1 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition shadow-sm cursor-pointer"
                    >
                      {lt('Retirer', 'Remove')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-slate-500">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {lt('Glissez-déposez votre photo de profil, ou ', 'Drag and drop your profile photo, or ')}<span className="text-blue-600 font-semibold underline">{lt('parcourez', 'browse')}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {lt('Prend en charge PNG, JPEG, WebP (Max 5 Mo)', 'Supports PNG, JPEG, WebP (Max 5MB)')}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Prénom *', 'First Name *')}</label>
            <input 
              type="text" placeholder={lt('Prénom', 'First Name')}
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : ''}`}
              {...register('firstName')}
            />
            <ErrorMsg name="firstName" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Nom de famille *', 'Last Name *')}</label>
            <input 
              type="text" placeholder={lt('Nom de famille', 'Last Name')}
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : ''}`}
              {...register('lastName')}
            />
            <ErrorMsg name="lastName" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Nom d\'usage / Préféré', 'Preferred Name')}</label>
            <input 
              type="text" placeholder={lt('Nom d\'usage (optionnel)', 'Preferred Name (optional)')}
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('preferredName')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Initiale(s)', 'Middle Initial')}</label>
            <input 
              type="text" maxLength={2} placeholder="M.I." 
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('middleInitial')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Numéro d\'assurance sociale (NAS) *', 'Social Insurance Number (SIN) *')}</label>
            <input 
              type="text" placeholder="123-456-789"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.sin ? 'border-red-500' : ''}`}
              {...register('sin')}
            />
            <ErrorMsg name="sin" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Date de naissance *', 'Date of Birth (DOB) *')}</label>
            <input 
              type="date"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.dob ? 'border-red-500' : ''}`}
              {...register('dob')}
            />
            <ErrorMsg name="dob" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Adresse courriel *', 'Email Address *')}</label>
            <input 
              type="email" placeholder="employee@example.com"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email')}
            />
            <ErrorMsg name="email" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{lt('Numéro de téléphone', 'Phone Number')}</label>
            <input 
              type="tel" placeholder="(514) 555-0199" 
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('phone')}
            />
          </div>
        </div>
      </section>

      {/* PART B: TAX CREDITS & SOURCE DEDUCTIONS */}
      <section className="space-y-6 border-b pb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{lt('Partie B : Crédits d\'impôt et retenues à la source', 'Part B: Tax Credits & Source Deductions')}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {lt('Configurez vos retenues à la source standard. Laissez les montants des crédits vides pour appliquer automatiquement les seuils de référence légaux de 2026.', 'Configure your standard payroll deductions. Leave credit amounts blank to automatically apply 2026 statutory baselines.')}
          </p>
        </div>
        
        {/* Income Context */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            {lt('Contexte de revenu et paie', 'Income & Payroll Context')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lt('Revenu net annuel estimé ($) *', 'Estimated Annual Net Income ($) *')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 bg-white border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.estimatedAnnualIncome ? 'border-red-500' : 'border-slate-300'}`}
                  {...register('estimatedAnnualIncome', { valueAsNumber: true })}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {lt('Utilisé pour calculer la récupération fiscale fédérale pour les hauts revenus.', 'Used to calculate the dynamic high-income federal clawback.')}
              </p>
              <ErrorMsg name="estimatedAnnualIncome" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lt('Périodes de paie par an *', 'Pay Periods Per Year *')}
              </label>
              <select 
                className={`w-full p-2 bg-white border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.payPeriodsPerYear ? 'border-red-500' : 'border-slate-300'}`}
                {...register('payPeriodsPerYear', { valueAsNumber: true })}
              >
                <option value={52}>{lt('Hebdomadaire (52)', 'Weekly (52)')}</option>
                <option value={26}>{lt('Aux deux semaines (26)', 'Bi-Weekly (26)')}</option>
                <option value={24}>{lt('Bimensuel (24)', 'Semi-Monthly (24)')}</option>
                <option value={12}>{lt('Mensuel (12)', 'Monthly (12)')}</option>
              </select>
              <ErrorMsg name="payPeriodsPerYear" />
            </div>
          </div>
        </div>

        {/* Federal Section */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-800">
                {lt('Crédits d\'impôt fédéraux (Formulaire TD1)', 'Federal Tax Credits (Form TD1)')}
              </span>
              {td1AppliedData && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  {lt(`Ligne 13 TD1 appliquée : ${Number(td1AppliedData.line13_total).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })} $`, `TD1 Line 13 Applied: $${Number(td1AppliedData.line13_total).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTD1ModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer self-start sm:self-auto"
            >
              <FileText className="w-4 h-4" />
              <span>{lt('Ouvrir formulaire web fédéral TD1 2026 (Calculer Ligne 13)', 'Open 2026 Federal TD1 Webform (Calculate Line 13)')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="fedTaxCreditAmount" className="block text-xs font-semibold text-slate-700">
                  {lt('Montant total de la demande fédérale (Ligne 13)', 'Total Federal Claim Amount (Line 13)')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsTD1ModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>{lt('Calculer via TD1', 'Calculate via TD1')}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt(
                  'Laissez vide pour utiliser par défaut le montant personnel de base standard 2026 de 16 452 $, ou utilisez le formulaire web TD1 pour calculer.',
                  'Leave blank to automatically default to the standard 2026 Basic Personal Amount of $16,452, or use the TD1 webform to calculate.'
                )}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="16452.00"
                  className={`w-full pl-7 pr-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                    td1AppliedData ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-300'
                  }`}
                  {...register('fedTaxCreditAmount')}
                />
              </div>
              {td1AppliedData && (
                <p className="text-[10px] text-emerald-600 font-medium">
                  {lt('✓ Calculé à partir de la déclaration des crédits d\'impôt personnels 2026 (Lignes 1 à 12).', '✓ Calculated from 2026 Personal Tax Credits Return (Lines 1 to 12).')}
                </p>
              )}
              <ErrorMsg name="fedTaxCreditAmount" />
            </div>

            <div className="space-y-2">
              <label htmlFor="fedAdditionalTax" className="block text-xs font-semibold text-slate-700">
                {lt('Impôt fédéral supplémentaire à retenir par paie', 'Additional Federal Tax to Deduct Per Pay Cheque')}
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Correspond à la page 2 de votre formulaire TD1. Entrez un montant pour augmenter vos retenues.', 'Maps to Page 2 of your TD1 form. Enter an amount to increase your deductions.')}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('fedAdditionalTax')}
                />
              </div>
              <ErrorMsg name="fedAdditionalTax" />
            </div>
          </div>
        </div>

        {/* Federal Tax Reduction (Form T1213) Section */}
        <div className="p-4 bg-sky-50/60 rounded-lg border border-sky-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-sky-950">
                {lt('Réduction de retenue d\'impôt fédéral (Formulaire ARC T1213)', 'Federal Tax Deduction Reduction (CRA Form T1213)')}
              </span>
              {t1213AppliedData && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                  <CheckCircle2 className="w-3 h-3 text-sky-700" />
                  {lt(`Dérogation nette T1213 appliquée : ${Number(t1213AppliedData.t1213_net_waiver).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })} $`, `T1213 Net Waiver Applied: $${Number(t1213AppliedData.t1213_net_waiver).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`)}
                  {t1213AppliedData.t1213_tax_on === 'Lump Sum' && (isFr ? ` (Montant forfaire ${Number(t1213AppliedData.t1213_lump_sum).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $)` : ` (Lump Sum $${Number(t1213AppliedData.t1213_lump_sum).toLocaleString('en-CA', { minimumFractionDigits: 2 })})`)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsT1213ModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-sky-900 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{lt('Ouvrir formulaire web ARC T1213 2026 (Calculer réduction fiscale)', 'Open 2026 CRA Form T1213 Webform (Calculate Federal Tax Reduction)')}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {lt(
              'Le formulaire T1213 de l\'Agence du revenu du Canada permet aux employés ayant des dépenses déductibles (cotisations REER non-employeur, garde d\'enfants, dépenses d\'emploi certifiées ou intérêts d\'emprunt) ou des crédits non remboursables de demander une lettre d\'autorisation officielle réduisant l\'impôt fédéral retenu à la source.',
              'Canada Revenue Agency Form T1213 allows employees with deductible expenses (such as non-employer RRSP contributions, child care, certified employment expenses, or loan interest) or non-refundable credits to request an official Letter of Authority reducing federal tax withheld at source.'
            )}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="fedTaxReductionAmount" className="block text-xs font-semibold text-slate-700">
                  {lt('Réduction d\'impôt fédéral autorisée / Dérogation de déductions nettes (T1213)', 'Authorized Federal Tax Reduction / Net Deductions Waiver (Form T1213)')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsT1213ModalOpen(true)}
                  className="text-[11px] text-sky-800 hover:text-sky-950 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>{lt('Calculer via T1213', 'Calculate via T1213')}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Correspond au montant de dérogation net du formulaire ARC T1213 (Total des déductions moins ligne 12 autres revenus).', 'Maps to Net Waiver Amount from CRA Form T1213 (Total Deductions minus Line 12 Other Income).')}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 font-medium ${
                    t1213AppliedData ? 'border-sky-400 ring-1 ring-sky-300' : 'border-slate-300'
                  }`}
                  {...register('fedTaxReductionAmount')}
                />
              </div>
              {t1213AppliedData && (
                <p className="text-[10px] text-sky-800 font-medium">
                  {lt(`✓ Calculé d'après la base de dérogation nette T1213. Appliqué à ${t1213AppliedData.t1213_tax_on.toLowerCase()}.`, `✓ Calculated from CRA Form T1213 Net Waiver base. Applied to ${t1213AppliedData.t1213_tax_on.toLowerCase()}.`)}
                </p>
              )}
              <ErrorMsg name="fedTaxReductionAmount" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {lt('Portée de la réduction T1213 et statut interprovincial', 'T1213 Reduction Scope & Cross-Province Status')}
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Sommaire de la cible de réduction et de l\'évaluation interprovinciale configurée dans le formulaire T1213.', 'Summary of the reduction target and cross-province evaluation as configured in Form T1213.')}
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md text-xs space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lt('Cible :', 'Target:')}</span>
                  <span className="font-semibold text-slate-900">{t1213AppliedData?.t1213_tax_on ? (isFr && t1213AppliedData.t1213_tax_on === 'Salary' ? 'Salaire (Standard)' : t1213AppliedData.t1213_tax_on) : (isFr ? 'Salaire (Standard)' : 'Salary (Standard)')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lt('Interprovincial :', 'Cross-Province:')}</span>
                  <span className="font-semibold text-slate-900">
                    {t1213AppliedData?.t1213_diff_prov === 'Yes' ? (isFr ? `Oui (${t1213AppliedData.t1213_prov_worked})` : `Yes (${t1213AppliedData.t1213_prov_worked})`) : (isFr ? 'Non' : 'No')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Provincial Section */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-800">
                {lt('Crédits d\'impôt provinciaux du Québec (Formulaire TP-1015.3-V)', 'Québec Provincial Tax Credits (Form TP-1015.3-V)')}
              </span>
              {tp1015AppliedData && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  {lt(`Ligne 10 TP-1015.3-V appliquée : ${Number(tp1015AppliedData.tp_line10_total).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })} $`, `TP-1015.3-V Line 10 Applied: $${Number(tp1015AppliedData.tp_line10_total).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTP1015ModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lt('Ouvrir formulaire web Québec TP-1015.3-V 2026 (Calculer Ligne 10)', 'Open 2026 Québec TP-1015.3-V Webform (Calculate Line 10)')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="provTaxCreditAmount" className="block text-xs font-semibold text-slate-700">
                  {lt('Total des crédits d\'impôt personnels du Québec (Ligne 10)', 'Total Québec Personal Tax Credits (Line 10)')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsTP1015ModalOpen(true)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>{lt('Calculer via TP-1015.3-V', 'Calculate via TP-1015.3-V')}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt(
                  'Laissez vide pour utiliser par défaut le montant personnel de base du Québec 2026 de 18 952 $, ou utilisez le formulaire TP-1015.3-V pour calculer.',
                  'Leave blank to automatically default to the standard 2026 Québec Basic Personal Amount of $18,952, or use the TP-1015.3-V webform to calculate.'
                )}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="18952.00"
                  className={`w-full pl-7 pr-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
                    tp1015AppliedData ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-300'
                  }`}
                  {...register('provTaxCreditAmount')}
                />
              </div>
              {tp1015AppliedData && (
                <p className="text-[10px] text-emerald-700 font-medium">
                  {lt('✓ Calculé à partir de la déclaration des retenues à la source du Québec 2026 (Lignes 1 à 9).', '✓ Calculated from 2026 Québec Source Deductions Return (Lines 1 to 9).')}
                </p>
              )}
              <ErrorMsg name="provTaxCreditAmount" />
            </div>

            <div className="space-y-2">
              <label htmlFor="provAdditionalTax" className="block text-xs font-semibold text-slate-700">
                {lt('Impôt du Québec supplémentaire à retenir par paie', 'Additional Québec Tax to Withhold Per Pay Cheque')}
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Correspond à la ligne 11 de votre formulaire TP-1015.3-V. Entrez un montant pour augmenter la retenue provinciale.', 'Maps to Line 11 of your TP-1015.3-V form. Enter an amount to increase provincial withholding.')}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  {...register('provAdditionalTax')}
                />
              </div>
              <ErrorMsg name="provAdditionalTax" />
            </div>
          </div>
        </div>

        {/* Québec Tax Reduction (Form TP-1016-V) Section */}
        <div className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-cyan-950">
                {lt('Demande de réduction des retenues d\'impôt du Québec (Formulaire TP-1016-V)', 'Application for Reduction in Québec Income Tax Withholding (Form TP-1016-V)')}
              </span>
              {tp1016AppliedData && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-300">
                  <CheckCircle2 className="w-3 h-3 text-cyan-700" />
                  {lt(`TP-1016-V appliqué : Déductions nettes ${Number(tp1016AppliedData.line10_net_deductions).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2 })} $`, `TP-1016-V Applied: Net Deductions $${Number(tp1016AppliedData.line10_net_deductions).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`)}
                  {tp1016AppliedData.line15_total_credits > 0 && (isFr ? ` | Crédits ${Number(tp1016AppliedData.line15_total_credits).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $` : ` | Credits $${Number(tp1016AppliedData.line15_total_credits).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTP1016ModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{lt('Ouvrir formulaire web Québec TP-1016-V 2026 (Calculer réduction d\'impôt)', 'Open 2026 Québec TP-1016-V Webform (Calculate Tax Reduction)')}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {lt(
              'Revenu Québec autorise les employés à demander une réduction des retenues à la source s\'ils ont des déductions admissibles (Ligne 10 : REER, dépenses d\'emploi autorisées ≥ 2 000 $) ou des crédits d\'impôt non remboursables (Ligne 15 : fonds de travailleurs, dons ≥ 400 $) non pris en compte sur le TP-1015.3-V.',
              'Revenu Québec allows employees to apply for a reduction in source deductions if they have allowable deductions (Line 10: RRSP, authorized employment expenses ≥ $2,000) or non-refundable tax credits (Line 15: labour-sponsored funds, donations ≥ $400) not accounted for on Form TP-1015.3-V.'
            )}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="provTaxReductionAmount" className="block text-xs font-semibold text-slate-700">
                  {lt('Réduction autorisée de rémunération / Déductions nettes (Ligne 10)', 'Authorized Reduction in Remuneration / Net Deductions (Line 10)')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsTP1016ModalOpen(true)}
                  className="text-[11px] text-cyan-800 hover:text-cyan-950 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>{lt('Calculer via TP-1016-V', 'Calculate via TP-1016-V')}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Correspond à la ligne 10 du formulaire TP-1016-V. Montant déductible pour REER et dépenses d\'emploi autorisées.', 'Maps to Line 10 of Form TP-1016-V. Reducible amount from allowable RRSP and certified employment expenses.')}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 font-medium ${
                    tp1016AppliedData ? 'border-cyan-400 ring-1 ring-cyan-300' : 'border-slate-300'
                  }`}
                  {...register('provTaxReductionAmount')}
                />
              </div>
              {tp1016AppliedData && (
                <p className="text-[10px] text-cyan-800 font-medium">
                  {lt('✓ Calculé d\'après les déductions nettes TP-1016-V (Ligne 5 moins Ligne 8).', '✓ Calculated from TP-1016-V Net Deductions (Line 5 minus Line 8).')}
                </p>
              )}
              <ErrorMsg name="provTaxReductionAmount" />
            </div>

            <div className="space-y-2">
              <label htmlFor="provTaxReductionCredits" className="block text-xs font-semibold text-slate-700">
                {lt('Crédits d\'impôt autorisés du Québec (Ligne 15)', 'Authorized Québec Tax Credits (Line 15)')}
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt('Correspond à la ligne 15 du formulaire TP-1016-V. Crédits pour fonds de travailleurs ou dons réduisant directement l\'impôt.', 'Maps to Line 15 of Form TP-1016-V. Credits for labour-sponsored funds or donations directly reducing tax.')}
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-600 font-medium"
                  {...register('provTaxReductionCredits')}
                />
              </div>
              {tp1016AppliedData && (
                <p className="text-[10px] text-cyan-800 font-medium">
                  {lt('✓ Calculé d\'après les crédits d\'impôt TP-1016-V (Lignes 11 + 12).', '✓ Calculated from TP-1016-V Tax Credits (Lines 11 + 12).')}
                </p>
              )}
              <ErrorMsg name="provTaxReductionCredits" />
            </div>
          </div>
        </div>
      </section>

      {/* PART C: ADDRESS DETAILS */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">
          {lt('Partie C : Adresse de résidence et postale', 'Part C: Residential & Mailing Address')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Adresse municipale de résidence *', 'Residential Street Address *')}
            </label>
            <input 
              type="text" placeholder="123 Rue Principale, Apt 4B"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : ''}`}
              {...register('address')}
            />
            <ErrorMsg name="address" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Ville *', 'City *')}
            </label>
            <input 
              type="text" placeholder="Montréal"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : ''}`}
              {...register('city')}
            />
            <ErrorMsg name="city" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Code postal *', 'Postal Code *')}
            </label>
            <input 
              type="text" placeholder="H3B 2Y5"
              className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors.postalCode ? 'border-red-500' : ''}`}
              {...register('postalCode')}
            />
            <ErrorMsg name="postalCode" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Adresse postale (si différente)', 'Mailing Address (if different)')}
            </label>
            <input 
              type="text" placeholder={lt('Case postale ou adresse alternative (optionnel)', 'P.O. Box or alternate address (optional)')}
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('mailingAddress')}
            />
          </div>
        </div>
      </section>

      {/* PART D: DIRECT DEPOSIT DETAILS */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">
          {lt('Partie D : Informations bancaires pour dépôt direct', 'Part D: Direct Deposit Banking Information')}
        </h3>
        <p className="text-xs text-gray-600">
          {lt(
            'Indiquez vos coordonnées de transit et compte bancaire pour les versements de paie par dépôt direct.',
            'Provide your banking transit and account details for direct deposit payroll payments.'
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Institution financière / Nom de la banque', 'Financial Institution / Bank Name')}
            </label>
            <input 
              type="text" placeholder={lt('ex. Desjardins, RBC, TD', 'e.g. Desjardins, RBC, TD')}
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('bankName')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Numéro de transit (5 chiffres)', 'Branch Transit No. (5 Digits)')}
            </label>
            <input 
              type="text" maxLength={5} placeholder="12345" 
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('transitNumber')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Numéro d\'institution (3 chiffres)', 'Institution No. (3 Digits)')}
            </label>
            <input 
              type="text" maxLength={3} placeholder="003" 
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('institutionNumber')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lt('Numéro de compte', 'Account Number')}
            </label>
            <input 
              type="text" placeholder="1234567" 
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
              {...register('accountNumber')}
            />
          </div>
        </div>
      </section>

      {/* PART E: GROUP INSURANCE */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">
          {lt('Partie E : Régime d\'assurance collective et avantages', 'Part E: Group Insurance & Benefits Selection')}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {lt('Êtes-vous couvert(e) par le régime d\'assurance maladie et dentaire privé d\'un conjoint ?', 'Are you covered under a spouse\'s private health and dental family plan?')}
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input 
                type="radio" 
                value="true"
                checked={isCoveredBySpouse === true} 
                onChange={() => setValue('group_insurance.is_covered_by_spouse_plan', true, { shouldValidate: true })}
              />
              <span className="ml-2 text-sm">{lt('Oui – Exemption selon les règles de la RAMQ', 'Yes – Opting out under RAMQ rules')}</span>
            </label>
            <label className="inline-flex items-center">
              <input 
                type="radio" 
                value="false"
                checked={isCoveredBySpouse === false} 
                onChange={() => setValue('group_insurance.is_covered_by_spouse_plan', false, { shouldValidate: true })}
              />
              <span className="ml-2 text-sm">{lt('Non', 'No')}</span>
            </label>
          </div>
        </div>

        {isCoveredBySpouse && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <label className="block text-xs font-semibold text-blue-900">
              {lt('Téléverser la preuve de couverture du conjoint (pièce justificative obligatoire RAMQ) :', 'Upload Spousal Proof of Coverage (RAMQ Rule Mandatory Attachment):')}
            </label>
            <input 
              type="file" multiple accept=".pdf,.jpg,.png,.webp"
              onChange={e => setSpousalFiles(e.target.files)} 
              className="mt-2 text-xs" required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {lt('Régime sélectionné après validation :', 'Selected Plan Post-Validation:')}
          </label>
          <select 
            className="mt-1 block w-full border rounded-md p-2 text-sm"
            {...register('group_insurance.selected_plan_post_validation')}
          >
            <option value="single">{lt('Individuel', 'Single')}</option>
            <option value="family">{lt('Famille', 'Family')}</option>
            <option value="couple">{lt('Couple', 'Couple')}</option>
            <option value="opt_out">{lt('Exemption', 'Opt Out')}</option>
          </select>
        </div>
      </section>

      {/* PART F: GARNISHMENTS */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">{lt('Partie F : Saisies d\'arrêt et retenues de salaire', 'Part F: Statutory Garnishments & Wage Attachments')}</h3>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            {...register('garnishments.has_active_garnishments')}
          />
          <span className="text-sm font-medium text-gray-700">{lt('Sujet à des saisies de salaire actives ou à des arriérés d\'impôts ?', 'Subject to active wage garnishments or tax arrears?')}</span>
        </label>

        {hasGarnishments && (
          <div className="p-4 bg-gray-50 border rounded-md space-y-3">
            <span className="block text-xs font-semibold text-gray-600">{lt('Catégories :', 'Categories:')}</span>
            {(['child_support', 'alimony', 'back_taxes', 'civil_judgment'] as const).map(cat => (
              <label key={cat} className="inline-flex items-center mr-4">
                <input 
                  type="checkbox" 
                  checked={garnishmentCategories.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
                <span className="ml-1 text-xs capitalize">{cat.replace('_', ' ')}</span>
              </label>
            ))}
            <ErrorMsg name="garnishments.categories" />
            <div className="mt-2 pt-2 border-t">
              <label className="block text-xs font-semibold text-gray-700">{lt('Joindre les ordonnances du tribunal / directives de paiement :', 'Attach Court Orders / Payment Directives:')}</label>
              <input 
                type="file" multiple accept=".pdf,.jpg,.png,.webp"
                onChange={e => setGarnishmentFiles(e.target.files)} 
                className="mt-2 text-xs" required
              />
            </div>
          </div>
        )}
      </section>

      {/* PART G: ELECTRONIC CONSENT */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">{lt('Partie G : Consentement aux formulaires fiscaux électroniques', 'Part G: Electronic Tax Form Consent')}</h3>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            {...register('tax_distribution.electronic_consent_t4_rl1')}
          />
          <span className="text-sm text-gray-700">{lt('Consentir à la livraison électronique des formulaires T4 / RL-1 par courriel', 'Consent to digital delivery of T4 / RL-1 via email')}</span>
        </label>

        {electronicConsent && (
          <div>
            <label className="block text-xs font-medium text-gray-700">{lt('Courriel de confirmation de livraison', 'Confirmation Delivery Email')}</label>
            <input 
              type="email"
              className={`mt-1 block w-full border rounded-md p-2 text-sm ${(errors.tax_distribution as any)?.delivery_email ? 'border-red-500' : ''}`}
              placeholder={userEmail || 'employee@example.com'} 
              {...register('tax_distribution.delivery_email')}
            />
            <ErrorMsg name="tax_distribution.delivery_email" />
          </div>
        )}
      </section>

      {/* PART H: BACKGROUND CHECK CONSENT */}
      <section className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-bold text-gray-800">{lt('Partie H : Consentement aux vérifications d\'antécédents', 'Part H: Criminal Record Background Check Consent')}</h3>
        <label className="flex items-start space-x-2">
          <input 
            type="checkbox" 
            className="mt-1"
            {...register('background_check.consent_criminal_record')}
          />
          <span className="text-sm text-gray-700 leading-normal">
            {lt(
              'Par la présente, j\'autorise expressément l\'employeur à procéder à une vérification de mes antécédents judiciaires et de mon dossier de police à des fins de validation de l\'emploi.',
              'By checking this box, I hereby authorize the employer to conduct a criminal record background check and police file search for the purposes of employment validation.'
            )}
          </span>
        </label>
      </section>

      {/* PART I: PERMISSIONS & ACCESS CONTROL CHECKLIST */}
      <section className="space-y-4 border-b pb-6">
        <PermissionsChecklist
          permissions={permissions}
          onChange={setPermissions}
        />
      </section>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400"
      >
        {isSubmitting 
          ? (isFr ? 'Soumission en cours...' : 'Submitting...') 
          : (isFr ? 'Soumettre le profil d\'embauche' : 'Submit Onboarding Profile')}
      </button>
    </form>

    <FederalTD1Modal
      isOpen={isTD1ModalOpen}
      onClose={() => setIsTD1ModalOpen(false)}
      initialLine13={watchFedTaxCreditAmount ? Number(watchFedTaxCreditAmount) : undefined}
      initialAdditionalTax={watchFedAdditionalTax ? Number(watchFedAdditionalTax) : 0}
      onApply={handleTD1Apply}
    />

    <FederalT1213Modal
      isOpen={isT1213ModalOpen}
      onClose={() => setIsT1213ModalOpen(false)}
      defaultEmployerName="PaieQuébec Inc."
      initialNetWaiver={watchFedTaxReductionAmount ? Number(watchFedTaxReductionAmount) : undefined}
      onApply={handleT1213Apply}
    />

    <QuebecTP1015Modal
      isOpen={isTP1015ModalOpen}
      onClose={() => setIsTP1015ModalOpen(false)}
      initialLine10={watchProvTaxCreditAmount ? Number(watchProvTaxCreditAmount) : undefined}
      initialAdditionalTax={watchProvAdditionalTax ? Number(watchProvAdditionalTax) : 0}
      onApply={handleTP1015Apply}
    />

    <QuebecTP1016Modal
      isOpen={isTP1016ModalOpen}
      onClose={() => setIsTP1016ModalOpen(false)}
      defaultApplicantName={applicantFullName}
      initialLine10={watchProvTaxReductionAmount ? Number(watchProvTaxReductionAmount) : undefined}
      initialLine15={watchProvTaxReductionCredits ? Number(watchProvTaxReductionCredits) : undefined}
      onApply={handleTP1016Apply}
    />
  </>
  );
};
