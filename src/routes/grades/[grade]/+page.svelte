<script lang="ts">
	import type { PageData } from './$types.js';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Card, { Content, Actions } from '@smui/card';
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import { mdiArrowLeft, mdiBookOpen, mdiHelpCircleOutline } from '@mdi/js';

	let { data }: { data: PageData } = $props();

	const levelLabels: Record<number, { label: string; color: string }> = {
		0: { label: 'Dễ', color: '#4caf50' },
		1: { label: 'TB', color: '#ff9800' },
		2: { label: 'Khó', color: '#f44336' }
	};
</script>

<svelte:head>
	<title>Lớp {data.grade} – YAPMS</title>
</svelte:head>

<div class="grade-page">
	<div class="breadcrumb">
		<Button href="/" variant="outlined" class="back-btn">
			<Icon tag="svg" viewBox="0 0 24 24">
				<path fill="currentColor" d={mdiArrowLeft} />
			</Icon>
			<Label>Trang chủ</Label>
		</Button>
	</div>

	<div class="page-header">
		<Icon tag="svg" viewBox="0 0 24 24" class="header-icon">
			<path fill="currentColor" d={mdiBookOpen} />
		</Icon>
		<div>
			<h1>Lớp {data.grade}</h1>
			<p class="subtitle">{data.totalQuestions} câu hỏi · {data.categories.length} chủ đề</p>
		</div>
	</div>

	{#if data.categories.length === 0}
		<div class="empty-state">
			<Icon tag="svg" viewBox="0 0 24 24">
				<path fill="currentColor" d={mdiHelpCircleOutline} />
			</Icon>
			<p>Chưa có câu hỏi nào. Hãy nhập dữ liệu trước!</p>
		</div>
	{:else}
		<LayoutGrid>
			{#each data.categories as category}
				<Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
					<Card class="category-card">
						<Content>
							<h3 class="category-name">{category.name}</h3>
							<div class="level-badges">
								{#each [0, 1, 2] as level}
									{@const info = levelLabels[level]}
									{@const count = category.counts[level as 0 | 1 | 2] ?? 0}
									<span
										class="level-badge"
										style="background-color: {info.color}20; border: 1px solid {info.color}; color: {info.color};"
									>
										{info.label} · {count}
									</span>
								{/each}
							</div>
						</Content>
						<Actions>
							<Button
								variant="raised"
								href="/grades/{data.grade}/{category.id}"
								style="width: 100%;"
							>
								<Label>Xem chủ đề</Label>
							</Button>
						</Actions>
					</Card>
				</Cell>
			{/each}
		</LayoutGrid>
	{/if}
</div>

<style>
	.grade-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.breadcrumb {
		margin-bottom: 1.5rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.page-header :global(.header-icon) {
		width: 48px;
		height: 48px;
		color: var(--mdc-theme-primary, #ff3e00);
		flex-shrink: 0;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--mdc-theme-primary, #ff3e00);
	}

	.subtitle {
		margin: 0.25rem 0 0;
		color: #666;
		font-size: 0.95rem;
	}

	.category-name {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.4;
		min-height: 2.8em;
	}

	.level-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.level-badge {
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 2rem;
		color: #999;
		text-align: center;
	}

	.empty-state :global(svg) {
		width: 64px;
		height: 64px;
	}

	:global(.category-card) {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
