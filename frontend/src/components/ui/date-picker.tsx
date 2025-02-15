'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { clsx } from 'clsx'
import { Icons } from '../icons'

const DatePicker: React.FC<{ prefilledDate: Date | undefined }> = ({ prefilledDate }) => {
	const [date, setDate] = React.useState<Date | undefined>(prefilledDate)

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
					{date ? format(date, 'PPP') : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={date}
					onSelect={e => {
						if (e) {
							setDate(() => e)
						}
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	)
}

export { DatePicker }
