<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import Button, { Label } from '@smui/button';
	import Card, { Content, Actions } from '@smui/card';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import { mdiCheckCircle, mdiEmail, mdiGoogle } from '@mdi/js';
	import { Icon } from '@smui/common';

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);
	let successEmail = $state('');
	let socialLoading = $state(false);

	async function handleSignup(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		const { error: authError } = await authClient.signUp.email({
			name,
			email,
			password,
			username,
			callbackURL: '/'
		});

		loading = false;

		if (authError) {
			error = authError.message ?? 'Sign up failed. Please try again.';
		} else {
			success = true;
			successEmail = email;
			// Reset form
			name = '';
			username = '';
			email = '';
			password = '';
		}
	}

	async function handleGoogleSignup() {
		socialLoading = true;
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/'
		});
	}
</script>

<div class="auth-container">
	<Card>
		<Content>
			{#if success}
				<div class="success-box">
					<div class="success-icon">
						<Icon tag="svg" viewBox="0 0 24 24">
							<path fill="currentColor" d={mdiCheckCircle} />
						</Icon>
					</div>
					<h2 class="auth-title">Email Sent!</h2>
					<p class="success-message">
						Một email xác minh đã được gửi tới <strong>{successEmail}</strong>.
					</p>
					<p class="success-detail">
						Nhấp vào liên kết trong email để xác minh tài khoản của bạn. Nếu bạn không thấy email,
						hãy kiểm tra thư mục <strong>Spam</strong>.
					</p>
					<p class="success-detail secondary">Liên kết sẽ hết hạn trong 24 giờ.</p>
					<Actions class="auth-actions">
						<Button href="/login" variant="raised" style="width: 100%;">
							<Label>Đi tới Đăng nhập</Label>
						</Button>
					</Actions>
				</div>
			{:else}
				<h2 class="auth-title">Create Account</h2>

				<form onsubmit={handleSignup} class="auth-form">
					<div class="field">
						<Textfield
							bind:value={name}
							label="Full Name"
							type="text"
							required
							style="width: 100%;"
						>
							{#snippet helper()}
								<HelperText>Your display name</HelperText>
							{/snippet}
						</Textfield>
					</div>

					<div class="field">
						<Textfield
							bind:value={username}
							label="Username"
							type="text"
							required
							style="width: 100%;"
						>
							{#snippet helper()}
								<HelperText>Used to sign in instead of email</HelperText>
							{/snippet}
						</Textfield>
					</div>

					<div class="field">
						<Textfield bind:value={email} label="Email" type="email" required style="width: 100%;">
							{#snippet helper()}
								<HelperText>Enter your email address</HelperText>
							{/snippet}
						</Textfield>
					</div>

					<div class="field">
						<Textfield
							bind:value={password}
							label="Password"
							type="password"
							required
							style="width: 100%;"
						>
							{#snippet helper()}
								<HelperText>At least 8 characters</HelperText>
							{/snippet}
						</Textfield>
					</div>

					{#if error}
						<p class="error">{error}</p>
					{/if}

					<Actions class="auth-actions">
						<Button type="submit" variant="raised" disabled={loading} style="width: 100%;">
							<Label>{loading ? 'Creating account...' : 'Sign Up'}</Label>
						</Button>
					</Actions>
					<div class="divider">
						<span>or</span>
					</div>

					<Button
						onclick={handleGoogleSignup}
						variant="outlined"
						disabled={socialLoading}
						style="width: 100%;"
						class="google-btn"
					>
						<Icon tag="svg" viewBox="0 0 24 24" class="google-icon">
							<path fill="currentColor" d={mdiGoogle} />
						</Icon>
						<Label>{socialLoading ? 'Signing up...' : 'Sign up with Google'}</Label>
					</Button>
				</form>
			{/if}
		</Content>

		{#if !success}
			<div class="auth-footer">
				<p>Already have an account? <a href="/login">Sign in</a></p>
			</div>
		{/if}
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
		margin: 0 0 24px;
		font-size: 1.75rem;
		font-weight: 600;
		text-align: center;
	}

	.success-box {
		text-align: center;
		padding: 0 12px;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 20px;
		color: #4caf50;
	}

	:global(.success-icon svg) {
		width: 64px;
		height: 64px;
	}

	.success-message {
		margin: 16px 0;
		font-size: 1.125rem;
		color: #333;
		line-height: 1.5;
	}

	.success-detail {
		margin: 12px 0;
		font-size: 0.95rem;
		color: #666;
		line-height: 1.5;
	}

	.success-detail.secondary {
		color: #999;
		font-size: 0.85rem;
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

	.auth-footer {
		padding: 12px 24px 24px;
		text-align: center;
		font-size: 0.9rem;
	}

	.auth-footer a {
		color: var(--mdc-theme-primary, #6200ee);
		text-decoration: none;
		font-weight: 500;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}

	:global(.auth-actions) {
		justify-content: center;
		padding: 0 !important;
		margin-top: 12px;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 8px 0;
		color: #ccc;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #ccc;
	}

	:global(.google-btn.mdc-button) {
		border-color: var(--mdc-theme-primary, #ff3e00) !important;
		color: var(--mdc-theme-primary, #ff3e00) !important;
	}

	:global(.google-btn.mdc-button:hover) {
		background-color: rgba(255, 62, 0, 0.08) !important;
		border-color: var(--mdc-theme-primary, #ff3e00) !important;
	}

	:global(.google-icon) {
		width: 18px;
		height: 18px;
		margin-right: 8px;
	}
</style>
