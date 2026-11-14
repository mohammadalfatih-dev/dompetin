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

export async function ensureSupabaseUser() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let user = session?.user;
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(`Gagal membuat sesi pengguna sementara: ${error.message}. Pastikan Anonymous Sign-Ins aktif di Supabase Auth.`);
    user = data.user;
  }

  if (!user) throw new Error('Sesi pengguna Supabase tidak tersedia.');

  // profiles.id must equal auth.users.id. Never generate a separate profile UUID.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: user.user_metadata?.full_name || 'Pengguna Dompetin' }, { onConflict: 'id' });
  if (profileError) throw profileError;

  return user;
}


/** Link the current anonymous Supabase user to Google without changing its user ID. */
export async function linkGoogleAccount() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sesi pengguna tidak ditemukan. Muat ulang Dompetin lalu coba lagi.');

  const googleAlreadyLinked = (user.identities || []).some(
    (identity) => identity.provider === 'google',
  );
  if (googleAlreadyLinked) {
    throw new Error('Akun Google sudah terhubung dengan akun Dompetin ini.');
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Supabase tidak mengembalikan URL untuk menghubungkan Google.');

  // linkIdentity returns an authorization URL; navigate while preserving the current session.
  window.location.assign(data.url);
}


/** Start a normal Google sign-in for a previously linked Dompetin account. */
export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  localStorage.removeItem('dompetin_explicit_logout');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/** End the local session without deleting the Supabase user or their cloud data. */
export async function signOutDompetin() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
  localStorage.setItem('dompetin_explicit_logout', 'true');
}
