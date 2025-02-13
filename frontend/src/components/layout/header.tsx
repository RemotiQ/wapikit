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

export default function Header() {
	const { resolvedTheme } = useTheme()
	const { subscriptionDetails } = useLayoutStore()
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

				<div className="flex items-center gap-1">
					<Notifications />
					<UserNav />
					{/* <ThemeToggle /> */}
				</div>
			</nav>
		</div>
	)
}
