'use client'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { clsx as cn } from 'clsx'
import { format } from 'date-fns'
import * as React from 'react'
import { type DateRange } from 'react-day-picker'
import { Icons } from './icons'

export const CalendarDateRangePicker: React.FC<{
	dateRange: DateRange
	setDateRange: React.Dispatch<React.SetStateAction<DateRange>>
	ref: React.MutableRefObject<HTMLDivElement | null>
}> = ({ dateRange, setDateRange, ref }) => {
	return (
		<div className={cn('grid gap-2')} ref={ref}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={'outline'}
						className={cn(
							'w-[260px] justify-start text-left font-normal',
							!dateRange && 'bg-transparent'
						)}
					>
						<Icons.calendar className="mr-2 h-4 w-4" />
						{dateRange?.from ? (
							dateRange.to ? (
								<>
									{format(dateRange.from, 'LLL dd, y')} -{' '}
									{format(dateRange.to, 'LLL dd, y')}
								</>
							) : (
								format(dateRange.from, 'LLL dd, y')
							)
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="end">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={dateRange?.from}
						selected={dateRange}
						onSelect={selectedRange => {
							if (!selectedRange) return
							setDateRange(() => dateRange)
						}}
						numberOfMonths={2}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}
