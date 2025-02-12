'use client'

import { LinkClicks } from '~/components/analytics/link-clicks'
import { CalendarDateRangePicker } from '~/components/date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ConversationStatusChart } from '~/components/analytics/conversation-data'
import { MessageTypeBifurcation } from '~/components/analytics/message-type-distribution'
import { OrganizationMembers } from '~/components/analytics/org-members'
import { MessageAggregateAnalytics } from '~/components/analytics/message-aggregate-stats'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Toaster } from '~/components/ui/sonner'
import { useGetPrimaryAnalytics, useGetSecondaryAnalytics } from 'root/.generated'
import { type DateRange } from 'react-day-picker'
import React, { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useAuthState } from '~/hooks/use-auth-state'
import LoadingSpinner from '~/components/loader'
import { EngagementTrends } from '~/components/analytics/engagement'

enum AnalyticsTabEnum {
	Campaigns = 'campaigns',
	Conversations = 'conversations'
}

export default function Page() {
	const { authState } = useAuthState()

	const [date, setDate] = useState<DateRange>({
		from: dayjs().subtract(20, 'day').toDate(),
		to: dayjs().toDate()
	})

	const { data: primaryAnalyticsData } = useGetPrimaryAnalytics({
		from: date.from?.toISOString() || dayjs().subtract(20, 'day').toISOString(),
		to: date.to?.toISOString() || dayjs().toISOString()
	})

	const { data: secondaryAnalyticsData } = useGetSecondaryAnalytics({
		from: date.from?.toISOString() || dayjs().subtract(20, 'day').toISOString(),
		to: date.to?.toISOString() || dayjs().toISOString()
	})

	const datPickerSelectorRef = useRef<HTMLDivElement | null>(null)

	if (authState.isAuthenticated && !authState.data.user.organizationId) {
		return <LoadingSpinner />
	}

	return (
		<ScrollArea className="h-full">
			<Toaster />
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
					<div className="hidden flex-col items-center gap-2 space-x-2 md:flex">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<CalendarDateRangePicker
										dateRange={date}
										setDateRange={setDate}
										ref={datPickerSelectorRef}
									/>
								</TooltipTrigger>
								<TooltipContent
									align="center"
									side="right"
									sideOffset={8}
									className="inline-block"
								>
									<p>
										<InfoCircledIcon /> Select a date range to view analytics
										data
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
				<Tabs defaultValue={AnalyticsTabEnum.Campaigns} className="space-y-4">
					<TabsList>
						{[AnalyticsTabEnum.Campaigns, AnalyticsTabEnum.Conversations].map(
							(tab, index) => {
								return (
									<TabsTrigger key={index} value={tab}>
										{tab}
									</TabsTrigger>
								)
							}
						)}
					</TabsList>

					{[AnalyticsTabEnum.Campaigns, AnalyticsTabEnum.Conversations].map(
						(tab, index) => {
							return (
								<TabsContent key={index} value={tab}>
									{tab === AnalyticsTabEnum.Campaigns ? (
										<>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
												{[
													{
														title: 'Campaigns Sent',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsFinished ||
															0,
														isPercentage: false
													},
													{
														title: 'Open Rate',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
														isPercentage: true
													},
													{
														title: 'Reply Rate',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
														isPercentage: true
													},
													{
														title: 'Engagement Rate',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
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
																		{item.isPercentage
																			? '%'
																			: ''}
																	</span>
																</div>
															</CardContent>
														</Card>
													)
												})}
											</div>

											<div className="w-full">
												<Card className="col-span-2 md:col-span-4">
													<CardHeader>
														<CardTitle>Engagement Trends</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<EngagementTrends data={[]} />
													</CardContent>
												</Card>
											</div>

											<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
												<Card className="col-span-2 md:col-span-4">
													<CardHeader>
														<CardTitle>Message Analytics</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<MessageAggregateAnalytics
															data={
																primaryAnalyticsData?.messageAnalytics ||
																[]
															}
														/>
													</CardContent>
												</Card>
												<Card className="col-span-4 md:col-span-4">
													<CardHeader>
														<CardTitle>Link Clicks</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<LinkClicks
															data={
																primaryAnalyticsData?.linkClickAnalytics ||
																[]
															}
														/>
													</CardContent>
												</Card>
											</div>
										</>
									) : (
										<>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
												{[
													{
														title: 'Avg. Response Time',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsFinished ||
															0,
														isPercentage: false
													},
													{
														title: 'Inbound:Outbound Ratio',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
														isPercentage: false
													},
													{
														title: 'Service Conversations',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
														isPercentage: false
													},
													{
														title: 'Total Active Conversations',
														value:
															primaryAnalyticsData?.aggregateAnalytics
																.campaignStats.campaignsRunning ||
															0,
														isPercentage: false
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
																		{item.isPercentage
																			? '%'
																			: ''}
																	</span>
																</div>
															</CardContent>
														</Card>
													)
												})}
											</div>
											<div>
												<Card className="col-span-2 md:col-span-4">
													<CardHeader>
														<CardTitle>
															Message Type Distribution
														</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<MessageTypeBifurcation
															data={
																secondaryAnalyticsData?.messageTypeTrafficDistributionAnalytics ||
																[]
															}
														/>
													</CardContent>
												</Card>
											</div>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
												<Card className="col-span-3 md:col-span-4">
													<CardHeader>
														<CardTitle>Organization Members</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<OrganizationMembers />
													</CardContent>
												</Card>
												<Card className="col-span-3 md:col-span-4">
													<CardHeader>
														<CardTitle>Conversation Status</CardTitle>
													</CardHeader>
													<CardContent className="pl-2">
														<ConversationStatusChart />
													</CardContent>
												</Card>
											</div>
										</>
									)}
								</TabsContent>
							)
						}
					)}
				</Tabs>
			</div>
		</ScrollArea>
	)
}
