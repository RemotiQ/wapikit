import { clsx } from 'clsx'
import { type UseFormReturn } from 'react-hook-form'
import { type z } from 'zod'
import { Icons } from '~/components/icons'
import { Button } from '~/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, Form } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { type TemplateComponentParametersSchema } from '~/schema'

interface TemplateParameterFormProps {
	onSubmit: (data: z.infer<typeof TemplateComponentParametersSchema>) => void
	templateParameterForm: UseFormReturn<z.infer<typeof TemplateComponentParametersSchema>>
	closeModal: () => void
}

const TemplateParameterForm = (props: TemplateParameterFormProps) => {
	const { onSubmit, templateParameterForm, closeModal } = props

	const CONTACT_FIELD_OPTIONS = [
		{ label: 'First Name', value: 'firstName' },
		{ label: 'Last Name', value: 'lastName' },
		{ label: 'Email', value: 'email' },
		{ label: 'Phone', value: 'phoneNumber' }
	]

	const headerFields = templateParameterForm.watch('header')
	const bodyFields = templateParameterForm.watch('body')
	const buttonFields = templateParameterForm.watch('buttons')

	// For brevity, let's define a small sub-component to render each parameter row:
	const ParameterRow = (
		compType: 'header' | 'body' | 'buttons',
		fieldIndex: number,
		fieldValue: z.infer<typeof TemplateComponentParametersSchema>['header'][number]
	) => {
		console.log({
			parameterType: templateParameterForm.watch(`${compType}.${fieldIndex}.parameterType`)
		})

		// read & write with react-hook-form
		return (
			<div className="flex flex-row items-end justify-end gap-2 rounded p-3" key={fieldIndex}>
				{/* If the user picks "static", show a text input */}
				{templateParameterForm.watch(`${compType}.${fieldIndex}.parameterType`) ===
					'static' && (
					<FormField
						control={templateParameterForm.control}
						name={`${compType}.${fieldIndex}.staticValue` as const}
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>
									{fieldValue.label} -{' '}
									<code className="text-xs italic text-red-500">
										Ex: {fieldValue.example}
									</code>
								</FormLabel>
								<FormControl>
									<Input placeholder={fieldValue.placeholder} {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				)}

				{/* If the user picks "dynamic", show a dropdown of contact fields */}
				{templateParameterForm.watch(`${compType}.${fieldIndex}.parameterType`) ===
					'dynamic' && (
					<FormField
						control={templateParameterForm.control}
						name={`${compType}.${fieldIndex}.dynamicField` as const}
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>
									{fieldValue.label} -{' '}
									<code className="text-xs italic text-red-500">
										Ex: {fieldValue.example}
									</code>
								</FormLabel>
								<FormControl>
									<Select
										onValueChange={val => field.onChange(val)}
										value={field.value ?? ''}
									>
										<SelectTrigger>
											<SelectValue placeholder={fieldValue.placeholder} />
										</SelectTrigger>
										<SelectContent>
											{CONTACT_FIELD_OPTIONS.map(opt => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					/>
				)}

				<FormField
					control={templateParameterForm.control}
					name={`${compType}.${fieldIndex}.parameterType` as const}
					render={({ field }) => (
						<FormItem>
							<TooltipProvider delayDuration={200}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant={'outline'}
											className={clsx(
												'mt-2 w-fit items-center text-blue-600',
												field.value === 'dynamic' ? 'bg-blue-100' : ''
											)}
											onClick={e => {
												e.preventDefault()
												if (field.value === 'static') {
													field.onChange('dynamic')
												} else {
													field.onChange('static')
												}
											}}
										>
											<span className="mr-1">{`{}`}</span>
										</Button>
									</TooltipTrigger>

									<TooltipContent className="flex flex-row items-center gap-1">
										<Icons.info className="size-4" />
										{field.value === 'dynamic'
											? 'Change to static'
											: 'Change to dynamic'}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</FormItem>
					)}
				/>
			</div>
		)
	}

	return (
		<Form {...templateParameterForm}>
			<form
				onSubmit={templateParameterForm.handleSubmit(data => {
					onSubmit(data)
				})}
				className="my-6 flex flex-col gap-3 px-5"
			>
				{/* HEADER PARAMS */}
				{headerFields.length > 0 && (
					<div className="flex flex-col gap-2">
						<h3 className="rounded-lg bg-accent p-2 text-base font-semibold text-muted-foreground">
							Header Parameters
						</h3>
						<div className="flex flex-col gap-2">
							{headerFields.map((field, index) =>
								ParameterRow('header', index, field)
							)}
						</div>
						<Separator className="my-2" />
					</div>
				)}

				{/* BODY PARAMS */}
				{bodyFields.length > 0 && (
					<div className="flex flex-col gap-2">
						<h3 className="rounded-lg bg-accent p-2 text-base font-semibold text-muted-foreground">
							Body Parameters
						</h3>
						<div className="flex flex-col gap-4">
							{bodyFields.map((field, index) => ParameterRow('body', index, field))}
						</div>
						<Separator className="my-4" />
					</div>
				)}

				{/* BUTTON PARAMS */}
				{buttonFields.length > 0 && (
					<div className="flex flex-col gap-2">
						<h3 className="rounded-lg bg-accent p-2 text-base font-semibold text-muted-foreground">
							Button Parameters
						</h3>
						<div className="flex flex-col gap-4">
							{buttonFields.map((field, index) =>
								ParameterRow('buttons', index, field)
							)}
						</div>
					</div>
				)}

				<div className="sticky bottom-0 left-0 right-0 z-10 flex gap-3 bg-white p-4 pb-10 shadow-md">
					<Button type="submit" className="w-full flex-1" variant="default">
						Save
					</Button>
					<Button
						type="button"
						onClick={() => {
							closeModal()
						}}
						className="w-full flex-1"
						variant="outline"
					>
						Cancel
					</Button>
				</div>
			</form>
		</Form>
	)
}

export default TemplateParameterForm
