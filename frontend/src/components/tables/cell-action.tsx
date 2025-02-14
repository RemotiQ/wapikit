'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { type TableCellActionProps } from '~/types'
import { Icons } from '../icons'

export const CellAction: React.FC<{ actions: TableCellActionProps[]; data: any }> = ({
	actions,
	data
}) => {
	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Icons.dotsVertical className="h-4 w-4 cursor-pointer text-secondary-foreground" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					{actions.map((action, index) => {
						const Icon = Icons[action.icon]
						return (
							<DropdownMenuItem
								key={index}
								onClick={() => {
									// @ts-ignore
									action.onClick(data)
								}}
								className="flex flex-row items-center gap-2"
								disabled={action.disabled || false}
							>
								<Icon className="size-4" />
								{action.label}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	)
}
