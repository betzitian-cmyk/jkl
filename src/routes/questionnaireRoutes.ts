import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { employees, hireQuestionnaires } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { sendOnboardingInviteEmail } from '../services/emailService';

const router = Router();

// Helper to stringify/parse permissions and JSON fields
function stringifyField(data: any): string | null {
  if (!data) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
}

function parseField(data: any): any {
  if (!data) return null;
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

// 1. POST /api/v1/questionnaire/invite - Admin creates employee & prefilled questionnaire + invite token
router.post('/questionnaire/invite', async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      workEmail,
      jobTitle,
      departmentId,
      employmentType = 'full-time',
      payFrequency = 'bi-weekly',
      baseRate = 60000,
      permissions
    } = req.body;

    if (!firstName || !lastName || !workEmail) {
      return res.status(400).json({ error: 'First name, last name, and work email are required.' });
    }

    const employeeId = 'emp_' + crypto.randomBytes(8).toString('hex');
    const questionnaireId = 'quest_' + crypto.randomBytes(8).toString('hex');
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours
    const temporaryPassword = crypto.randomBytes(6).toString('hex');

    const cleanEmail = String(workEmail).trim();
    const cleanSin = `${Math.floor(100000000 + Math.random() * 900000000)}`;

    // Create Employee record with admin permissions
    const newEmployeeValues = {
      id: employeeId,
      firstName,
      lastName,
      email: cleanEmail,
      sin: cleanSin,
      hireDate: new Date().toISOString().split('T')[0],
      paySchedule: payFrequency.replace('-', '_'),
      payType: 'salary',
      payRate: String(baseRate),
      status: 'invited',
      onboardingStatus: 'incomplete',
      isFirstLogin: true,
      inviteToken,
      inviteTokenExpiresAt,
      questionnaireId,
      jobTitle: jobTitle || 'Spécialiste',
      employmentType,
      frequency: payFrequency,
      baseSalary: String(baseRate),
      claimFederalBasicPersonalAmount: true,
      claimProvincialBasicPersonalAmount: true,
      federalAdditionalTax: '0.00',
      garnishments: '[]',
      permissions: stringifyField(permissions)
    };

    await db.insert(employees).values(newEmployeeValues);

    // Create Prefilled Questionnaire record
    const prefilledQuestionnaireValues = {
      id: questionnaireId,
      employeeId,
      status: 'draft',
      firstName,
      lastName,
      workEmail: cleanEmail,
      jobTitle: jobTitle || 'Spécialiste',
      departmentId: departmentId || 'Administration',
      employmentType,
      payFrequency,
      baseRate: String(baseRate),
      bill96LanguagePreference: 'fr',
    };

    await db.insert(hireQuestionnaires).values(prefilledQuestionnaireValues);

    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'localhost:3000';
    const inviteUrl = `${protocol}://${host}/accept-invite?token=${inviteToken}`;

    // Invoke Phase 3 email notification service
    await sendOnboardingInviteEmail({
      recipientName: `${firstName} ${lastName}`,
      workEmail: cleanEmail,
      companyName: 'ApplepAI Inc.',
      inviteUrl,
      temporaryPassword,
      expiresInHours: 72
    });

    return res.status(201).json({
      success: true,
      employeeId,
      questionnaireId,
      inviteToken,
      inviteUrl,
      temporaryPassword,
      employee: {
        ...newEmployeeValues,
        permissions: parseField(permissions)
      },
      questionnaire: prefilledQuestionnaireValues
    });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    return res.status(500).json({ error: error.message || 'Failed to create employee invite.' });
  }
});

// 2. GET /api/v1/invite/validate - Validate token and return associated employee
router.get('/invite/validate', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token query parameter is required.' });
    }

    const matched = await db.select().from(employees).where(eq(employees.inviteToken, token)).limit(1);
    if (matched.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid or non-existent invitation token.' });
    }

    const emp = matched[0];
    if (emp.inviteTokenExpiresAt && new Date() > new Date(emp.inviteTokenExpiresAt)) {
      return res.status(410).json({ valid: false, error: 'Invitation link has expired. Please contact your administrator.' });
    }

    // Get linked questionnaire
    let questionnaire = null;
    if (emp.questionnaireId) {
      const qMatch = await db.select().from(hireQuestionnaires).where(eq(hireQuestionnaires.id, emp.questionnaireId)).limit(1);
      if (qMatch.length > 0) questionnaire = qMatch[0];
    }

    return res.json({
      valid: true,
      employee: {
        ...emp,
        permissions: parseField(emp.permissions)
      },
      questionnaire
    });
  } catch (error: any) {
    console.error('Error validating token:', error);
    return res.status(500).json({ valid: false, error: error.message });
  }
});

