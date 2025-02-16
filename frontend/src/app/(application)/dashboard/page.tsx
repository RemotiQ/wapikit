'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Divider } from '@tremor/react'
import { Toaster } from '~/components/ui/sonner'
import { CampaignStatusEnum, useGetAggregateCounts, useGetCampaigns } from 'root/.generated'
import React from 'react'
import dayjs from 'dayjs'
import { useAuthState } from '~/hooks/use-auth-state'
import LoadingSpinner from '~/components/loader'
import { TipCard } from '~/components/dashboard/tip-card'
import { type TipCardPropType } from '~/types'
import { DashboardCampaignCard } from '~/components/dashboard/campaign-card'
import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import Link from 'next/link'
import { Separator } from '~/components/ui/separator'
import { Callout } from '~/components/ui/callout'
import { createHref } from '~/reusable-functions'
import { OFFICIAL_DOCUMENTATION_URL } from '~/constants'
import Image from 'next/image'

export default function Page() {
	const { authState } = useAuthState()

	const { data: aggregateCount } = useGetAggregateCounts({
		from: dayjs().subtract(7, 'day').startOf('day').toISOString(),
		to: dayjs().endOf('day').toISOString()
	})

	const { data: campaigns, isFetching: isFetchingCampaigns } = useGetCampaigns({
		page: 1,
		per_page: 4
	})

	if (authState.isAuthenticated && !authState.data.user.organizationId) {
		return <LoadingSpinner />
	}

	const tips: TipCardPropType[] = [
		// ! TODO: show when the user has no contacts
		...(aggregateCount?.aggregateAnalytics &&
		aggregateCount.aggregateAnalytics.campaignStats.totalCampaigns === 0
			? ([
					{
						title: 'Send your First Campaign',
						description: 'Create and send your first campaign to your contacts.',
						href: '/campaigns/new-or-edit',
						icon: 'announcement',
						ctaText: 'Send Campaign'
					}
				] as TipCardPropType[])
			: []),

		...(aggregateCount?.aggregateAnalytics &&
		aggregateCount.aggregateAnalytics.contactStats.totalContacts === 0
			? ([
					{
						title: 'Bulk Import Contact',
						description: 'Import your contacts in bulk using a CSV file.',
						href: '/contacts/bulk-import',
						icon: 'contactImport',
						ctaText: 'Import Contacts'
					}
				] as TipCardPropType[])
			: []),
		// ! show when user has no team members
		{
			title: 'Invite Team Member',
			description: 'Invite your team members to collaborate on your organization.',
			href: '/team',
			icon: 'inviteTeamMember',
			ctaText: 'Invite Team'
		},
		{
			title: 'Ask AI',
			description:
				'Ask anything to AI, whether about where to start or how to use the platform.',
			href: '/ai',
			icon: 'aiStar',
			ctaText: 'Ask AI'
		},
		{
			title: 'API Access',
			description:
				'Integrate your application using our API. Get started with our API documentation.',
			href: '/settings?tab=api-access',
			icon: 'terminalSquare',
			ctaText: 'Read Documentation'
		},
		...(aggregateCount?.aggregateAnalytics &&
		aggregateCount.aggregateAnalytics.contactStats.totalContacts > 0
			? ([
					{
						title: 'Check documentation',
						description:
							'Get started with our documentation to understand how to use the platform.',
						href: '/docs',
						icon: 'documentation',
						ctaText: 'Read Documentation'
					}
				] as TipCardPropType[])
			: [])
	]

	return (
		<ScrollArea className="h-full">
			<Toaster />
			<div className="h-[94%] flex-1 space-y-4 p-4 pb-10 pt-6 md:p-4">
				<div className="ml-2 flex flex-col items-start justify-start gap-1 py-4">
					<h2 className="text-3xl font-bold tracking-tight text-primaryShades-800">
						Welcome to Wapikit 👋
					</h2>
					<p className="text-base font-medium text-muted-foreground">
						You can now start sending campaigns, managing contacts, and much more.
					</p>
				</div>

				<div className="flex h-full flex-1 flex-col gap-2 rounded-lg">
					<Callout variant="success" title="Important" icon={Icons.infoCircle}>
						<div className="flex max-w-6xl flex-col gap-2 rounded-lg">
							<p className="font-medium">
								Enable incoming message notifications to receive messages from your
								contacts in real-time here in the dashboard by Use WapiKit as your
								primary WhatsApp Business Provider, you can received and send
								messages to and from your contacts in real-time from this dashboard.
							</p>
							<p className="text-base font-bold">
								Configuring your webhook URL in the settings.{' '}
								<Link
									href={createHref({
										href: '/guide/configure-webhook',
										domain: OFFICIAL_DOCUMENTATION_URL,
										utmParams: {
											utm_content: 'configure-webhook',
											utm_medium: 'dashboard',
											utm_source: 'application'
										}
									})}
									className="underline"
								>
									Read more here.
								</Link>
							</p>
						</div>
					</Callout>
				</div>

				<div className="flex h-full flex-1 flex-col gap-6 rounded-lg bg-accent/60 p-4">
					<div className="grid gap-3 rounded-lg md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2">
								<CardTitle className="mx-auto flex w-full flex-row items-center gap-1 text-center text-sm font-medium">
									<Icons.announcement className={`mx-auto size-6`} />
								</CardTitle>
								<Divider className="upper text-sm font-bold">Campaigns</Divider>
							</CardHeader>
							<CardContent className="flex flex-row items-center justify-between gap-1">
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Total</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.campaignStats
												?.totalCampaigns || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Running</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.campaignStats
												.campaignsRunning || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Draft</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.campaignStats
												.campaignsDraft || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Scheduled</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.campaignStats
												.campaignsScheduled || 0}
										</span>
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2">
								<CardTitle className="mx-auto flex w-full flex-row items-center gap-1 text-center text-sm font-medium">
									<Icons.messageChatSquare className={`mx-auto size-6`} />
								</CardTitle>
								<Divider className="upper text-sm font-bold">Conversations</Divider>
							</CardHeader>
							<CardContent className="flex flex-row items-center justify-between gap-1">
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Total</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.conversationStats
												.totalConversations || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Active</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.conversationStats
												.conversationsActive || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Resolved</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.conversationStats
												.conversationsClosed || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Awaiting Reply</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.conversationStats
												.conversationsPending || 0}
										</span>
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2">
								<CardTitle className="mx-auto flex w-full flex-row items-center gap-1 text-center text-sm font-medium">
									<Icons.messageTextSquare className={`mx-auto size-6`} />
								</CardTitle>
								<Divider className="upper text-sm font-bold">Messages</Divider>
							</CardHeader>
							<CardContent className="flex flex-row items-center justify-between gap-1">
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Total</b>:{' '}
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.messageStats
												.totalMessages || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Sent</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.messageStats
												.messagesSent || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Read</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.messageStats
												.messagesRead || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Undelivered</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.messageStats
												.messagesUndelivered || 0}
										</span>
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2">
								<CardTitle className="mx-auto flex w-full flex-row items-center gap-1 text-center text-sm font-medium">
									<Icons.contacts className={`mx-auto size-6`} />
								</CardTitle>
								<Divider className="upper text-sm font-bold">Contacts</Divider>
							</CardHeader>
							<CardContent className="flex flex-row items-center justify-between gap-1">
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Total</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.contactStats
												.totalContacts || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Active</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.contactStats
												.contactsActive || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Blocked</b>:
										<span className="font-extrabold">
											{aggregateCount?.aggregateAnalytics?.contactStats
												.contactsBlocked || 0}
										</span>
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{isFetchingCampaigns ? (
						<div className="grid h-full w-full flex-1 animate-pulse grid-cols-2 gap-3 lg:grid-cols-3">
							{Array.from({ length: 3 }).map((_, index) => {
								return (
									<div
										key={index}
										className="h-72 w-full flex-1 rounded-lg bg-gray-200 "
									/>
								)
							})}
						</div>
					) : null}

					{!isFetchingCampaigns && campaigns?.campaigns.length === 0 ? (
						<div className="min-w-lg grid h-full min-h-72 w-full flex-1 grid-cols-1 gap-3 md:grid-cols-2">
							<Card
								key={'send_more_cta'}
								className="min-w-md flex w-full max-w-lg flex-col items-center justify-center gap-6 p-4"
							>
								<p className="max-w-xs text-center text-lg text-muted-foreground">
									Send your first campaign to your contacts.
								</p>
								<Link href={'/campaigns/new-or-edit'}>
									<Button
										variant={'secondary'}
										className="flex items-center gap-2"
									>
										<Icons.announcement className="size-4" />
										Send Campaign
									</Button>
								</Link>
							</Card>
						</div>
					) : (
						<div className="flex w-full flex-col gap-3 pl-2">
							<Separator />
							<div className="flex flex-row items-center gap-1">
								<Icons.announcement className="size-5" />
								<h3 className="pl-2 text-lg font-semibold text-foreground">
									Recent Campaigns
								</h3>
							</div>

							<div className="grid h-full w-full flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{campaigns?.campaigns
									.sort((a, b) => {
										const statusOrder = {
											[CampaignStatusEnum.Running]: 2,
											[CampaignStatusEnum.Scheduled]: 1,
											[CampaignStatusEnum.Draft]: 0,
											[CampaignStatusEnum.Paused]: -1,
											[CampaignStatusEnum.Finished]: -2,
											[CampaignStatusEnum.Cancelled]: -3
										}

										return statusOrder[b.status] - statusOrder[a.status]
									})
									.map((campaign, index) => {
										return (
											<DashboardCampaignCard
												campaign={campaign}
												key={index}
											/>
										)
									})}

								{campaigns?.campaigns.length && campaigns?.campaigns.length < 3 ? (
									<Card
										key={'send_more_cta'}
										className="min-w-md flex w-full max-w-md flex-col items-center justify-center gap-3 p-3"
									>
										<div className="flex flex-1 flex-col gap-2">
											<div className="flex flex-row gap-2">
												<div
													className={`flex h-fit rounded-lg bg-accent p-3`}
												>
													<Icons.announcement className="size-6" />
												</div>
												<div className="gap-.5 flex flex-col">
													<h3 className="font-semibold">
														Send More Campaigns
													</h3>
													<p className="max-w-xs text-left text-sm text-muted-foreground">
														Send more campaigns to your contacts to keep
														them engaged.
													</p>
												</div>
											</div>

											<div className="object-fit h-full w-full flex items-center justify-center rounded-lg bg-accent">
												<Image
													src={'/assets/dashboard/campaign.svg'}
													height={200}
													width={250}
													alt="campaigns"
													className='opacity-75'
												/>
											</div>
										</div>
										<div className='flex flex-col w-full'>
											<Separator orientation="horizontal" className="" />
											<Link
												key={'send_more_cta'}
												href={'/campaigns/new-or-edit'}
												className="pl-3 hover:cursor-pointer mt-2"
											>
												<Button
													variant={'link'}
													className="!p-0 hover:underline"
												>
													<Icons.arrowCircleRight className="size-4" />
													<span className="text-sm">
														Create a new Campaign
													</span>
												</Button>
											</Link>
										</div>
									</Card>
								) : null}
							</div>
						</div>
					)}

					<div className="flex w-full flex-col gap-3">
						<Separator />
						<div className="flex flex-row items-center gap-1">
							<Icons.intersectSquare className="size-5" />
							<h3 className="pl-2 text-lg font-semibold text-foreground">
								Quick Start
							</h3>
						</div>
						<div className="grid gap-3 rounded-lg md:grid-cols-2 lg:grid-cols-3">
							{tips.map((tip, index) => {
								return <TipCard key={index} tip={tip} />
							})}
						</div>
					</div>
				</div>
			</div>
		</ScrollArea>
	)
}
