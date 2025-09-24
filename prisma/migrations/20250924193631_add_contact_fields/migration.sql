-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CUSTOMER', 'FIELD_CREW', 'SALES_REP', 'VENDOR');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "department" TEXT,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quickbaseId" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "type" "ContactType" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "ContactGroup" ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "Contact_type_idx" ON "Contact"("type");

-- CreateIndex
CREATE INDEX "Contact_isFavorite_idx" ON "Contact"("isFavorite");

-- CreateIndex
CREATE INDEX "Contact_quickbaseId_idx" ON "Contact"("quickbaseId");
