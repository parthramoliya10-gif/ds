-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR SUPABASE AUTH
-- Automatically creates/updates public.profiles row when a user logs in / signs up
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    "fullName",
    "avatarUrl",
    role,
    "isBlocked",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'USER',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    "fullName" = COALESCE(EXCLUDED."fullName", public.profiles."fullName"),
    "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public.profiles."avatarUrl"),
    "updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
