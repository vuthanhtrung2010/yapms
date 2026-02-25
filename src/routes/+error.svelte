<script lang="ts">
	import { page } from '$app/state';
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import { mdiAlertCircleOutline, mdiLockOutline, mdiHome, mdiArrowLeft } from '@mdi/js';
</script>

<svelte:head>
	<title>
		{page.status === 404
			? 'Không tìm thấy'
			: page.status === 403
				? 'Không có quyền truy cập'
				: 'Lỗi'} – YAPMS
	</title>
</svelte:head>

<div class="error-page">
	<div class="error-card">
		{#if page.status === 403}
			<div class="icon-wrap icon-403">
				<Icon tag="svg" viewBox="0 0 24 24" class="err-icon">
					<path fill="currentColor" d={mdiLockOutline} />
				</Icon>
			</div>
			<h1 class="code-text">403</h1>
			<h2>Không có quyền truy cập</h2>
			<p>Bạn không có quyền xem trang này. Bài làm này thuộc về người khác.</p>
		{:else if page.status === 404}
			<div class="icon-wrap icon-404">
				<Icon tag="svg" viewBox="0 0 24 24" class="err-icon">
					<path fill="currentColor" d={mdiAlertCircleOutline} />
				</Icon>
			</div>
			<h1 class="code-text">404</h1>
			<h2>Không tìm thấy trang này</h2>
			<p>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
		{:else}
			<div class="icon-wrap icon-other">
				<Icon tag="svg" viewBox="0 0 24 24" class="err-icon">
					<path fill="currentColor" d={mdiAlertCircleOutline} />
				</Icon>
			</div>
			<h1 class="code-text">{page.status}</h1>
			<h2>Có lỗi xảy ra</h2>
			<p>{page.error?.message ?? 'Đã xảy ra lỗi không xác định.'}</p>
		{/if}

		<div class="actions">
			<Button onclick={() => history.back()} variant="outlined">
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiArrowLeft} />
				</Icon>
				<Label>Quay lại</Label>
			</Button>
			<Button href="/" variant="raised">
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiHome} />
				</Icon>
				<Label>Trang chủ</Label>
			</Button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.error-card {
		max-width: 480px;
		width: 100%;
		text-align: center;
		padding: 3rem 2.5rem;
		border-radius: 16px;
		border: 1px solid rgba(128, 128, 128, 0.2);
		background: rgba(255, 255, 255, 0.03);
	}

	.icon-wrap {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
	}
	.icon-403 {
		background: rgba(244, 67, 54, 0.12);
		color: #f44336;
	}
	.icon-404 {
		background: rgba(255, 152, 0, 0.12);
		color: #ff9800;
	}
	.icon-other {
		background: rgba(128, 128, 128, 0.12);
		color: #888;
	}
	:global(.err-icon) {
		width: 40px;
		height: 40px;
	}

	.code-text {
		font-size: 5rem;
		font-weight: 900;
		letter-spacing: -0.04em;
		margin: 0 0 0.25rem;
		color: var(--mdc-theme-primary, #ff3e00);
		line-height: 1;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.4rem;
		font-weight: 700;
	}

	p {
		margin: 0 0 2rem;
		color: #888;
		line-height: 1.6;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
