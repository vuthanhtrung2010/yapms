import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db/index.js';
import { sendEmail, getVerificationEmailHTML } from './email.js';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }, _request) => {
			// Fire and forget - don't await to prevent timing attacks
			void sendEmail({
				to: user.email,
				subject: 'Xác minh email của bạn - YAPMS',
				text: `Click the link to verify your email: ${url}`,
				html: getVerificationEmailHTML(url, user.name)
			});
		}
	},
	plugins: [username(), sveltekitCookies(getRequestEvent)] // sveltekitCookies must be last
});
