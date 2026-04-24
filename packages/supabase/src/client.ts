export * from '@supabase/supabase-js';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
	url: string;
	key: string;
};

// auth-only admin client — use with service-role key
export const createAdminClient = ({ url, key }: SupabaseConfig): SupabaseClient => {
	return createClient(url, key, {
		auth: { persistSession: false },
	});
};

// anon client — use with publishable (anon) key
export const createAnonClient = ({ url, key }: SupabaseConfig): SupabaseClient => {
	return createClient(url, key, {
		auth: { persistSession: false },
	});
};
