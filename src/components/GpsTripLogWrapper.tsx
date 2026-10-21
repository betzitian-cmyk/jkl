import React from 'react';
import GantavyaGpsApp from '../../gps/src/App';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';

interface GpsTripLogWrapperProps {
  onNavigateToExpenses?: () => void;
  onExpenseCreated?: () => void;
}

export const GpsTripLogWrapper: React.FC<GpsTripLogWrapperProps> = ({
  onNavigateToExpenses,
  onExpenseCreated
}) => {
  const { user, userProfile } = useAuth();
  const { language } = useLanguage();

  const employeeName = user?.displayName || userProfile?.displayName || (user?.email ? user.email.split('@')[0] : 'Alexandre Tremblay');
  const employeeEmail = user?.email || 'a.tremblay@applepai.ca';
  const employeeId = user?.uid || 'emp_001';

  return (
    <div className="w-full min-h-[800px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <GantavyaGpsApp
        user={{
          id: employeeId,
          uid: employeeId,
          email: employeeEmail,
          displayName: employeeName,
          name: employeeName
        }}
        language={language}
        onNavigateToExpenses={onNavigateToExpenses}
        onExpenseCreated={onExpenseCreated}
      />
    </div>
  );
};
