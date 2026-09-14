-- ==============================================================================
-- CropVision SaaS - Supabase Production Database Schema
-- Multi-tenant AgTech Cloud Architecture with Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: PROFILES (User accounts, Whop licensing & subscriptions)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    whop_user_id TEXT UNIQUE,
    membership_status TEXT NOT NULL DEFAULT 'free' CHECK (membership_status IN ('free', 'active', 'past_due', 'canceled')),
    plan_id TEXT NOT NULL DEFAULT 'solo' CHECK (plan_id IN ('solo', 'herdade_pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE: FARMS (Estates / Companies with white-labeling & fiscal info)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nif TEXT,
    location TEXT,
    logo_url TEXT,
    agronomist_name TEXT,
    agronomist_license TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE: PARCELS (Agricultural fields with vector boundaries & biophysical telemetry)
CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL DEFAULT 'olival',
    training_system TEXT DEFAULT 'intensivo',
    irrigation_type TEXT DEFAULT 'gota-a-gota',
    area_ha NUMERIC(10, 2) NOT NULL,
    geojson JSONB NOT NULL,
    latest_ndvi NUMERIC(5, 3),
    latest_sar_db NUMERIC(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE: FIELD_LOGS (Caderno de Campo Digital - Treatments, Fertilizers & Scouting)
CREATE TABLE IF NOT EXISTS public.field_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
    log_type TEXT NOT NULL CHECK (log_type IN ('treatment', 'fertilizer', 'scouting')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_name TEXT NOT NULL,
    dose_rate TEXT NOT NULL,
    operator TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. INDEXES FOR HIGH-THROUGHPUT QUERYING
CREATE INDEX IF NOT EXISTS idx_farms_user ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_farm ON public.parcels(farm_id);
CREATE INDEX IF NOT EXISTS idx_field_logs_parcel ON public.field_logs(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcels_geojson ON public.parcels USING GIN (geojson);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own profile
CREATE POLICY "Users can read own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR auth.role() = 'service_role');

-- Farms access policies
CREATE POLICY "Users can access own farms" 
    ON public.farms FOR ALL 
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Public / Anonymous read access for demonstration & audit sharing
CREATE POLICY "Public read access for farms" 
    ON public.farms FOR SELECT 
    USING (true);

CREATE POLICY "Public read access for parcels" 
    ON public.parcels FOR SELECT 
    USING (true);

CREATE POLICY "Public read access for field_logs" 
    ON public.field_logs FOR SELECT 
    USING (true);

-- Parcels & Field Logs management
CREATE POLICY "Manage parcels with service role or owner" 
    ON public.parcels FOR ALL 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.farms WHERE farms.id = parcels.farm_id AND farms.user_id = auth.uid()
    ));

CREATE POLICY "Manage field_logs with service role or owner" 
    ON public.field_logs FOR ALL 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.parcels 
        JOIN public.farms ON farms.id = parcels.farm_id
        WHERE parcels.id = field_logs.parcel_id AND farms.user_id = auth.uid()
    ));
