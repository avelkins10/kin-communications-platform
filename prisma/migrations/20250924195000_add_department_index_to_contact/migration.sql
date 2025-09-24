-- Add index for department-based filtering
CREATE INDEX IF NOT EXISTS "Contact_department_idx" ON "Contact"("department");

-- Enforce duplicate phone strategy: unique per owner
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_phone_key" UNIQUE ("ownerId", "phone");


