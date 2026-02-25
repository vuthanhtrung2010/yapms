<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy, onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		mdiMenu,
		mdiPalette,
		mdiCheck,
		mdiAccountCircle,
		mdiCog,
		mdiLogout,
		mdiHome,
		mdiClipboardList,
		mdiNumeric1Box,
		mdiNumeric2Box,
		mdiNumeric3Box,
		mdiNumeric4Box,
		mdiNumeric5Box,
		mdiGithub
	} from '@mdi/js';
	import TinyGesture from 'tinygesture';
	import { assets } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime.js';
	import { authClient } from '$lib/auth-client.js';

	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
	import Drawer, { Content, Scrim, AppContent } from '@smui/drawer';
	import IconButton from '@smui/icon-button';
	import Menu, { SelectionGroup, SelectionGroupIcon } from '@smui/menu';
	import List, { Item, Text, Separator, Subheader } from '@smui/list';
	import { Icon } from '@smui/common';
	import Button from '@smui/button';
	import './layout.css';
	import './_Round.scss';

	let { children, data }: { children: Snippet; data: App.PageData } = $props();

	const gradeIcons = [
		mdiNumeric1Box,
		mdiNumeric2Box,
		mdiNumeric3Box,
		mdiNumeric4Box,
		mdiNumeric5Box
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	let drawer: Drawer | undefined = $state();
	let mainContent: HTMLElement | undefined = $state();
	let miniWindow = $state(false);
	let drawerOpen = $state(false);
	let drawerCollapsed = $state(false);
	let drawerGesture: TinyGesture;
	let mainContentGesture: TinyGesture;

	let themeMenu: Menu | undefined = $state();
	let userMenu: Menu | undefined = $state();
	let lightTheme: boolean | null = $state(null);

	onMount(() => setTimeout(setMiniWindow, 0));

	onMount(() => {
		if (mainContent) {
			mainContentGesture = new TinyGesture(mainContent, {
				mouseSupport: false
			});
			let touchStartX = 0;
			mainContentGesture.on('panstart', () => {
				touchStartX = mainContentGesture.touchStartX ?? 0;
			});
			mainContentGesture.on('swiperight', () => {
				if (touchStartX <= 40) {
					drawerOpen = true;
				}
			});
		}

		if (drawer) {
			drawerGesture = new TinyGesture(drawer.getElement(), {
				mouseSupport: false
			});
			drawerGesture.on('swipeleft', () => {
				drawerOpen = false;
			});
		}
	});

	onDestroy(() => {
		if (mainContentGesture) {
			mainContentGesture.destroy();
		}
		if (drawerGesture) {
			drawerGesture.destroy();
		}
	});

	function setMiniWindow() {
		if (typeof window !== 'undefined') {
			miniWindow = window.innerWidth < 720;
		}
	}

	async function handleSignOut() {
		userMenu?.setOpen(false);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					await invalidateAll();
					goto('/');
				}
			}
		});
	}
</script>

<svelte:window onresize={setMiniWindow} />

