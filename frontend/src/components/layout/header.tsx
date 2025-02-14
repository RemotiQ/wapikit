'use client'

import { clsx as cn } from 'clsx'
import { MobileSidebar } from './mobile-sidebar'
import { UserNav } from './user-nav'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Notifications } from './notification-dropdown'
import { useLayoutStore } from '~/store/layout.store'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Icons } from '../icons'

export default function Header() {
	const { resolvedTheme } = useTheme()
	const { subscriptionDetails, writeProperty } = useLayoutStore()
	return (
		<div className="supports-backdrop-blur:bg-background/60 fixed left-0 right-0 top-0 z-20 border-b bg-background/95 backdrop-blur">
			<nav className="flex h-14 items-center justify-between px-4">
				<div className="hidden flex-row gap-3 lg:flex">
					<Link href={'/'}>
						<Image
							src={resolvedTheme === 'dark' ? '/logo/dark.svg' : '/logo/light.svg'}
							height={40}
							width={100}
							alt="logo"
						/>
					</Link>

					{subscriptionDetails ? (
						<Badge variant={'highlighted'}>
							<span className="h-fit w-fit">Premium</span>
						</Badge>
					) : null}
				</div>
				<div className={cn('block lg:!hidden')}>
					<MobileSidebar />
				</div>

				<div className="flex items-center gap-2">
					<Badge
						variant={'default'}
						onClick={() => {
							writeProperty({
								isCommandMenuOpen: true
							})
						}}
						className="cursor-pointer  "
					>
						<Icons.macoscommand className="size-3" /> K
					</Badge>
					{/* <div className="flex flex-row items-center gap-1 rounded-md px-1">
							<Icons.macoscommand className="size-3" /> K
						</div> */}
					<div className="flex items-center gap-1">
						<Notifications />
						<UserNav />
					</div>
					{/* <ThemeToggle /> */}
				</div>
			</nav>
		</div>
	)
}
