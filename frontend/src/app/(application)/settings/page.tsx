'use client'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Input } from '~/components/ui/input'
import { SaveIcon } from 'lucide-react'
import TeamTable from '~/components/settings/roles-table'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUpdateSettings } from 'root/.generated'
import { useLayoutStore } from '~/store/layout.store'
import { useSettingsStore } from '~/store/settings.store'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { materialConfirm } from '~/reusable-functions'

export default function SettingsPage() {
	const tabs = [
		{
			slug: 'organization',
			title: 'Organization'
		},
		{
			slug: 'app-settings',
			title: 'App Settings'
		},
		{
			slug: 'whatsapp-business-account',
			title: 'WhatsApp Settings'
		},
		{
			slug: 'live-chat-settings',
			title: 'Live Chat Settings'
		},
		{
			slug: 'quick-actions',
			title: 'Quick Actions'
		},
		{
			slug: 'api-keys',
			title: 'API Keys'
		},
		{
			slug: 'rbac',
			title: 'Access Control'
		}
	]

	const searchParams = useSearchParams()
	const router = useRouter()

	const [activeTab, setActiveTab] = useState(
		searchParams.get('tab')?.toString() || 'app-settings'
	)

	useEffect(() => {
		if (searchParams.get('tab')) {
			setActiveTab(searchParams.get('tab')?.toString() || 'app-settings')
		}
	}, [searchParams])

	const updateOrganizationSettings = useUpdateSettings()

	async function handleSettingsUpdate() {
		await updateOrganizationSettings.mutateAsync({
			data: {}
		})
	}

	async function deleteOrganization() {
		try {
			const confirmed = await materialConfirm({
				title: 'Delete Organization',
				description: 'Are you sure you want to delete this organization?'
			})

			if (!confirmed) {
				return
				// delete organization
			}
		} catch {}
	}

	async function leaveOrganization() {
		try {
			const confirmed = await materialConfirm({
				title: 'Leave Organization',
				description: 'Are you sure you want to leave this organization?'
			})

			if (!confirmed) {
				return
				// delete organization
			}
		} catch {}
	}

	const { isOwner } = useLayoutStore()
	const { writeProperty, organizationSettings } = useSettingsStore()

	return (
		<ScrollArea className="h-full pr-8">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Settings</h2>
					<div className="hidden items-center space-x-2 md:flex">
						<Button
							className="flex flex-row items-center gap-2"
							onClick={() => {
								handleSettingsUpdate().catch(error => console.error(error))
							}}
						>
							<SaveIcon className="size-5" />
							Save
						</Button>
					</div>
				</div>
				<Tabs defaultValue={activeTab} className="space-y-4">
					<TabsList>
						{tabs.map(tab => {
							return (
								<TabsTrigger
									key={tab.slug}
									value={tab.slug}
									onClick={() => {
										router.push(`/settings?tab=${tab.slug}`)
									}}
								>
									{tab.title}
								</TabsTrigger>
							)
						})}
					</TabsList>
					{tabs.map(tab => {
						return (
							<TabsContent
								key={tab.slug}
								value={tab.slug}
								className="space-y-4 py-10"
							>
								{tab.slug === 'app-settings' ? (
									<>
										<Card>
											<CardHeader>
												<CardTitle>Application Name</CardTitle>
												<CardDescription>
													Used to identify your project in the dashboard.
												</CardDescription>
											</CardHeader>
											<CardContent>
												<form>
													<Input placeholder="Project Name" />
												</form>
											</CardContent>
										</Card>
										<Card className="flex flex-row">
											<div className="flex-1">
												<CardHeader>
													<CardTitle>Root Url</CardTitle>
													<CardDescription>
														Used to identify your project in the
														dashboard.
													</CardDescription>
												</CardHeader>
												<CardContent>
													<form>
														<Input placeholder="Project Name" />
													</form>
												</CardContent>
											</div>
											<div className="tremor-Divider-root mx-auto my-6 flex items-center justify-between gap-3 text-tremor-default text-tremor-content dark:text-dark-tremor-content">
												<div className="h-full w-[1px] bg-tremor-border dark:bg-dark-tremor-border"></div>
											</div>
											<div className="flex-1">
												<CardHeader>
													<CardTitle>Favicon Url </CardTitle>
													<CardDescription>
														Used to identify your project in the
														dashboard.
													</CardDescription>
												</CardHeader>
												<CardContent>
													<form>
														<Input placeholder="Project Name" />
													</form>
												</CardContent>
											</div>
										</Card>
										<Card className="flex flex-row">
											<div className="flex-1">
												<CardHeader>
													<CardTitle>Media Upload Path</CardTitle>
													<CardDescription>
														Used to identify your project in the
														dashboard.
													</CardDescription>
												</CardHeader>
												<CardContent>
													<form>
														<Input placeholder="Project Name" />
													</form>
												</CardContent>
											</div>
											<div className="tremor-Divider-root mx-auto my-6 flex items-center justify-between gap-3 text-tremor-default text-tremor-content dark:text-dark-tremor-content">
												<div className="h-full w-[1px] bg-tremor-border dark:bg-dark-tremor-border"></div>
											</div>
											<div className="flex-1">
												<CardHeader>
													<CardTitle>Media Upload URI</CardTitle>
													<CardDescription>
														Used to identify your project in the
														dashboard.
													</CardDescription>
												</CardHeader>
												<CardContent>
													<form>
														<Input placeholder="Project Name" />
													</form>
												</CardContent>
											</div>
										</Card>
									</>
								) : tab.slug === 'whatsapp-business-account' ? (
									<></>
								) : tab.slug === 'live-chat-settings' ? (
									<></>
								) : tab.slug === 'quick-actions' ? (
									<></>
								) : tab.slug === 'api-keys' ? (
									<Card className="my-10 border-none">
										<CardHeader>
											<CardTitle>API Access Key</CardTitle>
											<CardDescription>
												Use this API key to authenticate wapikit API
												requests.
											</CardDescription>
										</CardHeader>
										<CardContent>
											<form className="w-full max-w-sm">
												<Input
													placeholder="***********************"
													className="w-fit px-6"
													type="password"
													disabled
												/>
											</form>
										</CardContent>
									</Card>
								) : tab.slug === 'rbac' ? (
									<TeamTable />
								) : tab.slug === 'organization' ? (
									<>
										{/* organization name update button */}
										<Card>
											<CardHeader>
												<CardTitle>Organization Name</CardTitle>
											</CardHeader>
											<CardContent>
												<form>
													<Input
														placeholder={
															organizationSettings.name ||
															'Organization Name'
														}
														disabled={!isOwner}
													/>
												</form>
											</CardContent>
										</Card>

										{/* leave organization button */}

										<div className="flex flex-row gap-5">
											<Card className="flex flex-1 items-center justify-between">
												<CardHeader>
													<CardTitle>Leave Organization</CardTitle>
												</CardHeader>
												<CardContent className="flex h-fit items-center justify-center pb-0">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant={'destructive'}
																	disabled={isOwner}
																	onClick={() => {
																		leaveOrganization().catch(
																			error =>
																				console.error(error)
																		)
																	}}
																>
																	Leave
																</Button>
															</TooltipTrigger>
															<TooltipContent
																align="center"
																side="right"
																sideOffset={8}
																className={
																	!isOwner
																		? 'hidden'
																		: 'inline-block'
																}
															>
																You are the owner of this
																organization.
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</CardContent>
											</Card>

											<Card className="flex flex-1 items-center justify-between">
												<CardHeader>
													<CardTitle>Delete Organization</CardTitle>
												</CardHeader>
												<CardContent className="flex h-fit items-center justify-center pb-0">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant={'destructive'}
																	onClick={() => {
																		deleteOrganization().catch(
																			error =>
																				console.error(error)
																		)
																	}}
																>
																	Delete
																</Button>
															</TooltipTrigger>
															<TooltipContent
																align="center"
																side="right"
																sideOffset={8}
																className={
																	isOwner
																		? 'hidden'
																		: 'inline-block'
																}
															>
																You are not the owner of this
																organization.
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</CardContent>
											</Card>
										</div>

										{/* delete organization button */}
									</>
								) : null}
							</TabsContent>
						)
					})}
				</Tabs>
			</div>
		</ScrollArea>
	)
}
