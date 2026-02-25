import crypto from 'node:crypto';
import type { LayoutServerLoad } from './$types.js';

function gravatarUrl(email: string, size = 64) {
	const normalized = email.trim().toLowerCase();
	const hash = crypto.createHash('md5').update(normalized).digest('hex');
	return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export const load: LayoutServerLoad = async ({ locals }) => {
	const email = locals.user?.email ?? '';
	const name = locals.user?.name ?? null;
	const username = (locals.user as { username?: string } | undefined)?.username ?? null;
	const displayName = name || username || email || 'Account';

	return {
		user: email
			? {
					email,
					name,
					username,
					displayName,
					gravatarUrl: gravatarUrl(email)
				}
			: null
	};
};
