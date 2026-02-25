<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import Button, { Label } from '@smui/button';
	import Card, { Content, Actions } from '@smui/card';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import { mdiAlertCircleOutline, mdiEmail, mdiGoogle } from '@mdi/js';
	import { Icon } from '@smui/common';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let emailNotVerified = $state(false);
	let resendLoading = $state(false);
	let resendSuccess = $state(false);
	let socialLoading = $state(false);

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		emailNotVerified = false;
		loading = true;

		const { error: authError } = await authClient.signIn.email({
			email,
			password,
			callbackURL: '/'
		});

		loading = false;

		if (authError) {
			// 403 = email not verified
			if (authError.status === 403) {
				emailNotVerified = true;
				error = '';
			} else {
				error = authError.message ?? 'Login failed. Please try again.';
			}
		} else {
			goto('/');
		}
	}

	async function handleResendVerification() {
		if (!email) return;
		resendLoading = true;
		resendSuccess = false;

		try {
			await authClient.sendVerificationEmail({
				email,
				callbackURL: '/'
			});
			resendSuccess = true;
		} catch (err) {
			error = 'Failed to resend verification email. Please try again.';
		}

		resendLoading = false;
	}

	async function handleGoogleSignIn() {
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
			{#if emailNotVerified}
				<div class="verification-box">
					<div class="warning-icon">
						<Icon tag="svg" viewBox="0 0 24 24">
							<path fill="currentColor" d={mdiAlertCircleOutline} />
						</Icon>
					</div>
					{#if resendSuccess}
						<h2 class="auth-title">Email Sent!</h2>
						<p class="verification-message">
							Một email xác minh mới đã được gửi tới <strong>{email}</strong>.
						</p>
						<p class="verification-detail">
							Vui lòng kiểm tra email của bạn (bao gồm thư mục Spam) để hoàn tất xác minh.
						</p>
					{:else}
						<h2 class="auth-title">Email Not Verified</h2>
						<p class="verification-message">
							Bạn chưa xác minh email của mình. Vui lòng kiểm tra <strong>{email}</strong> để tìm liên
							kết xác minh.
						</p>
						<p class="verification-detail">
							Nếu bạn không thấy email, hãy nhấp vào nút bên dưới để gửi lại.
						</p>
						<p class="verification-detail secondary">Liên kết xác minh sẽ hết hạn trong 24 giờ.</p>
					{/if}
					<Actions class="auth-actions">
						{#if resendSuccess}
							<Button href="/login" variant="raised" style="width: 100%;">
								<Label>Quay lại Đăng nhập</Label>
							</Button>
						{:else}
							<Button
								onclick={handleResendVerification}
								variant="raised"
								disabled={resendLoading}
								style="width: 100%;"
							>
								<Icon tag="svg" viewBox="0 0 24 24" class="btn-icon">
									<path fill="currentColor" d={mdiEmail} />
								</Icon>
								<Label>{resendLoading ? 'Đang gửi...' : 'Gửi lại Email'}</Label>
							</Button>
						{/if}
					</Actions>
				</div>
			{:else}
				<h2 class="auth-title">Sign In</h2>

				<form onsubmit={handleLogin} class="auth-form">
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
								<HelperText>Enter your password</HelperText>
							{/snippet}
						</Textfield>
						<div class="forgot-password-link">
							<a href="/forgot-password">Forgot password?</a>
						</div>
					</div>

					{#if error}
						<p class="error">{error}</p>
					{/if}

					<Actions class="auth-actions">
						<Button type="submit" variant="raised" disabled={loading} style="width: 100%;">
							<Label>{loading ? 'Signing in...' : 'Sign In'}</Label>
						</Button>
					</Actions>

					<div class="divider">
						<span>or</span>
					</div>

					<Button
						onclick={handleGoogleSignIn}
						variant="outlined"
						disabled={socialLoading}
						style="width: 100%;"
						class="google-btn"
					>
						<Icon tag="svg" viewBox="0 0 24 24" class="google-icon">
							<path fill="currentColor" d={mdiGoogle} />
						</Icon>
						<Label>{socialLoading ? 'Signing in...' : 'Sign in with Google'}</Label>
					</Button>
				</form>
			{/if}
		</Content>

		{#if !emailNotVerified}
			<div class="auth-footer">
				<p>Don't have an account? <a href="/signup">Sign up</a></p>
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

	.verification-box {
		text-align: center;
		padding: 0 12px;
	}

	.warning-icon {
		width: 56px;
		height: 56px;
		margin: 0 auto 16px;
		color: #ff9800;
	}

	:global(.warning-icon svg) {
		width: 56px;
		height: 56px;
	}

	.verification-message {
		margin: 16px 0;
		font-size: 1.05rem;
		color: #333;
		line-height: 1.5;
	}

	.verification-detail {
		margin: 12px 0;
		font-size: 0.95rem;
		color: #666;
		line-height: 1.5;
	}

	.verification-detail.secondary {
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

	.forgot-password-link {
		margin-top: 8px;
		text-align: right;
	}

	.forgot-password-link a {
		color: var(--mdc-theme-primary, #6200ee);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.forgot-password-link a:hover {
		text-decoration: underline;
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

	:global(.btn-icon) {
		width: 18px;
		height: 18px;
		margin-right: 8px;
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
