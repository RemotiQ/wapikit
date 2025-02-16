import { type GetCampaignsQueryResult } from 'root/.generated'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { clsx } from 'clsx'
import { Badge } from '../ui/badge'
import { format } from 'date-fns'
import { Icons } from '../icons'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import Link from 'next/link'
import dayjs from 'dayjs'

export function DashboardCampaignCard({
	campaign
}: {
	campaign: GetCampaignsQueryResult['campaigns'][0]
}) {
	const { status, createdAt, name, description, scheduledAt, sentAt, stats } = campaign

	return (
		<Card className="min-h- flex h-full max-w-md flex-1 flex-col">
			<CardHeader className="flex !flex-row !items-center justify-between p-2 !pb-2 !pt-4 ">
				<div className="flex flex-col gap-2">
					<CardTitle className="truncate text-base !font-semibold">{name}</CardTitle>
					<div className="flex flex-col items-start justify-start gap-2">
						<p className="max-w-[20rem] text-sm text-muted-foreground">{description}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col items-start justify-between gap-2 !py-2">
				<div className="mt-2 flex flex-col gap-2">
					{scheduledAt && (
						<p className="text-xs text-muted-foreground">
							Scheduled: {format(new Date(scheduledAt), 'PPpp')}
						</p>
					)}
					{sentAt && (
						<p className="text-xs text-muted-foreground">
							Sent: {format(new Date(sentAt), 'PPpp')}
						</p>
					)}

					<div className="flex flex-col gap-2">
						<div className="flex flex-row items-center gap-2">
							<span className="flex items-center gap-2 text-sm">
								<Icons.calendar className="size-4" />
								Created On:
							</span>
							<span className="text-sm font-semibold">
								{dayjs(createdAt).format('DD MMM, YYYY')}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<span className="flex items-center gap-2 text-sm">
								<Icons.contacts className="size-4" />
								Total Recipients:
							</span>
							<span>
								{stats?.totalMessages ? <>{stats.totalMessages}Messages</> : <>-</>}
							</span>

							{status === 'Running' ? (
								<div className="p.5 flex h-full w-fit items-center justify-center gap-1 rounded-md bg-accent px-1">
									<span className="text-xs ">
										<>{stats?.messagesSent || 0}</>
										<>/</>
										<> {stats?.totalMessages || 0}</>
									</span>
									<div className="rotate h-4 w-4 animate-spin rounded-full border-4 border-solid  border-l-primary" />
								</div>
							) : null}
						</div>

						<div className="flex flex-row items-center gap-2">
							<span className="flex items-center gap-2 text-sm">
								<Icons.analytics className="size-4" />
								Open Rate:
							</span>
							<span className="align-middle">
								{stats?.openRate ? <>{stats.openRate} % Open Rate</> : <>-</>}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2">
							<span className="flex items-center gap-2 text-sm">
								<Icons.pointer className="size-4" />
								Engagement Rate:
							</span>
							{stats?.engagementRate ? (
								<>{stats.engagementRate} % Engagement Rate</>
							) : (
								<>-</>
							)}
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-1">
					<Separator className="w-full opacity-65" />
					<div className="flex h-fit flex-row items-center justify-between">
						<div className="flex flex-wrap items-center justify-center gap-2 truncate">
							<Badge
								variant={
									status === 'Draft'
										? 'outline'
										: status === 'Cancelled'
											? 'destructive'
											: 'default'
								}
								className={clsx(
									status === 'Paused' || status === 'Scheduled'
										? 'bg-yellow-500'
										: status === 'Cancelled'
											? 'bg-red-300'
											: ''
								)}
							>
								{status}
							</Badge>
						</div>

						<Link href={`/campaigns?id=${campaign.uniqueId}`} className="ml-auto">
							<Button
								variant={'text'}
								className="hover:underline-none my-2 flex w-fit items-center  bg-secondary"
								size={'sm'}
							>
								<Icons.info className="size-4" />
								View Details
							</Button>
						</Link>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
