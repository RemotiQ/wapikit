'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { Label } from '~/components/ui/label'
import { TimePickerInput } from './time-picker-inputs'

interface TimePickerProps {
	date: Date | undefined
	setDate: React.Dispatch<React.SetStateAction<Date>>
}

export function TimePicker({ date, setDate }: TimePickerProps) {
	const minuteRef = React.useRef<HTMLInputElement>(null)
	const hourRef = React.useRef<HTMLInputElement>(null)
	const secondRef = React.useRef<HTMLInputElement>(null)

	return (
		<div className="flex items-center justify-start gap-2">
			<div className="grid gap-1 text-center">
				<Label htmlFor="hours" className="text-xs">
					Hours
				</Label>
				<TimePickerInput
					picker="hours"
					date={date}
					setDate={setDate}
					ref={hourRef}
					type="number"
					onRightFocus={() => minuteRef.current?.focus()}
					className="max-w-20"
				/>
			</div>
			<div className="grid gap-1 text-center">
				<Label htmlFor="minutes" className="text-xs">
					Minutes
				</Label>
				<TimePickerInput
					picker="minutes"
					date={date}
					setDate={setDate}
					ref={minuteRef}
					type="number"
					onLeftFocus={() => hourRef.current?.focus()}
					onRightFocus={() => secondRef.current?.focus()}
					className="max-w-20"
				/>
			</div>
			<div className="grid gap-1 text-center">
				<Label htmlFor="seconds" className="text-xs">
					Seconds
				</Label>
				<TimePickerInput
					picker="seconds"
					date={date}
					setDate={setDate}
					type="number"
					ref={secondRef}
					onLeftFocus={() => minuteRef.current?.focus()}
					className="max-w-20"
				/>
			</div>
			<div className="flex items-center">
				<Clock className="ml-2 h-4 w-4" />
			</div>
		</div>
	)
}
