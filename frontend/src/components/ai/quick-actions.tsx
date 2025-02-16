import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Icons } from '../icons'

interface QuickActionsProps {
	onActionSelect: (action: string) => void
}

export function QuickActions({ onActionSelect }: QuickActionsProps) {
	return (
		<Card className="p-4">
			<h3 className="mb-3 font-medium">Quick Actions</h3>
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant="outline"
					className="flex flex-col items-center justify-center gap-2 p-4"
					onClick={() => onActionSelect('campaign')}
				>
					<Icons.announcement className="h-5 w-5" />
					<span className="text-sm">New Campaign</span>
				</Button>
				<Button
					variant="outline"
					className="flex flex-col items-center justify-center gap-2 p-4"
					onClick={() => onActionSelect('segment')}
				>
					<Icons.filterLines className="h-5 w-5" />
					<span className="text-sm">Segment Users</span>
				</Button>
				<Button
					variant="outline"
					className="flex flex-col items-center justify-center gap-2 p-4"
					onClick={() => onActionSelect('contacts')}
				>
					<Icons.inviteTeamMember className="h-5 w-5" />
					<span className="text-sm">Add Contacts</span>
				</Button>
				<Button
					variant="outline"
					className="flex flex-col items-center justify-center gap-2 p-4"
					onClick={() => onActionSelect('analytics')}
				>
					<Icons.barChart className="h-5 w-5" />
					<span className="text-sm">View Reports</span>
				</Button>
			</div>
		</Card>
	)
}
