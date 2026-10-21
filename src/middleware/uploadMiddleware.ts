import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = 'uploads/onboarding_docs/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, PNG, and WebP files are permitted.'));
  }
};

export const uploadOnboardingDocs = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per document
}).fields([
  { name: 'spousalProofFiles', maxCount: 3 },
  { name: 'garnishmentFiles', maxCount: 5 }
]);

export const uploadOnboardingDocsMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Enforce limits during parsing, sub-limits later
}).fields([
  { name: 'spousalProofFiles', maxCount: 3 },
  { name: 'garnishmentFiles', maxCount: 5 },
  { name: 'avatarFile', maxCount: 1 }
]);
