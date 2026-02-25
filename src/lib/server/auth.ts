import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db/index.js';
import { sendEmail, getVerificationEmailHTML, getPasswordResetEmailHTML } from './email.js';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }, _request) => {
			// Fire and forget - don't await to prevent timing attacks
			void sendEmail({
				to: user.email,
				subject: 'Đặt lại mật khẩu của bạn - YAPMS',
				text: `Click the link to reset your password: ${url}`,
				html: getPasswordResetEmailHTML(url, user.name)
			});
		}
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
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID || '',
			clientSecret: env.GOOGLE_CLIENT_SECRET || ''
		}
	},
	plugins: [username(), sveltekitCookies(getRequestEvent)] // sveltekitCookies must be last
});
