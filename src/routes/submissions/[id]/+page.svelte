<script lang="ts">
	import type { PageData } from './$types.js';
	import Card, { Content } from '@smui/card';
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import { mdiArrowLeft, mdiCheckCircle, mdiCloseCircle, mdiRefresh, mdiMinus } from '@mdi/js';

	let { data }: { data: PageData } = $props();

	const submission = $derived(data.submission);
	const category = $derived(data.category);
	const questions = $derived(data.questions);

	const levelConfig: Record<number, { label: string; sublabel: string; color: string }> = {
		0: { label: 'Nhận biết', sublabel: 'Dễ', color: '#4caf50' },
		1: { label: 'Thông hiểu', sublabel: 'Trung bình', color: '#ff9800' },
		2: { label: 'Vận dụng', sublabel: 'Khó', color: '#f44336' }
	};

	const typeConfig: Record<string, { label: string; color: string }> = {
		multiple_choice: { label: 'Trắc nghiệm', color: '#1976d2' },
		short_answer: { label: 'Trả lời ngắn', color: '#7b1fa2' },
		true_false: { label: 'Đúng / Sai', color: '#00796b' },
		fill_in_the_blank: { label: 'Điền vào chỗ trống', color: '#e65100' }
	};

	const score = $derived(submission.score ?? 0);
	const total = $derived(submission.totalQuestions);
	const pct = $derived(total > 0 ? Math.round((score / total) * 100) : 0);
	const resultColor = $derived(pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336');
	const levelInfo = $derived(levelConfig[submission.level as 0 | 1 | 2] ?? levelConfig[0]!);
	const evaluatedAt = $derived(
		submission.evaluatedAt ? new Date(submission.evaluatedAt).toLocaleString('vi-VN') : null
	);
</script>

<svelte:head>
	<title>Kết quả #{submission.id} – YAPMS</title>
</svelte:head>

<div class="sub-page">
	<!-- Breadcrumb -->
	<div class="breadcrumb">
		{#if category}
			<Button href="/grades/{submission.grade}" variant="outlined" class="bc-btn">
				<Label>Lớp {submission.grade}</Label>
			</Button>
			<span class="bc-sep">›</span>
			<Button
				href="/grades/{submission.grade}/{submission.categoryId}"
				variant="outlined"
				class="bc-btn"
			>
				<Label>{category.name}</Label>
			</Button>
			<span class="bc-sep">›</span>
			<Button
				href="/grades/{submission.grade}/{submission.categoryId}/{submission.level}"
				variant="outlined"
				class="bc-btn"
			>
				<Label>{levelInfo.sublabel}</Label>
			</Button>
		{/if}
	</div>

	<!-- Back button -->
	<div class="back-row">
		<Button
			href="/grades/{submission.grade}/{submission.categoryId}/{submission.level}"
			variant="outlined"
		>
			<Icon tag="svg" viewBox="0 0 24 24"><path fill="currentColor" d={mdiArrowLeft} /></Icon>
			<Label>Quay lại</Label>
		</Button>
	</div>

	<!-- Score banner -->
	<div class="score-banner" style="border-left-color: {resultColor};">
		<div class="score-main">
			<span class="score-big" style="color: {resultColor};">{score}/{total}</span>
			<span class="score-pct" style="color: {resultColor};">{pct}%</span>
		</div>
		<div class="score-meta">
			<p class="score-msg">
				{#if pct === 100}🎉 Hoàn hảo!
				{:else if pct >= 70}👍 Làm tốt lắm!
				{:else if pct >= 40}📚 Cần ôn thêm
				{:else}💪 Cố gắng lên nào!{/if}
			</p>
			{#if category}
				<p class="score-detail">
					{category.name} ·
					<span
						class="level-chip"
						style="background:{levelInfo.color}20;color:{levelInfo.color};border:1px solid {levelInfo.color};"
					>
						{levelInfo.sublabel}
					</span>
				</p>
			{/if}
			{#if evaluatedAt}
				<p class="score-date">Nộp lúc {evaluatedAt}</p>
			{/if}
		</div>
		<Button
			href="/grades/{submission.grade}/{submission.categoryId}/{submission.level}"
			variant="raised"
		>
			<Icon tag="svg" viewBox="0 0 24 24"><path fill="currentColor" d={mdiRefresh} /></Icon>
			<Label>Làm lại</Label>
		</Button>
	</div>

	<!-- Question review -->
	<div class="questions-list">
		{#each questions as q, i}
			{@const isCorrect = q.userAnswer?.isCorrect}
			{@const userAns = q.userAnswer?.answer}
			{@const qType = typeConfig[q.questionType] ?? { label: q.questionType, color: '#555' }}
			<Card
				class="q-card {isCorrect === true
					? 'card-correct'
					: isCorrect === false
						? 'card-wrong'
						: 'card-skipped'}"
			>
				<Content>
					<div class="q-header">
						<span class="q-num">{i + 1}</span>
						<span
							class="type-badge"
							style="background:{qType.color}20;color:{qType.color};border:1px solid {qType.color};"
						>
							{qType.label}
						</span>
						<span class="verdict">
							{#if isCorrect === true}
								<Icon tag="svg" viewBox="0 0 24 24" class="v-correct">
									<path fill="currentColor" d={mdiCheckCircle} />
								</Icon>
							{:else if isCorrect === false}
								<Icon tag="svg" viewBox="0 0 24 24" class="v-wrong">
									<path fill="currentColor" d={mdiCloseCircle} />
								</Icon>
							{:else}
								<Icon tag="svg" viewBox="0 0 24 24" class="v-skip">
									<path fill="currentColor" d={mdiMinus} />
								</Icon>
							{/if}
						</span>
					</div>

					<p class="q-text">{q.question}</p>

					{#if q.choices.length > 0}
						<div class="choices">
							{#each q.choices as choice}
								{@const isUserPick = userAns === String(choice.id)}
								{@const isCorrectChoice = choice.isCorrect}
								<div
									class="choice-item"
									class:choice-correct={isCorrectChoice}
									class:choice-user-wrong={isUserPick && !isCorrectChoice}
								>
									{#if isCorrectChoice}
										<Icon tag="svg" viewBox="0 0 24 24" class="ci-icon v-correct">
											<path fill="currentColor" d={mdiCheckCircle} />
										</Icon>
									{:else if isUserPick && !isCorrectChoice}
										<Icon tag="svg" viewBox="0 0 24 24" class="ci-icon v-wrong">
											<path fill="currentColor" d={mdiCloseCircle} />
										</Icon>
									{:else}
										<span class="ci-dot"></span>
									{/if}
									<span>{choice.content}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-result">
							<div class="ans-row">
								<span class="ans-label">Bạn trả lời:</span>
								<span class="ans-val {isCorrect ? 'correct-text' : 'wrong-text'}"
									>{userAns ?? '(bỏ trống)'}</span
								>
							</div>
							{#if !isCorrect && q.answer}
								<div class="ans-row">
									<span class="ans-label">Đáp án đúng:</span>
									<span class="ans-val correct-text">{q.answer}</span>
								</div>
							{/if}
						</div>
					{/if}

					{#if q.explanation}
						<p class="explanation"><strong>Giải thích:</strong> {q.explanation}</p>
					{/if}
				</Content>
			</Card>
		{/each}
	</div>
</div>

<style>
	.sub-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	.bc-sep {
		color: #888;
		font-size: 1.1rem;
	}

	.back-row {
		margin-bottom: 1.5rem;
	}

	/* ── Score banner ── */
	.score-banner {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
		padding: 1.5rem;
		border-left: 6px solid #4caf50;
		background-color: rgba(0, 0, 0, 0.04);
		border-radius: 0 8px 8px 0;
		margin-bottom: 2rem;
	}
	.score-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 80px;
	}
	.score-big {
		font-size: 2.8rem;
		font-weight: 800;
		line-height: 1;
	}
	.score-pct {
		font-size: 1rem;
	}
	.score-meta {
		flex: 1;
	}
	.score-msg {
		margin: 0 0 0.3rem;
		font-size: 1.1rem;
		font-weight: 600;
	}
	.score-detail {
		margin: 0 0 0.2rem;
		font-size: 0.9rem;
		color: #888;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.score-date {
		margin: 0;
		font-size: 0.8rem;
		color: #aaa;
	}

	.level-chip {
		padding: 0.1rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	/* ── Questions ── */
	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.q-card) {
		border-left: 4px solid #ccc;
	}
	:global(.q-card.card-correct) {
		border-left-color: #4caf50;
	}
	:global(.q-card.card-wrong) {
		border-left-color: #f44336;
	}
	:global(.q-card.card-skipped) {
		border-left-color: #9e9e9e;
	}

	.q-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}
	.q-num {
		font-weight: 700;
		color: var(--mdc-theme-primary, #ff3e00);
		font-size: 0.9rem;
		min-width: 1.4rem;
	}
	.type-badge {
		padding: 0.15rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.verdict {
		margin-left: auto;
	}
	:global(.v-correct) {
		color: #4caf50;
		width: 20px;
		height: 20px;
	}
	:global(.v-wrong) {
		color: #f44336;
		width: 20px;
		height: 20px;
	}
	:global(.v-skip) {
		color: #9e9e9e;
		width: 20px;
		height: 20px;
	}

	.q-text {
		margin: 0 0 1rem;
		font-size: 1rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.choice-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.94rem;
		background-color: rgba(0, 0, 0, 0.04);
	}
	.choice-correct {
		background-color: #e8f5e9 !important;
		color: #2e7d32;
		font-weight: 600;
	}
	.choice-user-wrong {
		background-color: #ffebee !important;
		color: #c62828;
		text-decoration: line-through;
	}
	:global(.ci-icon) {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.ci-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ccc;
		flex-shrink: 0;
	}

	.text-result {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}
	.ans-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.ans-label {
		color: #888;
		font-weight: 600;
	}
	.correct-text {
		color: #2e7d32;
		font-weight: 700;
	}
	.wrong-text {
		color: #c62828;
		text-decoration: line-through;
	}

	.explanation {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: #aaa;
		background-color: rgba(255, 152, 0, 0.08);
		border-left: 3px solid #ff9800;
		padding: 0.5rem 0.75rem;
		border-radius: 0 6px 6px 0;
		line-height: 1.5;
	}
</style>
