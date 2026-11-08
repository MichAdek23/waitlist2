-- ==============================================================================
-- DELIVA GLOBE - ACCOUNT & DATA DELETION REQUESTS SCHEMA
-- Required for Google Play Data Safety & Apple App Store Review Guideline 5.1.1(v)
-- ==============================================================================

-- 1. Create table for tracking account deletion requests from Web and Mobile App
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    account_type TEXT DEFAULT 'consumer', -- 'consumer', 'rider', 'merchant'
    reason TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'in_progress', 'completed', 'cancelled'
    source TEXT NOT NULL DEFAULT 'web', -- 'web' or 'mobile_app'
    reference_id TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 2. Performance & lookup indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_email ON public.account_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_created_at ON public.account_deletion_requests(created_at DESC);

-- 3. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER trigger_set_deletion_requests_updated_at
    BEFORE UPDATE ON public.account_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_deletion_requests_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Allow public / anon users to submit deletion requests (e.g. from https://delivaglobe.com/delete-account)
DROP POLICY IF EXISTS "Allow public insert deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Allow public insert deletion requests"
    ON public.account_deletion_requests
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to view only their own deletion requests
DROP POLICY IF EXISTS "Allow users to view own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Allow users to view own deletion requests"
    ON public.account_deletion_requests
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR auth.jwt() ->> 'email' = email
    );

-- Allow service_role full administrative access
DROP POLICY IF EXISTS "Allow service_role full control on deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Allow service_role full control on deletion requests"
    ON public.account_deletion_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Optional status column on profiles if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'account_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active';
    END IF;
END $$;
