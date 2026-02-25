<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import Button, { Label } from '@smui/button';
	import Card, { Content, Actions } from '@smui/card';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import { mdiEmail, mdiArrowLeft } from '@mdi/js';
	import { Icon } from '@smui/common';

	let email = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);
	let successEmail = $state('');

	async function handleForgotPassword(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			await authClient.requestPasswordReset({
				email,
				redirectTo: '/reset-password'
			});

			success = true;
			successEmail = email;
			email = '';
		} catch (err) {
			error = 'Failed to send reset email. Please try again.';
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Forgot Password – YAPMS</title>
</svelte:head>

<div class="auth-container">
	<Card>
		<Content>
			{#if success}
				<div class="success-box">
					<div class="success-icon">
						<Icon tag="svg" viewBox="0 0 24 24">
							<path fill="currentColor" d={mdiEmail} />
						</Icon>
					</div>
					<h2 class="auth-title">Email Sent!</h2>
					<p class="success-message">
						Một email để đặt lại mật khẩu đã được gửi tới <strong>{successEmail}</strong>.
					</p>
					<p class="success-detail">
						Nhấp vào liên kết trong email để tạo mật khẩu mới. Liên kết sẽ hết hạn trong 1 giờ.
					</p>
					<p class="success-detail secondary">
						Nếu bạn không thấy email, hãy kiểm tra thư mục <strong>Spam</strong>.
					</p>
					<Actions class="auth-actions">
						<Button href="/login" variant="raised" style="width: 100%;">
							<Label>Quay lại Đăng nhập</Label>
						</Button>
					</Actions>
				</div>
			{:else}
				<div class="back-link">
					<a href="/login">
						<Icon tag="svg" viewBox="0 0 24 24">
							<path fill="currentColor" d={mdiArrowLeft} />
						</Icon>
						Back to Sign In
					</a>
				</div>

				<h2 class="auth-title">Reset Your Password</h2>
				<p class="subtitle">
					Enter your email address and we'll send you a link to reset your password.
				</p>

				<form onsubmit={handleForgotPassword} class="auth-form">
					<div class="field">
						<Textfield bind:value={email} label="Email" type="email" required style="width: 100%;">
							{#snippet helper()}
								<HelperText>Your registered email address</HelperText>
							{/snippet}
						</Textfield>
					</div>

					{#if error}
						<p class="error">{error}</p>
					{/if}

					<Actions class="auth-actions">
						<Button type="submit" variant="raised" disabled={loading} style="width: 100%;">
							<Label>{loading ? 'Sending email...' : 'Send Reset Link'}</Label>
						</Button>
					</Actions>
				</form>
			{/if}
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

	.back-link {
		margin-bottom: 20px;
	}

	.back-link a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--mdc-theme-primary, #6200ee);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.back-link a:hover {
		text-decoration: underline;
	}

	:global(.back-link svg) {
		width: 18px;
		height: 18px;
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

	.success-box {
		text-align: center;
		padding: 12px 0;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 16px;
		color: #4caf50;
	}

	:global(.success-icon svg) {
		width: 64px;
		height: 64px;
	}

	.success-message {
		margin: 16px 0;
		font-size: 1.05rem;
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

	:global(.auth-actions) {
		justify-content: center;
		padding: 0 !important;
		margin-top: 12px;
	}
</style>
