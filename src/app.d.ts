import type { User, Session } from 'better-auth/minimal';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
		}

		// interface Error {}
		interface PageData {
			user?: {
				email: string;
				name: string | null;
				username: string | null;
				displayName: string;
				gravatarUrl: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
