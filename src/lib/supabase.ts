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
