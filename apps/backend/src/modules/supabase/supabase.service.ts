import { Injectable } from '@nestjs/common';

import type { SupabaseClient } from '@taskflow/supabase';
import { createAdminClient } from '@taskflow/supabase';

import { EnvService } from '@backend/modules/config/env.service';

// auth-only admin client — used for token validation and user management
@Injectable()
export class SupabaseService {
	readonly admin: SupabaseClient;

	constructor(private readonly env: EnvService) {
		this.admin = createAdminClient({
			url: this.env.supabaseUrl,
			key: this.env.supabaseSecretKey,
		});
	}
}
