'use client'

import { useEffect, useState } from 'react'
import { add, format } from 'date-fns'
import { TimePicker } from './time-picker'
import { Icons } from '~/components/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Button } from '../button'
import { clsx } from 'clsx'
import { Calendar } from '../calendar'
import dayjs from 'dayjs'

type Props = {
	onChange: (date: Date) => void
	defaultDate?: Date
}

export function DateTimePicker(props: Props) {
	const { onChange, defaultDate } = props
	const [date, setDate] = useState<Date>(defaultDate || dayjs().add(1, 'day').toDate())

	useEffect(() => {
		if (!date) return
		onChange(date)
	}, [date, onChange])

	/**
	 * carry over the current time when a user clicks a new day
	 * instead of resetting to 00:00
	 */
	const handleSelect = (newDay: Date | undefined) => {
		if (!newDay) return
		if (!date) {
			setDate(newDay)
			return
		}
		const diff = newDay.getTime() - date.getTime()
		const diffInDays = diff / (1000 * 60 * 60 * 24)
		const newDateFull = add(date, { days: Math.ceil(diffInDays) })
		setDate(newDateFull)
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={clsx(
						'w-[280px] justify-start text-left font-normal',
						!date && 'text-muted-foreground'
					)}
				>
					<Icons.calendar className="mr-2 h-4 w-4" />
					{date ? format(date, 'PPP HH:mm:ss') : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-fit p-0">
				<Calendar
					mode="single"
					selected={date}
					onSelect={d => handleSelect(d)}
					initialFocus
				/>
				<div className="border-t border-border p-3">
					<TimePicker setDate={setDate} date={date} />
				</div>
			</PopoverContent>
		</Popover>
	)
}
