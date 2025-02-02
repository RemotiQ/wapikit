'use client'

import { Command } from 'cmdk'
import { useEffect, useRef, useState } from 'react'
import { useLayoutStore } from '~/store/layout.store'
import { motion } from 'framer-motion'
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogPortal,
	DialogOverlay
} from '~/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Icons } from '../icons'
import { Badge } from '../ui/badge'
import { useRouter } from 'next/navigation'
import { CommandItemType } from '~/types'
import { clsx } from 'clsx'

export default function CommandMenuProvider() {
	const router = useRouter()

	const commandItemsAndGroups: {
		groupLabel: '' | 'Campaigns' | 'Contacts' | 'Teams'
		items: CommandItemType[]
	}[] = [
		{
			groupLabel: '',
			items: [
				{
					icon: 'sparkles',
					label: 'Ask AI',
					action: () => {
						router.push('/ai')
					},
					slug: 'ai'
				},
				{
					icon: 'settings',
					label: 'Settings',
					action: () => {
						router.push('/settings')
					},
					slug: 'settings'
				},
				{
					icon: 'page',
					label: 'Documentation',
					action: () => {
						router.push('/docs')
					},
					slug: 'docs'
				}
			]
		},
		{
			groupLabel: 'Campaigns',
			items: [
				{
					icon: 'add',
					label: 'Create Campaign',
					action: () => {
						router.push('/campaigns/new-or-edit')
					},
					slug: 'create-campaign'
				}
			]
		},
		{
			groupLabel: 'Contacts',
			items: [
				{
					icon: 'add',
					label: 'Create List',
					action: () => {
						router.push('/lists/new-or-edit')
					},
					slug: 'create-list'
				},
				{
					icon: 'download',
					label: 'Bulk Import Contacts',
					action: () => {},
					slug: 'bulk-import-contacts'
				},
				{
					icon: 'add',
					label: 'Create Contact',
					action: () => {
						router.push('/contacts/new-or-edit')
					},
					slug: 'create-contact'
				}
			]
		},
		{
			groupLabel: 'Teams',
			items: [
				{
					icon: 'user',
					label: 'Invite team member',
					action: () => {
						router.push('/team')
					},
					slug: 'invite-team-member'
				}
			]
		}
	]

	const { isCommandMenuOpen, writeProperty } = useLayoutStore()

	const scrollContainerRef = useRef<HTMLDivElement>(null)

	const [currentSelected, setCurrentSelected] = useState<string>('ai')

	function runAction(action: () => void, slug: string) {
		writeProperty({
			isCommandMenuOpen: false
		})
		setCurrentSelected(() => slug)
		action()
	}

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				writeProperty({
					isCommandMenuOpen: !isCommandMenuOpen
				})
			}

			if (e.key === 'Escape') {
				writeProperty({
					isCommandMenuOpen: false
				})
			}

			// key up and down handle
			if (e.key === 'ArrowDown') {
				setCurrentSelected((currentSlug: string) => {
					const allItems = commandItemsAndGroups
						.map(group => group.items.map(item => item.slug))
						.flat()

					const currentIndex = allItems.indexOf(currentSlug)

					if (currentIndex === -1) {
						return allItems[0]
					} else {
						if (currentIndex + 1 < allItems.length) {
							return allItems[currentIndex + 1]
						} else {
							return currentSlug
						}
					}
				})
			}

			if (e.key === 'ArrowUp') {
				setCurrentSelected(currentSlug => {
					const allItems = commandItemsAndGroups
						.map(group => group.items.map(item => item.slug))
						.flat()

					const currentIndex = allItems.indexOf(currentSlug)

					if (currentIndex === -1) {
						return allItems[0]
					} else {
						if (currentIndex - 1 >= 0) {
							return allItems[currentIndex - 1]
						} else {
							return currentSlug
						}
					}
				})
			}

			if (e.key === 'Enter') {
				const item = commandItemsAndGroups
					.map(group => group.items)
					.flat()
					.find(item => item.slug === currentSelected)

				if (item) {
					runAction(item.action, item.slug)
				}
			}
		}

		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [writeProperty, isCommandMenuOpen])

	useEffect(() => {
		const selectedItem = document.getElementById(`command-item-${currentSelected}`)
		const container = scrollContainerRef.current

		if (selectedItem && container) {
			const itemTop = selectedItem.offsetTop
			const itemHeight = selectedItem.offsetHeight
			const containerTop = container.scrollTop
			const containerHeight = container.offsetHeight

			// Calculate scroll position
			if (itemTop < containerTop) {
				// Item is above visible area
				container.scrollTo({
					top: itemTop,
					behavior: 'smooth'
				})
			} else if (itemTop + itemHeight > containerTop + containerHeight) {
				// Item is below visible area
				container.scrollTo({
					top: itemTop - containerHeight + itemHeight,
					behavior: 'smooth'
				})
			}
		}
	}, [currentSelected])

	return (
		<Dialog
			onOpenChange={isOpen => {
				writeProperty({
					isCommandMenuOpen: isOpen
				})
			}}
			open={isCommandMenuOpen}
			key={'command_menu'}
		>
			<VisuallyHidden>
				<DialogTrigger />
			</VisuallyHidden>

			<DialogPortal>
				<DialogOverlay className="opacity-5" />
				<DialogContent className="!p-0">
					<motion.div
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.2 }}
					>
						<div className="command-menu relative z-[200]">
							<Command className="flex max-h-96 flex-col gap-2" loop>
								<div className="relative h-fit">
									<Command.Input
										autoFocus
										placeholder="Search or Ask Anything..."
										className="focus:ring-accent"
									/>

									<div className="absolute right-4 top-2 flex gap-2">
										<Badge
											variant="outline"
											className="flex flex-row gap-1 px-2 py-1 text-xs"
										>
											AI
											<Icons.sparkles size={12} />
										</Badge>
										<div className="flex gap-1">
											<kbd className="px-2 py-1 text-xs">Esc</kbd>
										</div>
									</div>
								</div>

								<Command.Empty>No results found.</Command.Empty>

								<div
									className="overflow-y-auto"
									ref={scrollContainerRef}
									key={'commands_div'}
								>
									{commandItemsAndGroups.map(({ groupLabel, items }) => {
										return (
											<>
												<Command.Group
													heading={groupLabel}
													className="flex flex-col gap-2"
													key={groupLabel}
												>
													<Command.List>
														{items.map(
															({ icon, label, action, slug }) => {
																const Icon =
																	Icons[icon || 'arrowRight']

																const isSelected =
																	currentSelected === slug

																return (
																	<Command.Item
																		id={slug}
																		key={label}
																		value={slug}
																		cmdk-item=""
																		data-active={
																			isSelected
																				? 'true'
																				: 'false'
																		}
																		onSelect={value => {
																			runAction(action, value)
																		}}
																		className={clsx(
																			'hover:bg-accent',
																			currentSelected === slug
																				? 'bg-accent text-accent-foreground'
																				: ''
																		)}
																	>
																		<Icon className="size-4" />
																		{label}
																	</Command.Item>
																)
															}
														)}
													</Command.List>
												</Command.Group>
												<Command.Separator className="my-2 h-[1px] w-full bg-accent" />
											</>
										)
									})}
								</div>
							</Command>
						</div>
					</motion.div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	)
}
