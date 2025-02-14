'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from './ui/command'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { Icons } from './icons'

const multiSelectVariants = cva(
	'm-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300',
	{
		variants: {
			variant: {
				default: 'border-foreground/10 text-gray-500 bg-card',
				secondary:
					'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
				destructive:
					'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
				inverted: 'inverted'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
)

interface MultiSelectProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof multiSelectVariants> {
	options: {
		value: string
		label?: string
	}[]
	filter?: boolean
	onValueChange: (value: string[]) => void
	defaultValue: string[]
	placeholder?: string
	maxCount?: number
	modalPopover?: boolean
	showCloseButton?: boolean
	// asChild?: boolean
	className?: string
	actionButtonConfig?: {
		label: JSX.Element
		onClick: () => void
	}
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
	(
		{
			filter = false,
			options,
			onValueChange,
			variant,
			defaultValue = [],
			placeholder = 'Select options',
			maxCount = 3,
			modalPopover = false,
			showCloseButton = true,
			actionButtonConfig,
			// asChild = false,
			className,
			...props
		},
		ref
	) => {
		const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue)
		const [isPopoverOpen, setIsPopoverOpen] = useState(false)

		const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'Enter') {
				setIsPopoverOpen(true)
			} else if (event.key === 'Backspace' && !event.currentTarget.value) {
				const newSelectedValues = [...selectedValues]
				newSelectedValues.pop()
				setSelectedValues(newSelectedValues)
				onValueChange(newSelectedValues)
			}
		}

		const toggleOption = (value: string) => {
			const newSelectedValues = selectedValues.includes(value)
				? selectedValues.filter(v => v !== value)
				: [...selectedValues, value]
			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)
		}

		const handleClear = () => {
			setSelectedValues([])
			onValueChange([])
		}

		const handleTogglePopover = () => {
			setIsPopoverOpen(prev => !prev)
		}

		const clearExtraOptions = () => {
			const newSelectedValues = selectedValues.slice(0, maxCount)
			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)
		}

		const toggleAll = () => {
			if (selectedValues.length === options.length) {
				handleClear()
			} else {
				const allValues = options.map(option => option.value)
				setSelectedValues(allValues)
				onValueChange(allValues)
			}
		}

		React.useEffect(() => {
			if (defaultValue.length > 0 && selectedValues.length === 0) {
				setSelectedValues(defaultValue)
			}
		}, [selectedValues.length, defaultValue])

		return (
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
				<PopoverTrigger>
					<div
						ref={ref as any}
						{...props}
						onClick={handleTogglePopover}
						className={clsx(
							'flex w-full cursor-pointer items-center justify-between rounded-md border border-input bg-inherit px-3 py-2 text-sm font-medium shadow-sm',
							className
						)}
					>
						{!filter ? (
							<>
								{selectedValues.length > 0 ? (
									<div className="flex w-full items-center justify-between">
										<div className="flex flex-wrap items-center">
											{selectedValues.slice(0, maxCount).map(value => {
												const option = options.find(o => o.value === value)
												return (
													<Badge
														key={value}
														className={clsx(
															' py-0.5',
															multiSelectVariants({ variant })
														)}
														variant={'outline'}
													>
														{option?.label || option?.value}
														<Icons.crossCircle
															className="ml-2 h-3 w-3 cursor-pointer"
															onClick={event => {
																event.stopPropagation()
																toggleOption(value)
															}}
														/>
													</Badge>
												)
											})}
											{selectedValues.length > maxCount && (
												<Badge
													className={clsx(
														'',
														multiSelectVariants({ variant })
													)}
													variant={'outline'}
												>
													{`+ ${selectedValues.length - maxCount} more`}
													<Icons.crossCircle
														className="ml-2 h-3 w-3 cursor-pointer"
														onClick={event => {
															event.stopPropagation()
															clearExtraOptions()
														}}
													/>
												</Badge>
											)}
										</div>
										<div className="flex items-center justify-between">
											<Icons.cross
												className="mx-2 h-4 w-4 cursor-pointer opacity-50"
												onClick={event => {
													event.stopPropagation()
													handleClear()
												}}
											/>
											<Separator
												orientation="vertical"
												className="mr-2 flex h-full min-h-6"
											/>
											<CaretSortIcon className="h-4 w-4 opacity-50" />
										</div>
									</div>
								) : (
									<div className="mx-auto flex w-full items-center justify-between">
										<span className="mx-2 text-sm text-muted-foreground">
											{placeholder}
										</span>
										<CaretSortIcon className="h-4 w-4 opacity-50" />
									</div>
								)}
							</>
						) : (
							<div className="mx-auto flex w-full items-center justify-between">
								<span className="mx-2 text-sm text-gray-300">{placeholder}</span>
								<CaretSortIcon className="h-4 w-4 opacity-50" />
							</div>
						)}
					</div>
				</PopoverTrigger>
				<PopoverContent
					className="popover-width w-auto p-0"
					align="start"
					onEscapeKeyDown={() => setIsPopoverOpen(false)}
				>
					<Command className="min-w-44">
						{options.length > 0 ? (
							<CommandInput
								placeholder="Search..."
								onKeyDown={handleInputKeyDown}
								className="my-2 rounded-md !p-1 !pl-2 focus:border-gray-200"
							/>
						) : (
							<CommandItem>No options to select</CommandItem>
						)}
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								{options.length > 0 && (
									<CommandItem
										key="all"
										onSelect={toggleAll}
										className="cursor-pointer"
									>
										<div
											className={clsx(
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ',
												selectedValues.length === options.length
													? 'border-primary bg-primary text-primary'
													: ' border-muted-foreground opacity-50 [&_svg]:invisible'
											)}
										>
											<Icons.check className="text-white" />
										</div>
										<span>(Select All)</span>
									</CommandItem>
								)}
								{options.map(option => {
									const isSelected = selectedValues.includes(option.value)
									return (
										<CommandItem
											key={option.value}
											onSelect={() => toggleOption(option.value)}
											className="cursor-pointer"
										>
											<div
												className={clsx(
													'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ',
													isSelected
														? 'border-primary bg-primary text-primary'
														: 'border-muted-foreground opacity-50 [&_svg]:invisible'
												)}
											>
												<Icons.check className="text-white" />
											</div>
											<span>{option?.label || option.value}</span>
										</CommandItem>
									)
								})}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<div className="flex flex-col items-center justify-between">
									{actionButtonConfig ? (
										<CommandItem
											onSelect={() => {
												actionButtonConfig.onClick()
												setIsPopoverOpen(false)
											}}
											className="cursor-pointe w-full max-w-full flex-1 justify-center"
										>
											{actionButtonConfig.label}
										</CommandItem>
									) : null}

									{selectedValues.length > 0 && (
										<>
											<Separator
												orientation="horizontal"
												className="flex w-full"
											/>
											<CommandItem
												onSelect={handleClear}
												className="w-full flex-1 cursor-pointer justify-center"
											>
												Clear
											</CommandItem>
										</>
									)}

									{showCloseButton ? (
										<CommandItem
											onSelect={() => setIsPopoverOpen(false)}
											className="max-w-full flex-1 cursor-pointer justify-center"
										>
											Close
										</CommandItem>
									) : null}
								</div>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		)
	}
)

MultiSelect.displayName = 'MultiSelect'
