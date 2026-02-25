<script lang="ts">
	import type { PageData } from './$types.js';
	import { page } from '$app/state';
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import {
		mdiCheckCircle,
		mdiClockOutline,
		mdiFilterOutline,
		mdiOpenInNew,
		mdiPencil
	} from '@mdi/js';

	let { data }: { data: PageData } = $props();

	const levelConfig: Record<number, { sublabel: string; color: string }> = {
		0: { sublabel: 'Dễ', color: '#4caf50' },
		1: { sublabel: 'TB', color: '#ff9800' },
		2: { sublabel: 'Khó', color: '#f44336' }
	};

	function pct(score: number | null, total: number) {
		if (score === null) return null;
		return total > 0 ? Math.round((score / total) * 100) : 0;
	}

	function pctColor(p: number) {
		return p >= 70 ? '#4caf50' : p >= 40 ? '#ff9800' : '#f44336';
	}

	function dateStr(d: Date | string) {
		return new Date(d).toLocaleString('vi-VN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function filterHref(params: Record<string, string | null>) {
		const u = new URL(page.url);
		for (const [k, v] of Object.entries(params)) {
			if (v === null) u.searchParams.delete(k);
			else u.searchParams.set(k, v);
		}
		return u.pathname + u.search;
	}
</script>

<svelte:head>
	<title>Bài làm của tôi – YAPMS</title>
</svelte:head>

<div class="subs-page">
	<div class="page-header">
		<h1>Bài làm của tôi</h1>
		<p class="sub-count">
			{data.submissions.length} bài{data.statusFilter || data.gradeFilter ? ' (đang lọc)' : ''}
		</p>
	</div>

	<!-- Filters -->
	<div class="filters">
		<div class="filter-group">
			<Icon tag="svg" viewBox="0 0 24 24" class="filter-icon">
				<path fill="currentColor" d={mdiFilterOutline} />
			</Icon>
			<span class="filter-label">Trạng thái:</span>
			<a href={filterHref({ status: null })} class="chip {!data.statusFilter ? 'chip-active' : ''}"
				>Tất cả</a
			>
			<a
				href={filterHref({ status: 'completing' })}
				class="chip {data.statusFilter === 'completing' ? 'chip-active' : ''}">Đang làm</a
			>
			<a
				href={filterHref({ status: 'evaluated' })}
				class="chip {data.statusFilter === 'evaluated' ? 'chip-active' : ''}">Đã chấm</a
			>
		</div>
		<div class="filter-group">
			<span class="filter-label">Lớp:</span>
			<a href={filterHref({ grade: null })} class="chip {!data.gradeFilter ? 'chip-active' : ''}"
				>Tất cả</a
			>
			{#each [1, 2, 3, 4, 5] as g}
				<a
					href={filterHref({ grade: String(g) })}
					class="chip {data.gradeFilter === g ? 'chip-active' : ''}">Lớp {g}</a
				>
			{/each}
		</div>
	</div>

	{#if data.submissions.length === 0}
		<div class="empty">
			<p>Chưa có bài làm nào{data.statusFilter || data.gradeFilter ? ' phù hợp bộ lọc' : ''}.</p>
			<Button href="/grades/1" variant="raised"><Label>Bắt đầu làm bài</Label></Button>
		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Chủ đề</th>
						<th>Lớp</th>
						<th>Độ khó</th>
						<th>Kết quả</th>
						<th>Trạng thái</th>
						<th>Thời gian</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.submissions as sub}
						{@const p = pct(sub.score, sub.totalQuestions)}
						{@const lvl = levelConfig[sub.level as 0 | 1 | 2] ?? levelConfig[0]!}
						<tr class="sub-row {sub.status === 'evaluated' ? 'row-evaluated' : 'row-completing'}">
							<td class="td-id">{sub.id}</td>
							<td class="td-name">
								<a href="/grades/{sub.grade}/{sub.categoryId}" class="cat-link">
									{sub.categoryName ?? '—'}
								</a>
							</td>
							<td class="td-grade">
								<span class="grade-badge">Lớp {sub.grade}</span>
							</td>
							<td class="td-level">
								<span
									class="level-chip"
									style="background:{lvl.color}20;color:{lvl.color};border:1px solid {lvl.color};"
								>
									{lvl.sublabel}
								</span>
							</td>
							<td class="td-score">
								{#if sub.status === 'evaluated' && p !== null}
									<span class="score-val" style="color:{pctColor(p)};">
										{sub.score}/{sub.totalQuestions}
										<span class="score-pct">({p}%)</span>
									</span>
								{:else}
									<span class="score-pending">—</span>
								{/if}
							</td>
							<td class="td-status">
								{#if sub.status === 'evaluated'}
									<span class="status-chip status-done">
										<Icon tag="svg" viewBox="0 0 24 24" class="status-icon">
											<path fill="currentColor" d={mdiCheckCircle} />
										</Icon>
										Đã chấm
									</span>
								{:else}
									<span class="status-chip status-wip">
										<Icon tag="svg" viewBox="0 0 24 24" class="status-icon">
											<path fill="currentColor" d={mdiClockOutline} />
										</Icon>
										Đang làm
									</span>
								{/if}
							</td>
							<td class="td-date">{dateStr(sub.createdAt)}</td>
							<td class="td-action">
								{#if sub.status === 'evaluated'}
									<Button href="/submissions/{sub.id}" variant="outlined" class="action-btn">
										<Icon tag="svg" viewBox="0 0 24 24">
											<path fill="currentColor" d={mdiOpenInNew} />
										</Icon>
										<Label>Xem</Label>
									</Button>
								{:else}
									<Button
										href="/grades/{sub.grade}/{sub.categoryId}/{sub.level}"
										variant="raised"
										class="action-btn"
									>
										<Icon tag="svg" viewBox="0 0 24 24">
											<path fill="currentColor" d={mdiPencil} />
										</Icon>
										<Label>Tiếp tục</Label>
									</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.subs-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
	}
	.sub-count {
		margin: 0.25rem 0 0;
		color: #888;
		font-size: 0.9rem;
	}

	/* ── Filters ── */
	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.filter-label {
		font-size: 0.85rem;
		color: #888;
		white-space: nowrap;
	}
	:global(.filter-icon) {
		width: 18px;
		height: 18px;
		color: #888;
	}

	.chip {
		padding: 0.2rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid #ccc;
		text-decoration: none;
		color: inherit;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}
	.chip:hover {
		border-color: var(--mdc-theme-primary, #ff3e00);
	}
	.chip-active {
		background-color: var(--mdc-theme-primary, #ff3e00);
		border-color: var(--mdc-theme-primary, #ff3e00);
		color: #fff;
	}

	/* ── Table ── */
	.table-wrap {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid rgba(128, 128, 128, 0.2);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	thead th {
		padding: 0.7rem 1rem;
		text-align: left;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #888;
		border-bottom: 1px solid rgba(128, 128, 128, 0.2);
		white-space: nowrap;
	}
	tbody tr {
		border-bottom: 1px solid rgba(128, 128, 128, 0.1);
		transition: background-color 0.1s;
	}
	tbody tr:last-child {
		border-bottom: none;
	}
	tbody tr:hover {
		background-color: rgba(128, 128, 128, 0.05);
	}

	td {
		padding: 0.65rem 1rem;
		vertical-align: middle;
	}

	.td-id {
		color: #888;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}
	.td-name .cat-link {
		text-decoration: none;
		font-weight: 500;
	}
	.td-name .cat-link:hover {
		text-decoration: underline;
		color: var(--mdc-theme-primary, #ff3e00);
	}

	.grade-badge {
		padding: 0.15rem 0.55rem;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		background: rgba(128, 128, 128, 0.12);
		white-space: nowrap;
	}
	.level-chip {
		padding: 0.15rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.78rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.score-val {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.score-pct {
		font-size: 0.78rem;
		font-weight: 400;
	}
	.score-pending {
		color: #aaa;
	}

	.status-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.status-done {
		background: #e8f5e9;
		color: #2e7d32;
	}
	.status-wip {
		background: rgba(255, 152, 0, 0.12);
		color: #e65100;
	}
	:global(.status-icon) {
		width: 14px;
		height: 14px;
	}

	.td-date {
		color: #888;
		font-size: 0.8rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	:global(.action-btn.mdc-button) {
		min-width: 0;
		padding: 0 12px;
	}

	/* ── Empty ── */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 5rem 2rem;
		color: #888;
		text-align: center;
	}
</style>
