import { type MessageTemplateSchema } from 'root/.generated'
import { Icons } from '../icons'
import { type z } from 'zod'
import { type TemplateComponentParametersSchema } from '~/schema'
import { clsx } from 'clsx'
import dayjs from 'dayjs'
import { Separator } from '../ui/separator'
import MessageButtonRenderer from './button-render'

const TemplateMessageRenderer: React.FC<{
	templateMessage?: MessageTemplateSchema
	parameterValues: z.infer<typeof TemplateComponentParametersSchema>
}> = ({ templateMessage, parameterValues }) => {
	if (!templateMessage) {
		return null
	}

	const header = templateMessage.components?.find(c => c.type === 'HEADER')
	const body = templateMessage.components?.find(c => c.type === 'BODY')
	const footer = templateMessage.components?.find(c => c.type === 'FOOTER')
	const buttons = templateMessage.components?.find(c => c.type === 'BUTTONS')?.buttons

	/**
	 * A helper to replace placeholders in template text with values
	 * from parameterValues (header, body, etc.).
	 * We'll assume placeholders look like {{1}} or {{2}}. If you have
	 * named placeholders (e.g. {{user_name}}), you'd do a similar approach
	 * but match param.nameOrIndex = "user_name" instead of the numeric index approach.
	 */
	function renderTextWithParams(
		templateText: string,
		params: Array<{
			nameOrIndex: string
			parameterType: string
			staticValue?: string
			dynamicField?: string
			placeholder?: string
			example?: string
		}>
	): string {
		if (!templateText.includes('{{')) return templateText

		// Regex for capturing inside {{...}}
		return templateText.replace(/{{(.*?)}}/g, (_, match: string) => {
			// e.g. match might be "1" or "user_name"
			// find a param whose nameOrIndex === match
			// but if the original template is numeric, e.g. {{1}},
			// your param might store "1".
			console.log({ match })
			const foundParam = params.find(p => p.nameOrIndex === match)

			if (!foundParam) {
				// fallback if not found
				return `{{${match}}}`
			}

			// if found, check parameterType
			if (foundParam.parameterType === 'static' && foundParam.staticValue) {
				return foundParam.staticValue || ''
			} else if (foundParam.parameterType === 'dynamic' && foundParam.dynamicField) {
				// 'dynamic'
				// For a preview, you might do something generic like:
				// e.g. "[contact.firstName]" or we just show dynamicField
				return `[${foundParam.dynamicField ?? 'dynamic'}]`
			} else {
				// fallback if not found
				return `{{${match}}}`
			}
		})
	}

	// 1) Render header text
	let headerText = header?.text || ''
	if (headerText) {
		headerText = renderTextWithParams(headerText, parameterValues.header)
	}

	// 2) Render body text
	let bodyText = body?.text || ''
	if (bodyText) {
		bodyText = renderTextWithParams(bodyText, parameterValues.body)
	}

	const MenuIcon = Icons.menu

	return (
		<div
			className={clsx(
				'mr-auto flex   max-w-96 flex-col gap-2 rounded-md bg-white p-1 px-3 text-foreground'
			)}
		>
			{/* header */}
			{header ? <p className="font-bold">{headerText}</p> : null}

			{/* body */}
			{body ? <p className="text-sm">{bodyText}</p> : null}

			{/* footer */}
			<div className="flex flex-row items-start justify-between gap-1">
				{footer ? <p className="flex-1 text-xs opacity-75">{footer.text}</p> : null}
				<span className={clsx('ml-auto text-[10px]')}>{dayjs().format('hh:mm A')}</span>
			</div>

			{/*  buttons */}
			{buttons?.length ? (
				<div key={'button_renderer'}>
					<Separator className="w-full" />
					{buttons.map((button, index) => {
						if (index > 1) {
							return null
						}

						return (
							<>
								<MessageButtonRenderer
									key={`${button.type}-${button.text}`}
									messageButton={button}
								/>

								{index === buttons.length - 1 ? null : (
									<Separator key={`${index}-separator`} />
								)}
							</>
						)
					})}

					{buttons.length > 2 ? (
						<div className="flex cursor-pointer items-center  justify-center gap-2 py-2 text-center text-blue-500">
							<MenuIcon className="size-5" />
							See All Options
						</div>
					) : null}
				</div>
			) : null}
		</div>
	)
}

export default TemplateMessageRenderer
