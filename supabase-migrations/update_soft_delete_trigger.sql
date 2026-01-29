-- ==========================================================
-- MIGRATION: UPDATE SOFT DELETE STATUS TO JOB_DELETED
-- ==========================================================

-- 1. Update the trigger function to set status to 'JOB_DELETED' instead of 'EXPIRED'
--    when the job is deleted by the owner.
CREATE OR REPLACE FUNCTION propagate_job_status_to_applications()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- user: "USER WHO HAVE APPLIED THERE APPLICATION STATUS WILL CHANGE TO DELETED"
    IF NEW.status = 'DELETED' AND OLD.status != 'DELETED' THEN
        UPDATE job_applications 
        SET status = 'JOB_DELETED', -- Using JOB_DELETED to be precise, or 'DELETED' if you prefer. 
                                    -- Since I added 'JOB_DELETED' to constraint and frontend, I'll use it.
            updated_at = NOW()
        WHERE job_id = NEW.id;
    
    -- Auto-expiration still sets 'EXPIRED' (or 'JOB_EXPIRED')
    ELSIF NEW.status = 'EXPIRED' AND OLD.status != 'EXPIRED' THEN
        UPDATE job_applications 
        SET status = 'JOB_EXPIRED',
            updated_at = NOW()
        WHERE job_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
