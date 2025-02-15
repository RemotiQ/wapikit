'use client'

import { CampaignTableColumns } from '~/components/tables/columns'
import { TableComponent } from '~/components/tables/table'
import { Button, buttonVariants } from '~/components/ui/button'
import { Heading } from '~/components/ui/heading'
import { Separator } from '~/components/ui/separator'
import {
	CampaignStatusEnum,
	useDeleteCampaignById,
	useGetCampaignAnalyticsById,
	useGetCampaignById,
	useGetCampaigns,
	useUpdateCampaignById,
	type CampaignSchema
} from 'root/.generated'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { errorNotification, materialConfirm, successNotification } from '~/reusable-functions'
import type { TableCellActionProps } from '~/types'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import dayjs from 'dayjs'
import { Icons } from '~/components/icons'
import { LinkClicks } from '~/components/analytics/link-clicks'
import { MessageAggregateAnalytics } from '~/components/analytics/message-aggregate-stats'
import { ScrollArea } from '~/components/ui/scroll-area'

const CampaignsPage = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const deleteCampaignMutation = useDeleteCampaignById()
	const updateCampaignByIdMutation = useUpdateCampaignById()

	const page = Number(searchParams.get('page') || 1)
	const pageLimit = Number(searchParams.get('limit') || 0) || 10
	const campaignId = searchParams.get('id')

	const [order] = useState()
	const [status] = useState()
	const [isBusy, setIsBusy] = useState(false)

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const { data: campaignData, refetch: refetchCampaign } = useGetCampaignById(campaignId!, {
		query: {
			enabled: !!campaignId
		}
	})

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const { data: campaignAnalytics } = useGetCampaignAnalyticsById(campaignId!, {
		query: {
			enabled: !!campaignId,
			...(campaignData && campaignData?.campaign.status === CampaignStatusEnum.Running
				? {
						refetchInterval: 10000
					}
				: {})
		}
	})

	const {
		data: campaignResponse,
		refetch: refetchCampaigns,
		isFetching: isFetchingCampaigns
	} = useGetCampaigns(
		{
			per_page: pageLimit || 10,
			page: page || 1,
			...(order ? { order: order } : {}),
			...(status ? { status: status } : {})
		},
		{
			query: {
				enabled: !campaignId
			}
		}
	)

	const totalCampaigns = campaignResponse?.paginationMeta?.total || 0
	const pageCount = Math.ceil(totalCampaigns / pageLimit)
	const campaigns: CampaignSchema[] = campaignResponse?.campaigns || []

	async function deleteCampaign(campaignId: string) {
		try {
			if (!campaignId) return

			setIsBusy(true)

			const confirmation = await materialConfirm({
				title: 'Delete Campaign',
				description: 'Are you sure you want to delete this campaign?'
			})

			if (!confirmation) return

			const { data } = await deleteCampaignMutation.mutateAsync({
				id: campaignId
			})

			if (data) {
				// show success notification
				successNotification({
					message: 'Campaign deleted successfully'
				})

				if (campaignId) {
					await refetchCampaign()
				}
			} else {
				// show error notification
				errorNotification({
					message: 'Failed to delete campaign'
				})
			}
		} catch (error) {
			console.error('Error deleting campaign', error)
			errorNotification({
				message: 'Error deleting campaign'
			})
		} finally {
			setIsBusy(false)
			await refetchCampaigns()
		}
	}

	async function updateCampaignStatus(
		campaign: CampaignSchema,
		action: 'pause' | 'resume' | 'cancel' | 'running'
	) {
		try {
			setIsBusy(true)

			const confirmation = await materialConfirm({
				title: `${action === 'cancel' ? 'Cancel' : action === 'pause' ? 'Pause' : action === 'resume' ? 'Resume' : 'Send'} Campaign`,
				description: `Are you sure you want to ${
					action === 'running' ? 'start' : action
				} this campaign?`
			})

			if (!confirmation) return

			const response = await updateCampaignByIdMutation.mutateAsync({
				id: campaign.uniqueId,
				data: {
					...campaign,
					status:
						action === 'cancel'
							? 'Cancelled'
							: action === 'pause'
								? 'Paused'
								: 'Running',
					enableLinkTracking: campaign.isLinkTrackingEnabled,
					listIds: campaign.lists.map(list => list.uniqueId),
					tags: campaign.tags.map(tag => tag.uniqueId)
				}
			})

			if (response) {
				// show success notification
				successNotification({
					message: `Campaign ${action === 'cancel' ? 'cancelled' : action} successfully`
				})
				if (campaignId) {
					await refetchCampaign()
				}
			} else {
				// show error notification
				errorNotification({
					message: `Failed to ${action} campaign`
				})
			}
		} catch (error) {
			console.error('Error pausing/resuming campaign', error)
			errorNotification({
				message: 'Error pausing/resuming campaign'
			})
		} finally {
			setIsBusy(false)
			await refetchCampaigns()
		}
	}

	return (
		<ScrollArea className="h-full !pt-2">
			<div className="flex-1 space-y-4 p-4 pt-6 md:px-6">
				{campaignId ? (
					<>
						<div className="flex items-center justify-between">
							<Heading title={`Campaigns Details`} description="" />
							{campaignData && (
								<div className="flex w-fit flex-row items-center justify-end gap-3 p-6">
									<Button
										onClick={() => {
											console.log('clicked')
											router.push(
												`/campaigns/new-or-edit?id=${campaignData.campaign.uniqueId}`
											)
										}}
										variant={'secondary'}
										size={'medium'}
										disabled={
											isBusy ||
											campaignData.campaign.status === 'Running' ||
											campaignData.campaign.status === 'Cancelled' ||
											campaignData.campaign.status === 'Finished'
										}
										className="flex flex-row gap-2"
									>
										<Icons.edit className="size-4" />
										Edit
									</Button>
									<Button
										variant={'destructive'}
										disabled={
											isBusy || campaignData.campaign.status === 'Running'
										}
										size={'medium'}
										onClick={() => {
											deleteCampaign(campaignData.campaign.uniqueId).catch(
												console.error
											)
										}}
										className="flex flex-row gap-2"
									>
										<Icons.trash className="size-4" />
										Delete
									</Button>
									{campaignData.campaign.status === 'Running' ? (
										<>
											<Button
												size={'medium'}
												variant={'secondary'}
												onClick={() => {
													updateCampaignStatus(
														campaignData.campaign,
														'pause'
													).catch(console.error)
												}}
												className="flex flex-row gap-2"
											>
												<Icons.pause className="size-4" />
												Pause
											</Button>

											<Button
												variant={'secondary'}
												size={'medium'}
												onClick={() => {
													updateCampaignStatus(
														campaignData.campaign,
														'cancel'
													).catch(console.error)
												}}
												className="flex flex-row gap-2"
											>
												<Icons.xCircle className="size-4" />
												Cancel
											</Button>
										</>
									) : campaignData.campaign.status === 'Paused' ? (
										<>
											<Button
												onClick={() => {
													updateCampaignStatus(
														campaignData.campaign,
														'resume'
													).catch(console.error)
												}}
												size={'medium'}
												className="flex flex-row gap-2"
											>
												<Icons.play className="size-4" />
												Resume
											</Button>

											<Button
												variant={'secondary'}
												onClick={() => {
													updateCampaignStatus(
														campaignData.campaign,
														'cancel'
													).catch(console.error)
												}}
												size={'medium'}
												className="flex flex-row gap-2"
											>
												<Icons.xCircle className="size-4" />
												Cancel
											</Button>
										</>
									) : campaignData.campaign.status === 'Draft' ? (
										<>
											<Button
												onClick={() => {
													updateCampaignStatus(
														campaignData.campaign,
														'running'
													).catch(console.error)
												}}
												size={'medium'}
												className="flex flex-row gap-2"
											>
												<Icons.send className="size-4" />
												Send
											</Button>
										</>
									) : null}
								</div>
							)}
						</div>

						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
								{[
									{
										title: 'Total Recipient Sent',
										value: campaignAnalytics?.totalMessages || 0 || 0,
										isPercentage: false
									},
									{
										title: 'Open Rate',
										value: campaignAnalytics?.openRate || 0,
										isPercentage: true
									},
									{
										title: 'Reply Rate',
										value: campaignAnalytics?.responseRate || 0,
										isPercentage: true
									},
									{
										title: 'Engagement Rate',
										value: campaignAnalytics?.engagementRate || 0,
										isPercentage: true
									}
								].map((item, index) => {
									return (
										<Card key={index} className="">
											<CardHeader>
												<CardTitle className="text-sm font-normal text-muted-foreground">
													{item.title}
												</CardTitle>
											</CardHeader>
											<CardContent className="pl-5">
												<div className="flex items-center gap-1 text-3xl font-bold">
													{item.value}
													<span className="text-xl text-muted-foreground">
														{item.isPercentage ? '%' : ''}
													</span>
												</div>
											</CardContent>
										</Card>
									)
								})}
							</div>

							{campaignData ? (
								<div className="flex flex-row items-center justify-center gap-4 ">
									<Card className="flex h-full w-full items-center  gap-x-4 rounded-lg !py-4">
										<CardContent className="grid h-full w-full grid-cols-12 items-start justify-between gap-2 gap-x-8 rounded-lg">
											<div className="col-span-6">
												<div className="flex flex-row items-center justify-start gap-3">
													<Icons.announcement className="size-4 text-center" />
													<div className="font-medium text-foreground">
														Campaign Details
													</div>
												</div>
												<Separator className="my-2" />
												<div className="flex h-full w-full flex-1 flex-col items-start justify-start gap-4 py-2">
													<div className="flex w-full flex-row items-center justify-start gap-x-4">
														<p className="min-w-28 text-sm font-medium text-foreground">
															Name
														</p>
														<div className="flex flex-wrap items-center justify-center gap-4 text-sm font-normal text-muted-foreground">
															{campaignData.campaign.name}
															<Badge
																variant={
																	campaignData.campaign.status ===
																	'Draft'
																		? 'outline'
																		: campaignData.campaign
																					.status ===
																			  'Cancelled'
																			? 'destructive'
																			: 'default'
																}
																className={clsx(
																	campaignData.campaign.status ===
																		'Paused' ||
																		campaignData.campaign
																			.status === 'Scheduled'
																		? 'bg-yellow-500'
																		: campaignData.campaign
																					.status ===
																			  'Cancelled'
																			? 'bg-red-300'
																			: ''
																)}
															>
																{campaignData.campaign.status}
															</Badge>
															{campaignData.campaign.status ===
															'Running' ? (
																<div className="flex h-full w-fit items-center justify-center">
																	<div className="rotate h-4 w-4 animate-spin rounded-full border-4 border-solid  border-l-primary" />
																</div>
															) : null}
														</div>
													</div>
													<div className="flex w-full flex-row items-start justify-start gap-x-4">
														<p className="min-w-28 text-left text-sm font-medium text-foreground">
															Description
														</p>

														<div className="line-clamp-3 flex w-full flex-wrap items-center justify-start gap-4 text-balance text-sm font-normal text-muted-foreground">
															{campaignData.campaign.description}
														</div>
													</div>

													<div className="flex h-full w-full flex-col gap-4">
														{/* sent to lists */}
														<div className="flex w-full flex-row items-center justify-start gap-x-4">
															<p className="min-w-28 text-sm font-medium text-foreground">
																Sent to
															</p>

															<div className="flex flex-wrap items-center justify-center gap-0.5 truncate">
																{campaignData.campaign.lists
																	.length === 0 && (
																	<Badge variant={'outline'}>
																		None
																	</Badge>
																)}
																{campaignData.campaign.lists.map(
																	list => {
																		return (
																			<Badge
																				key={list.uniqueId}
																			>
																				{list.name}
																			</Badge>
																		)
																	}
																)}
															</div>
														</div>

														{/* tags */}
														<div className="flex w-full flex-row items-center justify-start gap-x-4 ">
															<p className="min-w-28 text-sm font-medium text-foreground">
																Tag
															</p>
															<div className="flex flex-wrap items-center justify-start gap-1 truncate">
																{campaignData.campaign.tags
																	.length === 0 && (
																	<Badge variant={'outline'}>
																		None
																	</Badge>
																)}
																{campaignData.campaign.tags.map(
																	tag => {
																		return (
																			<Badge
																				variant={'outline'}
																				key={tag.uniqueId}
																			>
																				{tag.label}
																			</Badge>
																		)
																	}
																)}
															</div>
														</div>

														{/* created on */}
														<div className="flex w-full flex-row items-center justify-start gap-x-4">
															<p className="min-w-28 text-sm font-medium text-foreground">
																Created on
															</p>
															<div className="flex flex-wrap items-center justify-center gap-0.5 truncate  text-sm font-normal text-muted-foreground">
																{dayjs(
																	campaignData.campaign.createdAt
																).format('DD MMM, YYYY')}
															</div>
														</div>
													</div>
												</div>
											</div>
											<Separator
												orientation="vertical"
												className="col-span-1 mx-auto"
											/>
											<div className="col-span-5">
												<div className="flex flex-row items-center justify-start gap-3">
													<Icons.analytics className="size-4 text-center" />
													<div className="font-medium text-foreground">
														Message Analytics
													</div>
												</div>
												<Separator className="my-2" />
												<div className="flex w-full flex-col items-start justify-start gap-4 py-2">
													{[
														{
															label: 'Sent',
															icon: 'check',
															className: '',
															count: 0
														},
														{
															label: 'Delivered',
															className: '',
															icon: 'doubleCheck',
															count: 0
														},
														{
															label: 'Read',
															icon: 'doubleCheck',
															className: 'text-green-500',
															count: 0
														},
														{
															label: 'Failed',
															className: '',
															icon: 'alertTriangle',
															count: 0
														}
													].map(item => {
														const Icon =
															Icons[item.icon as keyof typeof Icons]
														return (
															<div
																className="flex w-full max-w-[50%] flex-1 justify-between "
																key={item.label}
															>
																<div className="flex items-center justify-center gap-4 font-medium text-muted-foreground">
																	<Icon
																		className={clsx(
																			'size-5',
																			item.className
																		)}
																	/>
																	<p className="text-sm">
																		{item.label}
																	</p>
																</div>
																<div className="text-center text-foreground">
																	{item.count}
																</div>
															</div>
														)
													})}
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							) : null}

							{campaignAnalytics && (
								<div className="flex flex-row gap-4 ">
									<Card className="flex-1">
										<CardHeader>
											<CardTitle>Message Analytics</CardTitle>
										</CardHeader>
										<CardContent className="pl-2">
											<MessageAggregateAnalytics data={[]} />
										</CardContent>
									</Card>
									{campaignData?.campaign.isLinkTrackingEnabled && (
										<Card className="flex-1">
											<CardHeader>
												<CardTitle>Link Clicks</CardTitle>
											</CardHeader>
											<CardContent className="pl-2">
												<LinkClicks data={[]} />
											</CardContent>
										</Card>
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<>
						<div className="flex items-start justify-between">
							<Heading
								title={`Campaigns (${totalCampaigns})`}
								description="Manage campaigns"
							/>

							<Link
								href={'/campaigns/new-or-edit'}
								className={clsx(buttonVariants({ variant: 'default' }))}
							>
								<Icons.plus className="mr-2 h-4 w-4" /> Add New
							</Link>
						</div>
						<Separator className="" />

						<TableComponent
							searchKey="name"
							isFetching={isFetchingCampaigns}
							pageNo={page}
							columns={CampaignTableColumns}
							totalRecords={totalCampaigns}
							data={campaigns}
							pageCount={pageCount}
							actions={(campaign: CampaignSchema) => {
								const actions: TableCellActionProps[] = []

								// * 1. Edit
								actions.push({
									icon: 'edit',
									label: 'Edit',
									disabled: isBusy,
									onClick: (campaignId: string) => {
										// only allowed if the status is not Scheduled or Draft
										if (
											campaign.status !== 'Scheduled' &&
											campaign.status !== 'Draft'
										) {
											return
										}
										// redirect to the edit page with id in search param
										router.push(`/campaigns/new-or-edit?id=${campaignId}`)
									}
								})

								// * 2. Delete
								actions.push({
									icon: 'trash',
									label: 'Delete',
									disabled: isBusy,
									onClick: () => {
										deleteCampaign(campaign.uniqueId).catch(console.error)
									}
								})

								// * Pause / Resume
								if (campaign.status === 'Running') {
									actions.push({
										icon: 'pause',
										label: 'Pause',
										disabled: isBusy,
										onClick: () => {
											updateCampaignStatus(campaign, 'pause').catch(
												console.error
											)
										}
									})
									// * 3. Cancel
									actions.push({
										icon: 'xCircle',
										label: 'Cancel',
										disabled: isBusy,
										onClick: () => {
											updateCampaignStatus(campaign, 'cancel').catch(
												console.error
											)
										}
									})
								} else if (campaign.status === 'Paused') {
									actions.push({
										icon: 'play',
										label: 'Resume',
										disabled: isBusy,
										onClick: () => {
											updateCampaignStatus(campaign, 'resume').catch(
												console.error
											)
										}
									})
									// * 3. Cancel
									actions.push({
										icon: 'xCircle',
										label: 'Cancel',
										disabled: isBusy,
										onClick: () => {
											updateCampaignStatus(campaign, 'cancel').catch(
												console.error
											)
										}
									})
								} else if (campaign.status === 'Draft') {
									actions.push({
										icon: 'arrowRight',
										label: 'Send',
										disabled: isBusy,
										onClick: () => {
											updateCampaignStatus(campaign, 'running').catch(
												console.error
											)
										}
									})
								}

								return actions
							}}
						/>
					</>
				)}
			</div>
		</ScrollArea>
	)
}

export default CampaignsPage
