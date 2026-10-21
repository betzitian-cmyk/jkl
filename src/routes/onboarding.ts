import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { employees, onboardingDocuments, employeeAddresses, employeeBankDetails } from '../db/schema';
import { uploadOnboardingDocsMemory } from '../middleware/uploadMiddleware';
import { EmployeeOnboardingSchema } from '../types/onboarding';
import { hydrateTaxDefaults } from '../services/taxEngine';
import { eq, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const router = Router();

// Ensure uploads folders exist
const originalsDir = path.join(process.cwd(), 'uploads', 'originals');
const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
const docsDir = path.join(process.cwd(), 'uploads', 'onboarding_docs');

fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

router.post('/', (req: Request, res: Response) => {
  uploadOnboardingDocsMemory(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const spousalFiles = files?.spousalProofFiles || [];
      const garnishmentFiles = files?.garnishmentFiles || [];
      const avatarFile = files?.avatarFile?.[0];

      // Validate avatarFile if present
      if (avatarFile) {
        if (avatarFile.size > 5 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "File too large. Avatar image must be less than 5MB." });
        }
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedMimeTypes.includes(avatarFile.mimetype)) {
          return res.status(400).json({ success: false, message: "Invalid file type. Only PNG, JPEG, and WebP images are allowed." });
        }
      }

      // Parse JSON strings from multipart fields
      const groupInsuranceObj = JSON.parse(req.body.group_insurance || '{}');
      const garnishmentsObj = JSON.parse(req.body.garnishments || '{}');
      const taxDistributionObj = JSON.parse(req.body.tax_distribution || '{}');
      const taxMetadataObj = JSON.parse(req.body.tax_metadata || '{}');
      const backgroundCheckObj = JSON.parse(req.body.background_check || '{}');

      // Auto-set system flags & audit metadata
      garnishmentsObj.documentation_provided = garnishmentFiles.length > 0;
      if (garnishmentsObj.has_active_garnishments) {
        garnishmentsObj.payroll_flag = "Requires deduction threshold configuration prior to first pay run";
      }

      if (taxDistributionObj.electronic_consent_t4_rl1 && !taxDistributionObj.consent_timestamp) {
        taxDistributionObj.consent_timestamp = new Date().toISOString();
      }

      const dobVal = req.body.dob || req.body.dateOfBirth;

      const rawPayload = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        preferredName: req.body.preferredName || undefined,
        middleInitial: req.body.middleInitial || undefined,
        sin: req.body.sin,
        dob: dobVal,
        dateOfBirth: dobVal,
        email: req.body.email,
        phone: req.body.phone || undefined,
        address: req.body.address,
        city: req.body.city,
        postalCode: req.body.postalCode,
        mailingAddress: req.body.mailingAddress || undefined,

        bankName: req.body.bankName || undefined,
        accountNumber: req.body.accountNumber || undefined,
        transitNumber: req.body.transitNumber || undefined,
        institutionNumber: req.body.institutionNumber || undefined,

        payPeriodsPerYear: Number(req.body.payPeriodsPerYear || 26),
        estimatedAnnualIncome: Number(req.body.estimatedAnnualIncome || 75000),
        fedTaxCreditAmount: req.body.fedTaxCreditAmount ? Number(req.body.fedTaxCreditAmount) : undefined,
        fedAdditionalTax: req.body.fedAdditionalTax ? Number(req.body.fedAdditionalTax) : 0,
        fedTaxReductionAmount: req.body.fedTaxReductionAmount ? Number(req.body.fedTaxReductionAmount) : undefined,
        provTaxCreditAmount: req.body.provTaxCreditAmount ? Number(req.body.provTaxCreditAmount) : undefined,
        provAdditionalTax: req.body.provAdditionalTax ? Number(req.body.provAdditionalTax) : 0,
        provTaxReductionAmount: req.body.provTaxReductionAmount ? Number(req.body.provTaxReductionAmount) : undefined,
        provTaxReductionCredits: req.body.provTaxReductionCredits ? Number(req.body.provTaxReductionCredits) : undefined,
        group_insurance: groupInsuranceObj,
        garnishments: garnishmentsObj,
        tax_distribution: taxDistributionObj,
        background_check: backgroundCheckObj,
      };

      // 1. Validate contract using Zod
      const validated = EmployeeOnboardingSchema.parse(rawPayload);

      // 2. Hydrate statutory tax amounts
      const hydratedTaxes = hydrateTaxDefaults(validated, validated.estimatedAnnualIncome);

      // Check if employee already exists with same email or sin to handle update / revisions
      const existingEmployee = await db.select().from(employees).where(
        or(eq(employees.email, validated.email), eq(employees.sin, validated.sin))
      ).limit(1);

      let employeeId = existingEmployee.length > 0 ? existingEmployee[0].id : uuidv4();
      let avatarUrl = existingEmployee.length > 0 ? existingEmployee[0].avatarUrl : null;
      let avatarThumbnailUrl = existingEmployee.length > 0 ? existingEmployee[0].avatarThumbnailUrl : null;

      // Handle avatar uploads and revision cleanup
      if (avatarFile) {
        // Revision Cleanup: delete prior files
        if (existingEmployee.length > 0) {
          const oldAvatarUrl = existingEmployee[0].avatarUrl;
          const oldAvatarThumbnailUrl = existingEmployee[0].avatarThumbnailUrl;
          if (oldAvatarUrl) {
            try {
              await fs.promises.unlink(path.join(process.cwd(), oldAvatarUrl.replace(/^\//, '')));
            } catch (e) {
              console.error("Failed to delete previous avatar file:", e);
            }
          }
          if (oldAvatarThumbnailUrl) {
            try {
              await fs.promises.unlink(path.join(process.cwd(), oldAvatarThumbnailUrl.replace(/^\//, '')));
            } catch (e) {
              console.error("Failed to delete previous avatar thumbnail:", e);
            }
          }
        }

        const ext = path.extname(avatarFile.originalname) || '.jpg';
        const filename = `${Date.now()}-${uuidv4()}${ext}`;

        const originalPath = path.join(originalsDir, filename);
        const thumbnailPath = path.join(thumbnailsDir, filename);

        // Save original asynchronously
        await fs.promises.writeFile(originalPath, avatarFile.buffer);

        // Resize and compress cropped 150x150 JPEG thumbnail at 80% quality
        await sharp(avatarFile.buffer)
          .resize(150, 150, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        avatarUrl = `/uploads/originals/${filename}`;
        avatarThumbnailUrl = `/uploads/thumbnails/${filename}`;
      }

      const finalDob = validated.dob || validated.dateOfBirth || dobVal;
      const deliveryEmail = validated.tax_distribution.delivery_email || validated.email;

      await db.transaction(async (tx) => {
        if (existingEmployee.length > 0) {
          // Revision Cleanup: remove previous addresses/banking/documents to prevent orphaned records
          const oldDocs = await tx.select().from(onboardingDocuments).where(eq(onboardingDocuments.employeeId, employeeId));
          for (const doc of oldDocs) {
            if (doc.filePath) {
              try {
                await fs.promises.unlink(path.join(process.cwd(), doc.filePath));
              } catch (e) {
                console.error("Error deleting old doc file:", doc.filePath, e);
              }
            }
          }
          await tx.delete(onboardingDocuments).where(eq(onboardingDocuments.employeeId, employeeId));
          await tx.delete(employeeAddresses).where(eq(employeeAddresses.employeeId, employeeId));
          await tx.delete(employeeBankDetails).where(eq(employeeBankDetails.employeeId, employeeId));

          // Update main employee record
          await tx.update(employees).set({
            firstName: validated.firstName,
            lastName: validated.lastName,
            preferredName: validated.preferredName || null,
            middleInitial: validated.middleInitial || null,
            sin: validated.sin,
            dob: finalDob,
            email: validated.email,
            phone: validated.phone || null,
            paySchedule: validated.payPeriodsPerYear === 52 ? 'weekly' : (validated.payPeriodsPerYear === 24 ? 'semi_monthly' : (validated.payPeriodsPerYear === 12 ? 'monthly' : 'bi_weekly')),
            payRate: validated.estimatedAnnualIncome.toString(),
            status: 'pending_onboarding',
            onboardingStatus: 'completed',
            fedTaxCreditAmount: hydratedTaxes.fedTaxCreditAmount.toString(),
            fedAdditionalTax: hydratedTaxes.fedAdditionalTax.toString(),
            provTaxCreditAmount: hydratedTaxes.provTaxCreditAmount.toString(),
            provAdditionalTax: hydratedTaxes.provAdditionalTax.toString(),
            isFedBPAClawbacked: hydratedTaxes.isFedBPAClawbacked,
            isFedDefaultApplied: taxMetadataObj.isFedDefaultApplied || false,
            isProvDefaultApplied: taxMetadataObj.isProvDefaultApplied || false,
            systemCalculatedBPA: hydratedTaxes.isFedBPAClawbacked ? hydratedTaxes.fedTaxCreditAmount.toString() : null,
            isCoveredBySpousePlan: validated.group_insurance.is_covered_by_spouse_plan,
            spousePlanDetails: validated.group_insurance.spouse_plan_details || null,
            selectedPlanPostValidation: validated.group_insurance.selected_plan_post_validation,
            validationCompletionDate: validated.group_insurance.validation_completion_date || null,
            hasActiveGarnishments: validated.garnishments.has_active_garnishments,
            garnishmentCategories: validated.garnishments.categories,
            garnishmentDocProvided: validated.garnishments.documentation_provided,
            payrollLockFlag: validated.garnishments.payroll_flag || null,
            electronicConsentT4Rl1: validated.tax_distribution.electronic_consent_t4_rl1,
            taxDeliveryEmail: deliveryEmail,
            taxConsentTimestamp: validated.tax_distribution.consent_timestamp ? new Date(validated.tax_distribution.consent_timestamp) : null,
            backgroundCheckConsent: validated.background_check.consent_criminal_record,
            avatarUrl,
            avatarThumbnailUrl,
            updatedAt: new Date()
          }).where(eq(employees.id, employeeId));
        } else {
          // Insert new Employee Record
          await tx.insert(employees).values({
            id: employeeId,
            firstName: validated.firstName,
            lastName: validated.lastName,
            preferredName: validated.preferredName || null,
            middleInitial: validated.middleInitial || null,
            sin: validated.sin,
            dob: finalDob,
            email: validated.email,
            phone: validated.phone || null,
            hireDate: new Date().toISOString().split('T')[0],
            paySchedule: validated.payPeriodsPerYear === 52 ? 'weekly' : (validated.payPeriodsPerYear === 24 ? 'semi_monthly' : (validated.payPeriodsPerYear === 12 ? 'monthly' : 'bi_weekly')),
            payType: 'salary',
            payRate: validated.estimatedAnnualIncome.toString(),
            status: 'pending_onboarding',
            onboardingStatus: 'completed',
            fedTaxCreditAmount: hydratedTaxes.fedTaxCreditAmount.toString(),
            fedAdditionalTax: hydratedTaxes.fedAdditionalTax.toString(),
            provTaxCreditAmount: hydratedTaxes.provTaxCreditAmount.toString(),
            provAdditionalTax: hydratedTaxes.provAdditionalTax.toString(),
            isFedBPAClawbacked: hydratedTaxes.isFedBPAClawbacked,
            isFedDefaultApplied: taxMetadataObj.isFedDefaultApplied || false,
            isProvDefaultApplied: taxMetadataObj.isProvDefaultApplied || false,
            systemCalculatedBPA: hydratedTaxes.isFedBPAClawbacked ? hydratedTaxes.fedTaxCreditAmount.toString() : null,
            isCoveredBySpousePlan: validated.group_insurance.is_covered_by_spouse_plan,
            spousePlanDetails: validated.group_insurance.spouse_plan_details || null,
            selectedPlanPostValidation: validated.group_insurance.selected_plan_post_validation,
            validationCompletionDate: validated.group_insurance.validation_completion_date || null,
            hasActiveGarnishments: validated.garnishments.has_active_garnishments,
            garnishmentCategories: validated.garnishments.categories,
            garnishmentDocProvided: validated.garnishments.documentation_provided,
            payrollLockFlag: validated.garnishments.payroll_flag || null,
            electronicConsentT4Rl1: validated.tax_distribution.electronic_consent_t4_rl1,
            taxDeliveryEmail: deliveryEmail,
            taxConsentTimestamp: validated.tax_distribution.consent_timestamp ? new Date(validated.tax_distribution.consent_timestamp) : null,
            backgroundCheckConsent: validated.background_check.consent_criminal_record,
            avatarUrl,
            avatarThumbnailUrl
          });
        }

        // Insert Address
        if (validated.address && validated.city && validated.postalCode) {
          await tx.insert(employeeAddresses).values({
            id: uuidv4(),
            employeeId,
            address: validated.address,
            city: validated.city,
            province: 'QC',
            postalCode: validated.postalCode,
            mailingAddress: validated.mailingAddress || null
          });
        }

        // Insert Direct Deposit Banking Details
        if (validated.accountNumber || validated.transitNumber || validated.institutionNumber || validated.bankName) {
          await tx.insert(employeeBankDetails).values({
            id: uuidv4(),
            employeeId,
            paymentMethod: 'direct_deposit',
            transitNumber: validated.transitNumber || null,
            institutionNumber: validated.institutionNumber || null,
            accountNumber: validated.accountNumber || null
          });
        }

        // Save and insert uploaded documents asynchronously
        const docQueries = [];
        
        for (const file of spousalFiles) {
          const ext = path.extname(file.originalname);
          const storedFilename = `${Date.now()}-${uuidv4()}${ext}`;
          const filePath = path.join('uploads/onboarding_docs', storedFilename);
          
          await fs.promises.writeFile(path.join(process.cwd(), filePath), file.buffer);

          docQueries.push({
            id: uuidv4(),
            employeeId,
            docType: 'RAMQ_SPOUSAL_PROOF' as const,
            originalName: file.originalname,
            storedFilename,
            filePath,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
          });
        }

        for (const file of garnishmentFiles) {
          const ext = path.extname(file.originalname);
          const storedFilename = `${Date.now()}-${uuidv4()}${ext}`;
          const filePath = path.join('uploads/onboarding_docs', storedFilename);
          
          await fs.promises.writeFile(path.join(process.cwd(), filePath), file.buffer);

          docQueries.push({
            id: uuidv4(),
            employeeId,
            docType: 'GARNISHMENT_ORDER' as const,
            originalName: file.originalname,
            storedFilename,
            filePath,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
          });
        }

        if (docQueries.length > 0) {
          await tx.insert(onboardingDocuments).values(docQueries);
        }
      });

      return res.status(201).json({
        success: true,
        employeeId,
        formatted_json_schema: {
          group_insurance: validated.group_insurance,
          garnishments: validated.garnishments,
          tax_distribution: validated.tax_distribution,
          hydrated_tax_record: hydratedTaxes
        }
      });

    } catch (error: any) {
      if (error && (error.name === 'ZodError' || error.errors || error.issues)) {
        const errList = error.errors || error.issues || [];
        return res.status(400).json({ 
          success: false, 
          errors: errList,
          message: errList.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ') || 'Validation error'
        });
      }
      console.error('Onboarding transaction error:', error);
      return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
  });
});

export default router;
