-- ==========================================================
-- MIGRATION: HANDLE JOB SOFT DELETE AND STATUS PROPAGATION
-- ==========================================================

-- 1. Update job_applications status constraint to include new statuses
ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'JOB_DELETED', 'JOB_EXPIRED'));

-- 2. Create function to propagate job status changes to applications
CREATE OR REPLACE FUNCTION propagate_job_status_to_applications()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- If Job is marked DELETED, mark all its applications as JOB_DELETED
    IF NEW.status = 'DELETED' AND OLD.status != 'DELETED' THEN
        UPDATE job_applications 
        SET status = 'JOB_DELETED',
            updated_at = NOW()
        WHERE job_id = NEW.id;
    
    -- If Job is marked EXPIRED, mark all its applications as JOB_EXPIRED
    ELSIF NEW.status = 'EXPIRED' AND OLD.status != 'EXPIRED' THEN
        UPDATE job_applications 
        SET status = 'JOB_EXPIRED',
            updated_at = NOW()
        WHERE job_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger on jobs table
DROP TRIGGER IF EXISTS on_job_status_change ON jobs;

CREATE TRIGGER on_job_status_change
AFTER UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION propagate_job_status_to_applications();

-- 4. Update delete_expired_jobs function to use Soft Delete
CREATE OR REPLACE FUNCTION delete_expired_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Soft delete instead of hard delete
  UPDATE jobs 
  SET status = 'EXPIRED' 
  WHERE expires_at < now() 
  AND status != 'EXPIRED' 
  AND status != 'DELETED';
END;
$$;