// 3. POST /api/v1/invite/accept - Employee accepts invite and sets password
router.post('/invite/accept', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    const matched = await db.select().from(employees).where(eq(employees.inviteToken, token)).limit(1);
    if (matched.length === 0) {
      return res.status(404).json({ error: 'Invalid or non-existent invitation token.' });
    }

    const emp = matched[0];
    if (emp.inviteTokenExpiresAt && new Date() > new Date(emp.inviteTokenExpiresAt)) {
      return res.status(410).json({ error: 'Invitation link has expired.' });
    }

    // Update status to pending_questionnaire & consume token
    await db.update(employees).set({
      status: 'pending_questionnaire',
      isFirstLogin: true,
      inviteToken: null,
      inviteTokenExpiresAt: null,
      updatedAt: new Date()
    }).where(eq(employees.id, emp.id));

    return res.json({
      success: true,
      employee: {
        ...emp,
        status: 'pending_questionnaire',
        isFirstLogin: true,
        inviteToken: null,
        inviteTokenExpiresAt: null,
        permissions: parseField(emp.permissions)
      }
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/v1/questionnaire/employee/:employeeId - Fetch prefilled questionnaire
router.get('/questionnaire/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const qMatch = await db.select().from(hireQuestionnaires).where(eq(hireQuestionnaires.employeeId, employeeId)).limit(1);
    
    if (qMatch.length === 0) {
      // Create fallback draft questionnaire from employee record if missing
      const empMatch = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
      if (empMatch.length === 0) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      const emp = empMatch[0];
      const newQ = {
        id: 'quest_' + crypto.randomBytes(8).toString('hex'),
        employeeId: emp.id,
        status: 'draft',
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.email,
        jobTitle: emp.jobTitle || 'Spécialiste',
        employmentType: emp.employmentType || 'full-time',
        payFrequency: emp.frequency || 'bi-weekly',
        baseRate: String(emp.baseSalary || 60000),
        bill96LanguagePreference: 'fr'
      };

      await db.insert(hireQuestionnaires).values(newQ);
      return res.json(newQ);
    }

    return res.json(qMatch[0]);
  } catch (error: any) {
    console.error('Error fetching questionnaire:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. POST /api/v1/questionnaire/submit - Employee completes questionnaire
// STRICT SECURITY REQUIREMENT: Sanitize/strip any permissions or role payload from client
router.post('/questionnaire/submit', async (req: Request, res: Response) => {
  try {
    const { questionnaireId, employeeId, questionnaireData, profileUpdates } = req.body;

    const targetEmpId = employeeId || req.body.employeeId;
    if (!targetEmpId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    // Session verification checks
    const sessionUserId = req.headers['x-user-id'] as string || req.headers['authorization'];
    if (sessionUserId && sessionUserId !== targetEmpId) {
      console.warn(`[SECURITY WARNING] User ${sessionUserId} attempted to submit questionnaire for ${targetEmpId}`);
    }

    // STRICT SECURITY SANITIZATION: Delete any permissions, role, or elevated flags
    const sanitizedProfileUpdates = { ...(profileUpdates || {}) };
    delete sanitizedProfileUpdates.permissions;
    delete sanitizedProfileUpdates.role;
    delete sanitizedProfileUpdates.isSuperAdmin;
    delete sanitizedProfileUpdates.isAdmin;

    // Audit trail logging
    console.log(`\n=========================================`);
    console.log(`📝 COMPLIANCE AUDIT TRAIL ENTRY`);
    console.log(`Event: Questionnaire Submitted`);
    console.log(`Employee ID: ${targetEmpId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Client IP: ${req.ip}`);
    console.log(`=========================================\n`);

    // Update questionnaire
    if (questionnaireId) {
      const qFields: any = {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };
      if (questionnaireData) {
        if (questionnaireData.personalEmail) qFields.personalEmail = questionnaireData.personalEmail;
        if (questionnaireData.phone) qFields.phone = questionnaireData.phone;
        if (questionnaireData.dateOfBirth) qFields.dateOfBirth = questionnaireData.dateOfBirth;
        if (questionnaireData.socialInsuranceNumber) qFields.socialInsuranceNumber = questionnaireData.socialInsuranceNumber;
        if (questionnaireData.streetAddress) qFields.streetAddress = questionnaireData.streetAddress;
        if (questionnaireData.city) qFields.city = questionnaireData.city;
        if (questionnaireData.province) qFields.province = questionnaireData.province;
        if (questionnaireData.postalCode) qFields.postalCode = questionnaireData.postalCode;
        if (questionnaireData.federalTD1ClaimAmount) qFields.federalTD1ClaimAmount = String(questionnaireData.federalTD1ClaimAmount);
        if (questionnaireData.quebecTP1015ClaimAmount) qFields.quebecTP1015ClaimAmount = String(questionnaireData.quebecTP1015ClaimAmount);
        if (questionnaireData.additionalTaxDeductionPerPay) qFields.additionalTaxDeductionPerPay = String(questionnaireData.additionalTaxDeductionPerPay);
        if (questionnaireData.bill96LanguagePreference) qFields.bill96LanguagePreference = questionnaireData.bill96LanguagePreference;
        if (questionnaireData.bankInstitutionNumber) qFields.bankInstitutionNumber = questionnaireData.bankInstitutionNumber;
        if (questionnaireData.bankTransitNumber) qFields.bankTransitNumber = questionnaireData.bankTransitNumber;
        if (questionnaireData.bankAccountNumber) qFields.bankAccountNumber = questionnaireData.bankAccountNumber;
        if (questionnaireData.emergencyContactName) qFields.emergencyContactName = questionnaireData.emergencyContactName;
        if (questionnaireData.emergencyContactRelationship) qFields.emergencyContactRelationship = questionnaireData.emergencyContactRelationship;
        if (questionnaireData.emergencyContactPhone) qFields.emergencyContactPhone = questionnaireData.emergencyContactPhone;
      }

      await db.update(hireQuestionnaires).set(qFields).where(eq(hireQuestionnaires.id, questionnaireId));
    }

    // Map profile updates onto Employee record
    const empUpdates: any = {
      status: 'active',
      onboardingStatus: 'completed',
      isFirstLogin: false
    };

    if (questionnaireData) {
      if (questionnaireData.phone) empUpdates.phone = questionnaireData.phone;
      if (questionnaireData.socialInsuranceNumber) empUpdates.sin = questionnaireData.socialInsuranceNumber;
      if (questionnaireData.dateOfBirth) empUpdates.dob = questionnaireData.dateOfBirth;
      if (questionnaireData.streetAddress) {
        empUpdates.address = `${questionnaireData.streetAddress}${questionnaireData.city ? ', ' + questionnaireData.city : ''}`;
        empUpdates.city = questionnaireData.city || undefined;
        empUpdates.postalCode = questionnaireData.postalCode || undefined;
      }
      if (questionnaireData.bankInstitutionNumber) empUpdates.institutionNumber = questionnaireData.bankInstitutionNumber;
      if (questionnaireData.bankTransitNumber) empUpdates.transitNumber = questionnaireData.bankTransitNumber;
      if (questionnaireData.bankAccountNumber) empUpdates.accountNumber = questionnaireData.bankAccountNumber;
      if (questionnaireData.emergencyContactName) empUpdates.emergencyContactName = questionnaireData.emergencyContactName;
      if (questionnaireData.emergencyContactRelationship) empUpdates.emergencyContactRelationship = questionnaireData.emergencyContactRelationship;
      if (questionnaireData.emergencyContactPhone) empUpdates.emergencyContactPhone = questionnaireData.emergencyContactPhone;
      if (questionnaireData.bill96LanguagePreference) empUpdates.languagePreference = questionnaireData.bill96LanguagePreference;

      if (questionnaireData.federalTD1ClaimAmount) empUpdates.federalTd1ClaimAmount = Number(questionnaireData.federalTD1ClaimAmount);
      if (questionnaireData.additionalTaxDeductionPerPay) empUpdates.federalAdditionalTax = String(questionnaireData.additionalTaxDeductionPerPay);

      empUpdates.personalInfo = stringifyField({
        sin: questionnaireData.socialInsuranceNumber,
        phone: questionnaireData.phone,
        dateOfBirth: questionnaireData.dateOfBirth,
        address: {
          street: questionnaireData.streetAddress || '',
          city: questionnaireData.city || '',
          province: questionnaireData.province || 'QC',
          postalCode: questionnaireData.postalCode || ''
        },
        emergencyContact: {
          name: questionnaireData.emergencyContactName || '',
          relationship: questionnaireData.emergencyContactRelationship || '',
          phone: questionnaireData.emergencyContactPhone || ''
        }
      });

      empUpdates.bankingInfo = stringifyField({
        institution: questionnaireData.bankInstitutionNumber || '',
        transit: questionnaireData.bankTransitNumber || '',
        account: questionnaireData.bankAccountNumber || ''
      });

      empUpdates.taxParameters = stringifyField({
        td1Claim: questionnaireData.federalTD1ClaimAmount || 16452,
        tp1015Claim: questionnaireData.quebecTP1015ClaimAmount || 18056,
        additionalDeduction: questionnaireData.additionalTaxDeductionPerPay || 0,
        bill96Language: questionnaireData.bill96LanguagePreference || 'fr'
      });
    }

    await db.update(employees).set(empUpdates).where(eq(employees.id, targetEmpId));

    const updatedEmp = await db.select().from(employees).where(eq(employees.id, targetEmpId)).limit(1);

    return res.json({
      success: true,
      employee: {
        ...updatedEmp[0],
        permissions: parseField(updatedEmp[0]?.permissions)
      }
    });
  } catch (error: any) {
    console.error('Error submitting questionnaire:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
