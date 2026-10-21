/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PayStub, Employee } from '../types';
import { YearEndProcessingModule } from './YearEndProcessingModule';

interface T4SummaryProps {
  stubs: PayStub[];
  employees: Employee[];
}

export const T4Summary: React.FC<T4SummaryProps> = ({ stubs, employees }) => {
  return (
    <YearEndProcessingModule
      stubs={stubs}
      employees={employees}
      companySettings={{
        companyName: 'Entreprise Démo Inc.',
        federalId: '123456789 RP 0001',
        neq: '1234567890 RS 0001'
      }}
    />
  );
};
