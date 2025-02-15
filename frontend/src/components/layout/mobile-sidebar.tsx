'use client'
import { DashboardNav } from '~/components/dashboard-nav'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import { navItems } from '~/constants'
import { useState } from 'react'
import { Icons } from '../icons'

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function MobileSidebar(props: SidebarProps) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Sheet open={open} onOpenChange={setOpen} {...props}>
				<SheetTrigger asChild>
					<Icons.menu />
				</SheetTrigger>
				<SheetContent side="left" className="!px-0">
					<div className="space-y-4 py-4">
						<div className="px-3 py-2">
							<h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
								Overview
							</h2>
							<div className="space-y-1">
								<DashboardNav
									items={navItems}
									isMobileNav={true}
									setOpen={setOpen}
								/>
							</div>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</>
	)
}
