'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Divider } from '@tremor/react'
import { Toaster } from '~/components/ui/sonner'
import { useGetCampaigns, useGetPrimaryAnalytics } from 'root/.generated'
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

export default function Page() {
	const { authState } = useAuthState()

	const { data: primaryAnalyticsData } = useGetPrimaryAnalytics({
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
		...(primaryAnalyticsData?.aggregateAnalytics &&
		primaryAnalyticsData.aggregateAnalytics.campaignStats.totalCampaigns === 0
			? ([
					{
						title: 'Send your First Campaign',
						description: 'Create and send your first campaign to your contacts.',
						href: '/campaigns/new-or-edit',
						icon: 'announcement'
					}
				] as TipCardPropType[])
			: []),

		...(primaryAnalyticsData?.aggregateAnalytics &&
		primaryAnalyticsData.aggregateAnalytics.contactStats.totalContacts === 0
			? ([
					{
						title: 'Bulk Import Contact',
						description: 'Import your contacts in bulk using a CSV file.',
						href: '/contacts/bulk-import',
						icon: 'contactImport'
					}
				] as TipCardPropType[])
			: []),
		// ! show when user has no team members
		{
			title: 'Invite Team Member',
			description: 'Invite your team members to collaborate on your organization.',
			href: '/team',
			icon: 'inviteTeamMember'
		},
		{
			title: 'Ask AI',
			description:
				'Ask anything to AI, whether about where to start or how to use the platform.',
			href: '/ai',
			icon: 'aiStar'
		},
		{
			title: 'API Access',
			description:
				'Integrate your application using our API. Get started with our API documentation.',
			href: '/settings?tab=api-access',
			icon: 'terminalSquare'
		},
		...(primaryAnalyticsData?.aggregateAnalytics &&
		primaryAnalyticsData.aggregateAnalytics.contactStats.totalContacts > 0
			? ([
					{
						title: 'Check documentation',
						description:
							'Get started with our documentation to understand how to use the platform.',
						href: '/docs',
						icon: 'page'
					}
				] as TipCardPropType[])
			: [])
	]

	return (
		<ScrollArea className="h-full">
			<Toaster />
			<div className="h-[94%] flex-1 space-y-4 p-4 pb-10 pt-6 md:p-4">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="ml-2 text-3xl font-bold tracking-tight">Dashboard</h2>
				</div>
				<div className="flex h-full flex-1 flex-col gap-6 rounded-lg bg-accent/60 p-4">
					<div className="grid gap-4 rounded-lg md:grid-cols-2 lg:grid-cols-4">
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
											{primaryAnalyticsData?.aggregateAnalytics?.campaignStats
												?.totalCampaigns || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Running</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.campaignStats
												.campaignsRunning || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Draft</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.campaignStats
												.campaignsDraft || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Scheduled</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.campaignStats
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
											{primaryAnalyticsData?.aggregateAnalytics
												?.conversationStats.totalConversations || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Active</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics
												?.conversationStats.conversationsActive || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Resolved</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics
												?.conversationStats.conversationsClosed || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Awaiting Reply</b>:{' '}
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics
												?.conversationStats.conversationsPending || 0}
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
											{primaryAnalyticsData?.aggregateAnalytics?.messageStats
												.totalMessages || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Sent</b>:
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.messageStats
												.messagesSent || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Read</b>:
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.messageStats
												.messagesRead || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Undelivered</b>:
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.messageStats
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
											{primaryAnalyticsData?.aggregateAnalytics?.contactStats
												.totalContacts || 0}
										</span>
									</p>
									<p className="text-sm font-light text-muted-foreground">
										<b>Active</b>:
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.contactStats
												.contactsActive || 0}
										</span>
									</p>
								</div>
								<div className="flex h-full flex-col gap-2 pt-2">
									<p className="text-sm font-light text-muted-foreground">
										<b>Blocked</b>:
										<span className="font-extrabold">
											{primaryAnalyticsData?.aggregateAnalytics?.contactStats
												.contactsBlocked || 0}
										</span>
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{isFetchingCampaigns ? (
						<div className="grid h-full w-full flex-1 animate-pulse grid-cols-2 gap-4 lg:grid-cols-3">
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
						<div className="min-w-lg grid h-full min-h-72 w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2">
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
						<div className="grid h-full w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{campaigns?.campaigns.map((campaign, index) => {
								return <DashboardCampaignCard campaign={campaign} key={index} />
							})}

							{campaigns?.campaigns.length && campaigns?.campaigns.length < 3 ? (
								<Card
									key={'send_more_cta'}
									className="min-w-md flex w-full max-w-lg flex-col items-center justify-center gap-6 p-4"
								>
									<p className="max-w-xs text-center text-lg text-muted-foreground">
										Send more campaigns to your contacts to keep them engaged.
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
							) : null}
						</div>
					)}

					<div className="grid gap-4 rounded-lg md:grid-cols-2 lg:grid-cols-4">
						{tips.map((tip, index) => {
							return <TipCard key={index} tip={tip} />
						})}
					</div>
				</div>
			</div>
		</ScrollArea>
	)
}
