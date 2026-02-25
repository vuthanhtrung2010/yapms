<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Card, { Content, Actions } from '@smui/card';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	function clientValidate() {
		error = '';
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return false;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return false;
		}
		return true;
	}
</script>

<svelte:head>
	<title>Reset Password – YAPMS</title>
</svelte:head>

<div class="auth-container">
	<Card>
		<Content>
			<h2 class="auth-title">Create New Password</h2>
			<p class="subtitle">Enter a new password for your account.</p>

			<form
				method="POST"
				action="?/resetPassword"
				class="auth-form"
				use:enhance={({ cancel }) => {
					if (!clientValidate()) {
						cancel();
						return;
					}
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							goto('/login?success=password_reset');
						} else if (result.type === 'failure') {
							error = (result.data?.error as string) || 'Failed to reset password';
						} else {
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="token" value={data.token} />

				<div class="field">
					<Textfield
						bind:value={password}
						input$name="password"
						label="New Password"
						type="password"
						required
						style="width: 100%;"
					>
						{#snippet helper()}
							<HelperText>At least 8 characters</HelperText>
						{/snippet}
					</Textfield>
				</div>

				<div class="field">
					<Textfield
						bind:value={confirmPassword}
						label="Confirm Password"
						type="password"
						required
						style="width: 100%;"
					>
						{#snippet helper()}
							<HelperText>Enter password again</HelperText>
						{/snippet}
					</Textfield>
				</div>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<Actions class="auth-actions">
					<Button type="submit" variant="raised" disabled={loading} style="width: 100%;">
						<Label>{loading ? 'Resetting password...' : 'Reset Password'}</Label>
					</Button>
				</Actions>
			</form>
		</Content>
	</Card>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 70vh;
		padding: 16px;
	}

	.auth-container :global(.mdc-card) {
		width: min(480px, 100%);
		padding: 24px 16px;
	}

	.auth-title {
		margin: 0 0 8px;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0 0 24px;
		color: #666;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.field {
		width: 100%;
	}

	.error {
		color: var(--mdc-theme-error, #b00020);
		font-size: 0.875rem;
		margin: 0;
		padding: 8px 12px;
		background: rgba(176, 0, 32, 0.08);
		border-radius: 4px;
	}

	:global(.auth-actions) {
		justify-content: center;
		padding: 0 !important;
		margin-top: 12px;
	}
</style>
