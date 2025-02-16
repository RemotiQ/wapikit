'use client'

import { LinkClicks } from '~/components/analytics/link-clicks'
import { CalendarDateRangePicker } from '~/components/date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { MessageTypeBifurcation } from '~/components/analytics/message-type-distribution'
import { MessageAggregateAnalytics } from '~/components/analytics/message-aggregate-stats'
import { Toaster } from '~/components/ui/sonner'
import { useGetAggregateCampaignAnalytics, useGetConversationAnalytics } from 'root/.generated'
import { type DateRange } from 'react-day-picker'
import React, { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useAuthState } from '~/hooks/use-auth-state'
import LoadingSpinner from '~/components/loader'
import { EngagementTrends } from '~/components/analytics/engagement'
import { Icons } from '~/components/icons'

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

	const { data: aggregateCampaignAnalytics } = useGetAggregateCampaignAnalytics({
		from: date.from?.toISOString() || dayjs().subtract(20, 'day').toISOString(),
		to: date.to?.toISOString() || dayjs().toISOString()
	})

	const { data: aggregateConversationAnalytics } = useGetConversationAnalytics({
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
			<div className="flex flex-1 flex-col space-y-4 p-4 pt-6 md:p-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
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
										<Icons.infoCircle /> Select a date range to view analytics
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
										{tab === AnalyticsTabEnum.Campaigns
											? 'Campaigns'
											: 'Conversations'}
									</TabsTrigger>
								)
							}
						)}
					</TabsList>

					{[AnalyticsTabEnum.Campaigns, AnalyticsTabEnum.Conversations].map(
						(tab, index) => {
							return (
								<TabsContent key={index} value={tab} className="space-y-4">
									{tab === AnalyticsTabEnum.Campaigns ? (
										<>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
												{[
													{
														title: 'Messages Sent',
														value:
															aggregateCampaignAnalytics?.analytics
																.messagesSent || 0,
														isPercentage: false
													},
													{
														title: 'Open Rate',
														value:
															aggregateCampaignAnalytics?.analytics
																.openRate || 0,
														isPercentage: true
													},
													{
														title: 'Reply Rate',
														value:
															aggregateCampaignAnalytics?.analytics
																.responseRate || 0,
														isPercentage: true
													},
													{
														title: 'Engagement Rate',
														value:
															aggregateCampaignAnalytics?.analytics
																.engagementRate || 0,
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
																aggregateCampaignAnalytics
																	?.analytics.messageAnalytics ||
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
																aggregateCampaignAnalytics
																	?.analytics.linkClicksData || []
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
															aggregateConversationAnalytics
																?.analytics
																.avgResponseTimeInMinutes || 0,
														isPercentage: false
													},
													{
														title: 'Inbound:Outbound Ratio',
														value:
															aggregateConversationAnalytics
																?.analytics
																.inboundToOutboundRatio || 0,
														isPercentage: false
													},
													{
														title: 'Service Conversations',
														value:
															aggregateConversationAnalytics
																?.analytics.serviceConversations ||
															0,
														isPercentage: false
													},
													{
														title: 'Total Active Conversations',
														value:
															aggregateConversationAnalytics
																?.analytics.conversationsActive ||
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
																aggregateConversationAnalytics
																	?.analytics
																	.messageTypeTrafficDistributionAnalytics ||
																[]
															}
														/>
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
