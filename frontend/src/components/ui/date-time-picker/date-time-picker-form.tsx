'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {  z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { clsx as cn } from 'clsx'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'
import { TimePicker } from './time-picker'
import { Icons } from '~/components/icons'


const formSchema = z.object({
	dateTime: z.date()
})
type FormSchemaType = z.infer<typeof formSchema>

const DateTimePickerForm = () => {
	const form = useForm<FormSchemaType>({
		resolver: zodResolver(formSchema)
	})

	function onSubmit(values: FormSchemaType) {
		console.log(values)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="dateTime"
					render={({ field }) => (
						<FormItem className="flex flex-col items-start">
							{/* <FormLabel>DateTime</FormLabel> */}
							{/* popover */}
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={'outline'}
										className={cn(
											'w-[280px] justify-start text-left font-normal',
											!field.value && 'text-muted-foreground'
										)}
									>
										<Icons.calendar className="mr-2 h-4 w-4" />
										{field.value ? (
											format(field.value, 'PPP HH:mm:ss')
										) : (
											<span>Pick a date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										disabled={date =>
											date > new Date() || date < new Date('1900-01-01')
										}
										initialFocus
									/>

									<div className="border-t border-border p-3">
										<TimePicker setDate={field.onChange} date={field.value} />
									</div>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)
}

export { DateTimePickerForm }
