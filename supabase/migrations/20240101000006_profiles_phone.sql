-- Add phone to profiles (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
