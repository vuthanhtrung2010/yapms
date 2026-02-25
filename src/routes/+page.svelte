<script lang="ts">
	import Card, { Content, Actions } from '@smui/card';
	import Button, { Label } from '@smui/button';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import { mdiBookOpen, mdiTrendingUp, mdiLightbulb, mdiCheckCircle } from '@mdi/js';
	import Paper from '@smui/paper';
	import { Icon } from '@smui/common';

	const grades = [
		{
			level: 1,
			topics: [
				'Số học: Đọc, viết và cấu tạo số trong phạm vi 100',
				'Phép tính: Cộng, trừ không nhớ trong phạm vi 100',
				'Hình học trực quan: Nhận biết hình phẳng và hình khối',
				'Đo lường: Độ dài (cm) và Thời gian (giờ đúng, ngày, tuần)'
			]
		},
		{
			level: 2,
			topics: [
				'Số học: Đọc, viết và cấu tạo số trong phạm vi 1000',
				'Phép tính: Cộng, trừ có nhớ trong phạm vi 100',
				'Phép tính: Bảng nhân 2, 5 và Bảng chia 2, 5',
				'Hình học: Đường thẳng, đường gấp khúc và hình tứ giác',
				'Đo lường: Độ dài (m, km), Khối lượng (kg), Dung tích (lít)',
				'Thống kê và Xác suất: Biểu đồ tranh và khả năng xảy ra'
			]
		},
		{
			level: 3,
			topics: [
				'Số học: Các số và phép tính trong phạm vi 100.000',
				'Phân số: Làm quen với một phần mấy (1/2 đến 1/9)',
				'Hình học: Góc, trung điểm, tính Chu vi và Diện tích',
				'Đo lường: Khối lượng (gam), Dung tích (ml), Nhiệt độ',
				'Toán có lời văn: Bài toán rút về đơn vị (2 bước tính)',
				'Thống kê: Thu thập, phân loại và ghi chép số liệu'
			]
		},
		{
			level: 4,
			topics: [
				'Số học: Số tự nhiên đến lớp triệu và lớp tỉ',
				'Phép tính: Dấu hiệu chia hết (2, 3, 5, 9)',
				'Phân số: Khái niệm, Rút gọn, Quy đồng và 4 phép tính',
				'Hình học: Hai đường thẳng, góc nhọn/tù/bẹt, hình thoi, bình hành',
				'Đo lường: Yến, tạ, tấn, giây, thế kỷ, m², dm²',
				'Toán điển hình: Trung bình cộng và bài toán Tổng - Hiệu',
				'Thống kê: Biểu đồ cột'
			]
		},
		{
			level: 5,
			topics: [
				'Số thập phân: Khái niệm, so sánh và 4 phép tính',
				'Tỉ số phần trăm: Các bài toán về tỉ số và phần trăm',
				'Hình học phẳng: Diện tích tam giác, hình thang, đường tròn',
				'Hình học không gian: Diện tích và Thể tích khối hộp',
				'Toán chuyển động: Vận tốc, Quãng đường, Thời gian',
				'Đo lường: Đơn vị đo diện tích (ha) và thể tích (m³, dm³, cm³)',
				'Thống kê và Xác suất: Biểu đồ hình quạt tròn'
			]
		}
	];

	const features = [
		{
			icon: mdiBookOpen,
			title: 'Nội dung linh hoạt',
			description: 'Hệ thống câu hỏi toàn diện từ Lớp 1 đến Lớp 5'
		},
		{
			icon: mdiTrendingUp,
			title: 'Cấp độ tiến bộ',
			description: '3 mức độ khó từ Dễ, Thông hiểu đến Vận dụng cao'
		},
		{
			icon: mdiLightbulb,
			title: 'Học thực tế',
			description: 'Bài toán từ cuộc sống hàng ngày của học sinh'
		},
		{
			icon: mdiCheckCircle,
			title: 'Hướng dẫn chi tiết',
			description: 'Mỗi câu hỏi đều có lời giải từng bước logic'
		}
	];
</script>

