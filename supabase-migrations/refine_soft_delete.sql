-- ==========================================================
-- MIGRATION: REFINE SOFT DELETE AND STATUS PROPAGATION
-- ==========================================================

-- 1. Update job_applications status constraint to include 'EXPIRED' (as requested)
ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'JOB_DELETED', 'JOB_EXPIRED', 'EXPIRED'));

-- 2. Update trigger to set status to 'EXPIRED' when job is DELETED
CREATE OR REPLACE FUNCTION propagate_job_status_to_applications()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- If Job is marked DELETED (Soft Delete), mark applications as EXPIRED (as per user request)
    -- OR "JOB_DELETED" if we want to differentiate. 
    -- User specifically asked: "WHEN OWNER DELETE THE JOB ... APPLICATION STATUS WILL BE EXPIRED"
    IF NEW.status = 'DELETED' AND OLD.status != 'DELETED' THEN
        UPDATE job_applications 
        SET status = 'EXPIRED',
            updated_at = NOW()
        WHERE job_id = NEW.id;
    
    -- If Job is marked EXPIRED (Auto), mark applications as EXPIRED
    ELSIF NEW.status = 'EXPIRED' AND OLD.status != 'EXPIRED' THEN
        UPDATE job_applications 
        SET status = 'EXPIRED',
            updated_at = NOW()
        WHERE job_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger is already attached, just updating the function definition is enough.
