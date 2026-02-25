import { error, redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { auth } from '$lib/server/auth.js';
import type { RequestEvent } from '@sveltejs/kit';

export const load: PageServerLoad = async (event: RequestEvent) => {
	// Token comes from URL params (set by better-auth)
	const token = event.url.searchParams.get('token');

	if (!token) {
		error(400, 'Reset token is missing');
	}

	return { token };
};

export const actions: Actions = {
	resetPassword: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const password = formData.get('password');
		const token = formData.get('token');

		if (!password || typeof password !== 'string') {
			return { error: 'Password is required' };
		}

		if (password.length < 8) {
			return { error: 'Password must be at least 8 characters' };
		}

		if (!token || typeof token !== 'string') {
			return { error: 'Reset token is missing' };
		}

		try {
			await auth.api.resetPassword({
				body: {
					newPassword: password,
					token
				}
			});
		} catch (err) {
			if (isRedirect(err)) throw err;
			console.error('Password reset error:', err);
			return { error: 'Failed to reset password. The link may have expired.' };
		}

		return { success: true };
	}
};
