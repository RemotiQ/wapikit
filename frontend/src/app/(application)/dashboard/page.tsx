'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { ChatBubbleIcon, RocketIcon } from '@radix-ui/react-icons'
import { Phone } from 'lucide-react'
import { Divider } from '@tremor/react'
import { Toaster } from '~/components/ui/sonner'
import { useGetCampaigns, useGetPrimaryAnalytics } from 'root/.generated'
import React from 'react'
import dayjs from 'dayjs'
import { useAuthState } from '~/hooks/use-auth-state'
import LoadingSpinner from '~/components/loader'
import { TipCard } from '~/components/dashboard/tip-card'
import { type TipCardPropType } from '~/types'
import { useLayoutStore } from '~/store/layout.store'
import { DashboardCampaignCard } from '~/components/dashboard/campaign-card'

export default function Page() {
	const { currentOrganization } = useLayoutStore()

	const { authState } = useAuthState()

	const { data: primaryAnalyticsData } = useGetPrimaryAnalytics({
		from: dayjs().subtract(7, 'day').startOf('day').toISOString(),
		to: dayjs().endOf('day').toISOString()
	})

	const { data: campaigns } = useGetCampaigns({
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
						icon: 'rocket'
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
						icon: 'download'
					}
				] as TipCardPropType[])
			: []),
		// ! show when user has no team members
		{
			title: 'Invite Team Member',
			description: 'Invite your team members to collaborate on your organization.',
			href: '/team',
			icon: 'user'
		},

		// ! TODO: not all members has permission to update the organization description
		...(currentOrganization?.description && currentOrganization.description.length < 50
			? ([
					{
						title: 'Update Your Organization Description',
						description:
							'The AI Automation would perform at its best if you provide a detailed description of your organization. This would help the AI to understand your organization better and what you do.',
						href: '/settings?tab=organization-settings',
						icon: 'user'
					}
				] as TipCardPropType[])
			: []),
		{
			title: 'Ask AI',
			description:
				'Ask anything to AI, whether about where to start or how to use the platform.',
			href: '/ai',
			icon: 'sparkles'
		},
		{
			title: 'API Access',
			description:
				'Integrate your application using our API. Get started with our API documentation.',
			href: '/settings?tab=api-access',
			icon: 'code'
		},
		{
			title: 'Check documentation',
			description:
				'Get started with our documentation to understand how to use the platform.',
			href: '/docs',
			icon: 'page'
		}
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
									<RocketIcon className={`mx-auto size-6`} />
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
									<ChatBubbleIcon className={`mx-auto size-6`} />
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
									<ChatBubbleIcon className={`mx-auto size-6`} />
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
									<Phone className={`mx-auto size-6`} />
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
					<div className="flex h-full w-full flex-1 gap-4 overflow-x-scroll">
						{campaigns?.campaigns.map((campaign, index) => {
							return <DashboardCampaignCard campaign={campaign} key={index} />
						})}
					</div>
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