<svelte:head>
	<!-- SMUI Styles -->
	<link rel="stylesheet" href="{assets}/smui.css" />

	{#if lightTheme === false}
		<!-- SMUI Styles -->
		<link rel="stylesheet" href="{assets}/smui-dark.css" media="screen" />
	{:else if lightTheme !== true}
		<!-- SMUI Styles -->
		<link
			rel="stylesheet"
			href="{assets}/smui-dark.css"
			media="screen and (prefers-color-scheme: dark)"
		/>
	{/if}
</svelte:head>

<TopAppBar variant="static">
	<Row>
		<Section>
			<IconButton
				onclick={() =>
					miniWindow ? (drawerOpen = !drawerOpen) : (drawerCollapsed = !drawerCollapsed)}
			>
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiMenu} />
				</Icon>
			</IconButton>
			<Title tag="a" href="/" style={miniWindow ? 'padding-left: 0;' : ''}>
				{miniWindow ? 'YAPMS' : 'Yet Another Primary Math System'}
			</Title>
		</Section>
		<Section align="end" toolbar>
			<div class="topbar-actions">
				<IconButton
					title="Visit GitHub repository"
					onclick={() => window.open('https://github.com/vuthanhtrung2010/yapms', '_blank')}
				>
					<Icon tag="svg" viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiGithub} />
					</Icon>
				</IconButton>

				<div class="menu-anchor">
					<IconButton
						onclick={() => themeMenu?.setOpen(true)}
						title="Pick a theme or toggle dark mode."
					>
						<Icon tag="svg" viewBox="0 0 24 24">
							<path fill="currentColor" d={mdiPalette} />
						</Icon>
					</IconButton>
					<Menu bind:this={themeMenu} class="theme-menu">
						<List>
							<SelectionGroup>
								<Item onSMUIAction={() => (lightTheme = null)} selected={lightTheme == null}>
									<SelectionGroupIcon>
										<Icon tag="svg" viewBox="0 0 24 24">
											<path fill="currentColor" d={mdiCheck} />
										</Icon>
									</SelectionGroupIcon>
									<Text>Follow System</Text>
								</Item>
								{#each [{ label: 'Light', value: true }, { label: 'Dark', value: false }] as item (item.label)}
									<Item
										onSMUIAction={() => (lightTheme = item.value)}
										selected={lightTheme === item.value}
									>
										<SelectionGroupIcon>
											<Icon tag="svg" viewBox="0 0 24 24">
												<path fill="currentColor" d={mdiCheck} />
											</Icon>
										</SelectionGroupIcon>
										<Text>{item.label}</Text>
									</Item>
								{/each}
							</SelectionGroup>
						</List>
					</Menu>
				</div>

				{#if data?.user?.gravatarUrl}
					<div class="menu-anchor">
						<button
							class="avatar-button"
							title={data.user.displayName}
							onclick={() => userMenu?.setOpen(true)}
						>
							<img src={data.user.gravatarUrl} alt="User avatar" />
						</button>
						<Menu bind:this={userMenu} class="user-menu">
							<List>
								<li class="user-menu-header">
									<img class="user-menu-avatar" src={data.user.gravatarUrl} alt="User avatar" />
									<span class="user-menu-name">{data.user.displayName}</span>
								</li>
								<Item href="/profile">
									<Icon class="user-menu-icon" tag="svg" viewBox="0 0 24 24">
										<path fill="currentColor" d={mdiAccountCircle} />
									</Icon>
									<Text>My profile</Text>
								</Item>
								<Item href="/settings">
									<Icon class="user-menu-icon" tag="svg" viewBox="0 0 24 24">
										<path fill="currentColor" d={mdiCog} />
									</Icon>
									<Text>Settings</Text>
								</Item>
								<Item onSMUIAction={handleSignOut}>
									<Icon class="user-menu-icon" tag="svg" viewBox="0 0 24 24">
										<path fill="currentColor" d={mdiLogout} />
									</Icon>
									<Text>Sign out</Text>
								</Item>
							</List>
						</Menu>
					</div>
				{:else}
					<Button class="signin-button button-shaped-round" variant="raised" href="/login"
						>Sign in</Button
					>
				{/if}
			</div>
		</Section>
	</Row>
</TopAppBar>

<div class="drawer-container">
	<Drawer
		bind:this={drawer}
		variant={miniWindow ? 'modal' : undefined}
		bind:open={drawerOpen}
		class={[
			miniWindow ? 'drawer-adjust' : 'hide-initial-small',
			!miniWindow && drawerCollapsed ? 'drawer-collapsed' : ''
		].join(' ')}
	>
		<Content>
			<List>
				<!-- Home -->
				<Item href="/" title="Trang chủ" activated={isActive('/')}>
					<Icon tag="svg" viewBox="0 0 24 24" class="drawer-item-icon">
						<path fill="currentColor" d={mdiHome} />
					</Icon>
					{#if !drawerCollapsed || miniWindow}
						<Text>Trang chủ</Text>
					{/if}
				</Item>

				<Separator />

				<!-- Grades -->
				{#if !drawerCollapsed || miniWindow}
					<Subheader tag="h6">Lớp học</Subheader>
				{/if}
				{#each [1, 2, 3, 4, 5] as grade, i}
					<Item href="/grades/{grade}" title="Lớp {grade}" activated={isActive('/grades/' + grade)}>
						<Icon tag="svg" viewBox="0 0 24 24" class="drawer-item-icon">
							<path fill="currentColor" d={gradeIcons[i]} />
						</Icon>
						{#if !drawerCollapsed || miniWindow}
							<Text>Lớp {grade}</Text>
						{/if}
					</Item>
				{/each}

				{#if data?.user}
					<Separator />

					<!-- Submissions -->
					{#if !drawerCollapsed || miniWindow}
						<Subheader tag="h6">Cá nhân</Subheader>
					{/if}
					<Item href="/submissions" title="Bài làm của tôi" activated={isActive('/submissions')}>
						<Icon tag="svg" viewBox="0 0 24 24" class="drawer-item-icon">
							<path fill="currentColor" d={mdiClipboardList} />
						</Icon>
						{#if !drawerCollapsed || miniWindow}
							<Text>Bài làm của tôi</Text>
						{/if}
					</Item>
				{/if}
			</List>
		</Content>
	</Drawer>

	{#if miniWindow}
		<Scrim />
	{/if}
	<AppContent class="app-content">
		<main class="main-content" bind:this={mainContent}>
			{@render children()}
		</main>
	</AppContent>
</div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
	{/each}
</div>

<style>
	.drawer-container {
		display: flex;
		overflow: hidden;
		position: relative;
		height: calc(100vh - 64px);
		z-index: 0;
	}

	* > :global(.app-content) {
		flex: auto;
		overflow: auto;
		position: relative;
		flex-grow: 1;
	}

	.main-content {
		overflow: auto;
		padding: 16px;
		height: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 720px) {
		* > :global(.hide-initial-small) {
			display: none;
		}
	}

	:global(.mdc-drawer:not(.mdc-drawer--modal)) {
		transition: width 200ms ease;
	}

	:global(.mdc-drawer.drawer-collapsed) {
		width: 56px !important;
	}

	:global(.drawer-collapsed .mdc-list-item) {
		padding: 0;
		justify-content: center;
	}

	:global(.drawer-collapsed .mdc-list-item .mdc-list-item__text) {
		display: none;
	}

	:global(.drawer-item-icon) {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		margin-right: 12px;
	}

	:global(.drawer-collapsed .drawer-item-icon) {
		margin-right: 0;
	}

	.topbar-actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.menu-anchor {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	:global(.menu-anchor .mdc-menu) {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
	}

	:global(.theme-menu .mdc-menu-surface),
	:global(.user-menu .mdc-menu-surface) {
		border-radius: 12px;
		overflow: hidden;
	}

	.avatar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.avatar-button img {
		width: 32px;
		height: 32px;
		border-radius: 999px;
		display: block;
	}

	:global(.signin-button.mdc-button) {
		--mdc-protected-button-container-color: #26c6da;
		--mdc-protected-button-label-text-color: #000;
		--mdc-protected-button-container-height: 36px;
		padding: 0 20px;
		font-weight: 600;
		letter-spacing: 0.01em;
		box-shadow: none;
	}
	:global(.signin-button.mdc-button:hover) {
		--mdc-protected-button-container-color: #00b8d4;
	}

	/* Force surface to shrink-wrap all children including the header */
	:global(.user-menu .mdc-menu-surface) {
		width: max-content !important;
		min-width: 0 !important;
		overflow: hidden !important;
	}

	/* Header row */
	:global(.user-menu .user-menu-header) {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		list-style: none;
		white-space: nowrap;
		pointer-events: none;
	}

	:global(.user-menu .user-menu-avatar) {
		width: 32px;
		height: 32px;
		min-width: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	:global(.user-menu .user-menu-name) {
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
	}

	/* Row icons */
	:global(.user-menu-icon) {
		width: 20px;
		height: 20px;
		margin-right: 8px;
		flex-shrink: 0;
	}

	/* Prevent text wrapping in all menu items */
	:global(.user-menu .mdc-list-item__text) {
		white-space: nowrap;
	}
</style>
