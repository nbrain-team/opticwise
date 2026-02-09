-- AlterTable
ALTER TABLE "User" 
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "department" TEXT,
ADD COLUMN "createdBy" TEXT;

-- Update existing bill@opticwise.com to be admin
UPDATE "User" 
SET "role" = 'admin' 
WHERE "email" = 'bill@opticwise.com';
