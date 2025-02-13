'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useAuthState } from '~/hooks/use-auth-state'
import { Icons } from '../icons'

export function UserNav() {
	const router = useRouter()
	const { authState } = useAuthState()
	if (authState.isAuthenticated) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size={'icon'} className="relative">
						<Avatar className="h-7 w-7">
							<AvatarImage
								src={'/assets/empty-pfp.png'}
								alt={authState.data.user.name}
							/>
							<AvatarFallback>{authState.data.user.name}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">
								{authState.data.user.name}
							</p>
							<p className="text-xs leading-none text-muted-foreground">
								{authState.data.user.email}
							</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem
							onClick={() => {
								router.push('/settings')
							}}
							className="flex items-center gap-2"
						>
							<Icons.settings className="size-4" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								router.push('/settings?tab=api-key')
							}}
							className="flex items-center gap-2"
						>
							<Icons.terminalSquare className="size-4" />
							API Access
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								window.open('https://docs.wapikit.com', '_blank')
							}}
							className="flex items-center gap-2"
						>
							<Icons.documentation className="size-4" />
							Documentation
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => {
							router.push('/logout')
						}}
						className="flex items-center justify-between"
					>
						Log out
						<Icons.logout className="size-4" />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		)
	} else {
		return null
	}
}