<div class="page-container">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1>Yet Another Primary Math System</h1>
			<p class="subtitle">Hệ thống toán học tiểu học - Học tập thông minh, tiến bộ bền vững</p>
			<div class="hero-actions">
				<Button variant="raised" class="hero-cta" href="/login">
					<Label>Bắt đầu học tập</Label>
				</Button>
				<Button variant="outlined" class="hero-outline">
					<Label>Tìm hiểu thêm</Label>
				</Button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features-section">
		<h2>Tính năng nổi bật</h2>
		<LayoutGrid>
			{#each features as feature}
				<Cell spanDevices={{ desktop: 3, tablet: 2, phone: 4 }}>
					<Paper elevation={1} class="feature-paper">
						<div class="feature-icon">
							<Icon tag="svg" viewBox="0 0 24 24">
								<path fill="currentColor" d={feature.icon} />
							</Icon>
						</div>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
					</Paper>
				</Cell>
			{/each}
		</LayoutGrid>
	</section>

	<!-- Grades Section -->
	<section class="grades-section">
		<h2>Khám phá theo khối lớp</h2>
		<LayoutGrid>
			{#each grades as grade}
				<Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
					<Card class="grade-card">
						<Content>
							<div class="grade-header">
								<div class="grade-number">Lớp {grade.level}</div>
								<div class="grade-badge">{grade.topics.length} chủ đề</div>
							</div>
							<div class="topics-list">
								{#each grade.topics as topic}
									<div class="topic-item">
										<span class="topic-dot">•</span>
										<span>{topic}</span>
									</div>
								{/each}
							</div>
						</Content>
						<Actions>
							<Button
								variant="raised"
								class="grade-explore"
								href="/grades/{grade.level}"
								style="width: 100%;"
							>
								<Label>Khám phá Lớp {grade.level}</Label>
							</Button>
						</Actions>
					</Card>
				</Cell>
			{/each}
		</LayoutGrid>
	</section>

	<!-- CTA Section -->
	<section class="cta-section">
		<h2>Sẵn sàng bắt đầu hành trình toán học?</h2>
		<p>Tham gia hàng nghìn học sinh đang học tập thông minh cùng hệ thống của chúng tôi</p>
		<div class="cta-actions">
			<Button variant="raised" href="/signup">
				<Label>Đăng ký miễn phí</Label>
			</Button>
			<Button variant="outlined">
				<Label>Liên hệ hỗ trợ</Label>
			</Button>
		</div>
	</section>
</div>

<style lang="scss">
	.page-container {
		width: 100%;
	}

	/* Hero */
	.hero {
		background-color: var(--mdc-theme-primary, #ff3e00);
		color: #fff;
		padding: 72px 24px;
		text-align: center;

		.hero-content {
			max-width: 720px;
			margin: 0 auto;

			h1 {
				font-size: 44px;
				font-weight: 700;
				margin: 0 0 12px 0;
				line-height: 1.2;
			}

			.subtitle {
				font-size: 18px;
				font-weight: 400;
				margin: 0 0 36px 0;
				opacity: 0.9;
			}
		}

		.hero-actions {
			display: flex;
			gap: 12px;
			justify-content: center;
			flex-wrap: wrap;

			:global(.hero-cta.mdc-button--raised) {
				background-color: #fff !important;
				color: var(--mdc-theme-primary, #ff3e00) !important;
				font-weight: 600;
			}

			:global(.hero-outline.mdc-button--outlined) {
				border-color: rgba(255, 255, 255, 0.7);
				color: #fff;
			}
		}
	}

	/* Features */
	.features-section {
		padding: 56px 24px;
		max-width: 1100px;
		margin: 0 auto;

		h2 {
			text-align: center;
			font-size: 28px;
			font-weight: 700;
			margin: 0 0 40px 0;
		}

		:global(.feature-paper) {
			padding: 28px 20px;
			text-align: center;
			height: 100%;
			box-sizing: border-box;

			.feature-icon {
				color: var(--mdc-theme-primary, #ff3e00);
				margin-bottom: 14px;
				display: flex;
				justify-content: center;

				:global(svg) {
					width: 40px;
					height: 40px;
				}
			}

			h3 {
				font-size: 16px;
				font-weight: 600;
				margin: 0 0 8px 0;
			}

			p {
				font-size: 14px;
				opacity: 0.7;
				margin: 0;
				line-height: 1.5;
			}
		}
	}

	/* Grades */
	.grades-section {
		padding: 56px 24px;
		max-width: 1100px;
		margin: 0 auto;

		h2 {
			text-align: center;
			font-size: 28px;
			font-weight: 700;
			margin: 0 0 40px 0;
		}

		.grade-header {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			margin-bottom: 16px;

			.grade-number {
				font-size: 24px;
				font-weight: 700;
				color: var(--mdc-theme-primary, #ff3e00);
			}

			.grade-badge {
				font-size: 12px;
				font-weight: 600;
				opacity: 0.6;
			}
		}

		.topics-list {
			margin-bottom: 0;

			.topic-item {
				display: flex;
				gap: 8px;
				margin-bottom: 8px;
				font-size: 13px;
				opacity: 0.8;
				line-height: 1.4;

				.topic-dot {
					color: var(--mdc-theme-primary, #ff3e00);
					flex-shrink: 0;
				}
			}
		}

		:global(.grade-explore.mdc-button--raised) {
			width: 100%;
		}
	}

	/* CTA */
	.cta-section {
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		padding: 72px 24px;
		text-align: center;

		h2 {
			font-size: 28px;
			font-weight: 700;
			margin: 0 0 12px 0;
		}

		p {
			font-size: 16px;
			opacity: 0.7;
			margin: 0 auto 36px auto;
			max-width: 520px;
		}

		.cta-actions {
			display: flex;
			gap: 12px;
			justify-content: center;
			flex-wrap: wrap;
		}
	}

	@media (max-width: 768px) {
		.hero .hero-content h1 {
			font-size: 32px;
		}

		.features-section,
		.grades-section,
		.cta-section {
			padding: 40px 16px;

			h2 {
				font-size: 22px;
			}
		}
	}
</style>
