'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardNav } from '~/components/dashboard-nav'
import { navItems, pathAtWhichSidebarShouldBeCollapsedByDefault } from '~/constants'
import { clsx as cn } from 'clsx'
import { useSidebar } from '~/hooks/use-sidebar'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'
import { useLayoutStore } from '~/store/layout.store'
import { Icons } from '../icons'

type SidebarProps = {
	className?: string
}

export default function Sidebar({ className }: SidebarProps) {
	const { isMinimized, toggle } = useSidebar()
	const [status, setStatus] = useState(false)
	const { writeProperty, subscriptionDetails } = useLayoutStore()

	const isNavbarCollapsedOnce = useRef(false)

	const pathname = usePathname()

	const handleToggle = useCallback(() => {
		setStatus(true)
		toggle()
		setTimeout(() => setStatus(false), 500), []
	}, [toggle])

	// ! COMMAND + B to toggle sidebar
	useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().includes('MAC')
			const isCommandOrCtrlPressed = isMac ? event.metaKey : event.ctrlKey

			if (isCommandOrCtrlPressed && event.key === 'b') {
				event.preventDefault() // Prevent default browser behavior
				handleToggle()
			}
		}

		window.addEventListener('keydown', handleKeydown)

		return () => {
			window.removeEventListener('keydown', handleKeydown)
		}
	}, [handleToggle])

	useEffect(() => {
		if (isNavbarCollapsedOnce.current) return
		const shouldBeCollapsed = pathAtWhichSidebarShouldBeCollapsedByDefault.some(path =>
			pathname.includes(path)
		)

		if (!isMinimized && shouldBeCollapsed) {
			handleToggle()
			isNavbarCollapsedOnce.current = true
		}
	}, [handleToggle, isMinimized, pathname, toggle])

	return (
		<nav
			className={cn(
				`relative hidden h-screen flex-none border-r pt-12 md:block`,
				status && 'duration-500',
				!isMinimized ? 'w-72' : 'w-[72px]',
				className
			)}
		>
			<div
				className={cn(
					'absolute -right-3 top-16 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border bg-background text-3xl text-foreground',
					isMinimized && 'rotate-180'
				)}
				onClick={handleToggle}
			>
				<Icons.chevronLeft className="size-4" />
			</div>

			<div className="h-full space-y-4 py-4">
				<div className="h-full px-3 py-2">
					<div className="mt-3 flex h-full flex-col justify-between space-y-1">
						<DashboardNav items={navItems} />
						{!subscriptionDetails && !isMinimized ? (
							<Button
								className="mt-2 flex w-full flex-row justify-evenly gap-2"
								onClick={() => {
									writeProperty({
										isPricingModalOpen: true
									})
								}}
								variant={'rainbow'}
							>
								<Icons.lightningBolt className="size-4 font-bold text-white" />
								<span className="flex-1 text-center font-bold">Upgrade to Pro</span>
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</nav>
	)
}
