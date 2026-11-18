-- ==============================================================================
-- AUTOMATIC USER / ADMIN SYNC TRIGGER FOR SUPABASE AUTH
-- Updates public.admins if user is an admin, otherwise syncs into public.users
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admins WHERE id = new.id) THEN
    UPDATE public.admins
    SET
      email = new.email,
      "fullName" = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', public.admins."fullName"),
      "avatarUrl" = COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', public.admins."avatarUrl"),
      "updatedAt" = NOW()
    WHERE id = new.id;
  ELSE
    INSERT INTO public.users (
      id,
      email,
      "fullName",
      "avatarUrl",
      "isBlocked",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      "fullName" = COALESCE(EXCLUDED."fullName", public.users."fullName"),
      "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public.users."avatarUrl"),
      "updatedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
