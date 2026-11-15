import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function getClient() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

export async function getCurrentUser() {
  const client = getClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  return user;
}

export async function ensureUserProfile(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, fullName?: string) {
  const client = getClient();

  // Preserve a name already saved in the profile before using auth metadata.
  const { data: existingProfile, error: profileReadError } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileReadError) throw profileReadError;

  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : '';

  const emailName = user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  const name =
    fullName?.trim() ||
    existingProfile?.full_name?.trim() ||
    metadataName.trim() ||
    emailName ||
    'Pengguna Dompetin';

  // profiles.full_name is NOT NULL, so always provide a non-empty value.
  const { error } = await client.from('profiles').upsert(
    { id: user.id, full_name: name },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getClient();
  const { data, error } = await client.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  if (data.user && data.session) await ensureUserProfile(data.user);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const client = getClient();
  localStorage.removeItem('dompetin_explicit_logout');
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (data.user) await ensureUserProfile(data.user);
  return data;
}

export async function signInWithGoogle() {
  const client = getClient();
  localStorage.removeItem('dompetin_explicit_logout');
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function updateUserProfileName(fullName: string) {
  const client = getClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sesi login tidak ditemukan.');
  const cleanName = fullName.trim();
  if (!cleanName) throw new Error('Nama pengguna wajib diisi.');
  const { error } = await client.from('profiles').upsert(
    { id: user.id, full_name: cleanName },
    { onConflict: 'id' },
  );
  if (error) throw error;
  const { error: metadataError } = await client.auth.updateUser({ data: { full_name: cleanName } });
  if (metadataError) throw metadataError;
}

export async function signOutDompetin() {
  const client = getClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
  localStorage.setItem('dompetin_explicit_logout', 'true');
}
