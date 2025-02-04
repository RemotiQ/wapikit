import { GetCampaignsQueryResult } from 'root/.generated'
import Progress from '../progress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import clsx from 'clsx'
import { Badge } from '../ui/badge'
import { format } from 'date-fns'

export function DashboardCampaignCard({
	campaign
}: {
	campaign: GetCampaignsQueryResult['campaigns'][0]
}) {
	const {
		status,
		createdAt,
		isLinkTrackingEnabled,
		lists,
		name,
		tags,
		uniqueId,
		description,
		scheduledAt,
		sentAt
	} = campaign

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'Draft':
				return 'outline'
			case 'Cancelled':
				return 'destructive'
			default:
				return 'default'
		}
	}

	const getStatusClass = (status: string) => {
		return clsx(
			status === 'Paused' || status === 'Scheduled' ? 'bg-yellow-500' : '',
			status === 'Cancelled' ? 'bg-red-300' : ''
		)
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="truncate text-sm font-medium">{name}</CardTitle>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={getStatusVariant(status)} className={getStatusClass(status)}>
						{status}
					</Badge>
					{status === 'Running' && (
						<div className="h-4 w-4 animate-spin rounded-full border-4 border-solid border-l-primary" />
					)}
				</div>
			</CardHeader>
			<CardContent>
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
					{/* <div className="flex items-center space-x-2">
						<Progress value={campaign.progress || 0} />
						<span className="text-sm font-medium">{campaign.progress || 0}%</span>
					</div> */}
				</div>
			</CardContent>
		</Card>
	)
}
