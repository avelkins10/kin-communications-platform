-- Add automated statusCategory and isStale logic
-- This migration adds database-level automation for contact status management

-- Create a function to calculate statusCategory based on lastContactDate
CREATE OR REPLACE FUNCTION calculate_status_category(last_contact_date TIMESTAMP, project_status TEXT)
RETURNS TEXT AS $$
BEGIN
  -- If no last contact date, consider inactive
  IF last_contact_date IS NULL THEN
    RETURN 'INACTIVE';
  END IF;
  
  -- If last contact was more than 6 months ago, consider inactive
  IF last_contact_date < NOW() - INTERVAL '6 months' THEN
    RETURN 'INACTIVE';
  END IF;
  
  -- Otherwise, consider active
  RETURN 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate isStale based on lastContactDate and projectStatus
CREATE OR REPLACE FUNCTION calculate_is_stale(last_contact_date TIMESTAMP, project_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- If no last contact date, consider stale
  IF last_contact_date IS NULL THEN
    RETURN true;
  END IF;
  
  -- For PRE_PTO projects, consider stale after 6 months
  IF project_status = 'PRE_PTO' AND last_contact_date < NOW() - INTERVAL '6 months' THEN
    RETURN true;
  END IF;
  
  -- For POST_PTO projects, consider stale after 3 months
  IF project_status = 'POST_PTO' AND last_contact_date < NOW() - INTERVAL '3 months' THEN
    RETURN true;
  END IF;
  
  -- Default to not stale
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Add computed columns (PostgreSQL doesn't support computed columns directly, so we'll use triggers)
-- Create trigger function to automatically update statusCategory and isStale
CREATE OR REPLACE FUNCTION update_contact_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statusCategory based on lastContactDate
  NEW."statusCategory" = calculate_status_category(NEW."lastContactDate", NEW."projectStatus");
  
  -- Update isStale based on lastContactDate and projectStatus
  NEW."isStale" = calculate_is_stale(NEW."lastContactDate", NEW."projectStatus");
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status fields
DROP TRIGGER IF EXISTS trigger_update_contact_status ON "Contact";
CREATE TRIGGER trigger_update_contact_status
  BEFORE INSERT OR UPDATE OF "lastContactDate", "projectStatus" ON "Contact"
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_status();

-- Update existing records with calculated values
UPDATE "Contact" 
SET 
  "statusCategory" = calculate_status_category("lastContactDate", "projectStatus"),
  "isStale" = calculate_is_stale("lastContactDate", "projectStatus")
WHERE "statusCategory" IS NULL OR "isStale" IS NULL;

-- Add partial unique index for phone numbers with NULL ownerId
-- This prevents duplicate phone numbers for contacts without an owner
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_phone_unique_null_owner" 
ON "Contact" ("phone") 
WHERE "ownerId" IS NULL;
