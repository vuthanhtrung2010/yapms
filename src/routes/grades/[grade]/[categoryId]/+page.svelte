<script lang="ts">
	import type { PageData } from './$types.js';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Card, { Content, Actions } from '@smui/card';
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import {
		mdiArrowLeft,
		mdiStar,
		mdiStarHalf,
		mdiStarOutline,
		mdiFormatListBulleted
	} from '@mdi/js';

	let { data }: { data: PageData } = $props();

	const levelConfig = [
		{ level: 0, label: 'Nhận biết', sublabel: 'Dễ', color: '#4caf50', icon: mdiStar },
		{ level: 1, label: 'Thông hiểu', sublabel: 'Trung bình', color: '#ff9800', icon: mdiStarHalf },
		{ level: 2, label: 'Vận dụng', sublabel: 'Khó', color: '#f44336', icon: mdiStarOutline }
	];

	const typeLabels: Record<string, string> = {
		multiple_choice: 'Trắc nghiệm',
		short_answer: 'Trả lời ngắn',
		true_false: 'Đúng / Sai',
		fill_in_the_blank: 'Điền vào chỗ trống'
	};

	const typeColors: Record<string, string> = {
		multiple_choice: '#1976d2',
		short_answer: '#7b1fa2',
		true_false: '#00796b',
		fill_in_the_blank: '#e65100'
	};
</script>

<svelte:head>
	<title>{data.category.name} – Lớp {data.grade} – YAPMS</title>
</svelte:head>

<div class="category-page">
	<div class="breadcrumb">
		<Button href="/grades/{data.grade}" variant="outlined" class="back-btn">
			<Icon tag="svg" viewBox="0 0 24 24">
				<path fill="currentColor" d={mdiArrowLeft} />
			</Icon>
			<Label>Lớp {data.grade}</Label>
		</Button>
	</div>

	<div class="page-header">
		<Icon tag="svg" viewBox="0 0 24 24" class="header-icon">
			<path fill="currentColor" d={mdiFormatListBulleted} />
		</Icon>
		<div>
			<p class="grade-label">Lớp {data.grade}</p>
			<h1>{data.category.name}</h1>
		</div>
	</div>

	{#if data.types.length > 0}
		<div class="type-chips">
			{#each data.types as t}
				<span
					class="type-chip"
					style="background-color: {typeColors[t.questionType] ??
						'#555'}22; border: 1px solid {typeColors[t.questionType] ?? '#555'}; color: {typeColors[
						t.questionType
					] ?? '#555'};"
				>
					{typeLabels[t.questionType] ?? t.questionType} · {t.total}
				</span>
			{/each}
		</div>
	{/if}

	<LayoutGrid>
		{#each levelConfig as cfg}
			{@const levelData = data.levels.find((l) => l.level === cfg.level)}
			{@const total = levelData?.total ?? 0}
			<Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
				<Card class="level-card" style="border-top: 4px solid {cfg.color};">
					<Content>
						<div class="level-top">
							<span
								class="level-badge"
								style="background-color: {cfg.color}20; color: {cfg.color}; border: 1px solid {cfg.color};"
							>
								{cfg.sublabel}
							</span>
							<Icon tag="svg" viewBox="0 0 24 24" class="level-icon" style="color: {cfg.color};">
								<path fill="currentColor" d={cfg.icon} />
							</Icon>
						</div>
						<h2 class="level-name" style="color: {cfg.color};">{cfg.label}</h2>
						<p class="level-count">{total} câu hỏi</p>
					</Content>
					<Actions>
						{#if total === 0}
							<Button
								variant="raised"
								disabled
								style="width: 100%; --mdc-theme-primary: {cfg.color};"
							>
								<Label>Chưa có câu hỏi</Label>
							</Button>
						{:else}
							<Button
								variant="raised"
								href="/grades/{data.grade}/{data.category.id}/{cfg.level}"
								style="width: 100%; --mdc-theme-primary: {cfg.color};"
							>
								<Label>Bắt đầu</Label>
							</Button>
						{/if}
					</Actions>
				</Card>
			</Cell>
		{/each}
	</LayoutGrid>
</div>

<style>
	.category-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.breadcrumb {
		margin-bottom: 1.5rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.page-header :global(.header-icon) {
		width: 48px;
		height: 48px;
		color: var(--mdc-theme-primary, #ff3e00);
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.grade-label {
		margin: 0;
		font-size: 0.875rem;
		color: var(--mdc-theme-primary, #ff3e00);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.page-header h1 {
		margin: 0.25rem 0 0;
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.type-chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 2rem;
	}

	.type-chip {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.level-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.level-badge {
		padding: 0.2rem 0.7rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	:global(.level-icon) {
		width: 28px;
		height: 28px;
	}

	.level-name {
		margin: 0 0 0.25rem;
		font-size: 1.4rem;
		font-weight: 700;
	}

	.level-count {
		margin: 0;
		color: #666;
		font-size: 0.95rem;
	}

	:global(.level-card) {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
