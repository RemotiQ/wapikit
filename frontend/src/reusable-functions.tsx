import { v4 } from 'uuid'
import { toast } from 'sonner'
import { createRoot } from 'react-dom/client'
import { AlertModal } from './components/modal/alert-modal'
import {
	MessageTypeEnum,
	type MessageTemplateSchema,
	type MessageSchema,
	type TemplateComponentParameters
} from 'root/.generated'
import { Icons } from './components/icons'
import { APP_BASE_DOMAIN } from './constants'
import { type UtmTags } from './types'
import { type PricingPlan } from 'root/cloud_generated'
import { type z } from 'zod'
import { type TemplateComponentParametersSchema } from './schema'
import { lookup } from 'mime-types'
import dayjs from 'dayjs'

export function generateUniqueId() {
	return v4()
}

export function infoNotification(params: { message: string; darkMode?: true; duration?: string }) {
	return toast.error(
		<div className="flex flex-row items-center justify-start gap-2">
			<Icons.infoCircle className="h-5 w-5" color="#3b82f6" />
			<span>{params.message}</span>
		</div>
	)
}

export function errorNotification(params: { message: string; darkMode?: true; duration?: string }) {
	return toast.error(
		<div className="flex flex-row items-center justify-start gap-2">
			<Icons.xCircle className="h-5 w-5" color="#ef4444" />
			<span>{params.message}</span>
		</div>
	)
}

export function successNotification(params: {
	message: string
	darkMode?: true
	duration?: string
}) {
	return toast.success(
		<div className="flex flex-row items-center justify-start gap-2">
			<Icons.checkCircle className="h-5 w-5" color="#22c55e" />
			<span>{params.message}</span>
		</div>
	)
}

export function warnNotification(params: { message: string; darkMode?: true; duration?: string }) {
	return toast.success(
		<div className="flex flex-row items-center justify-start gap-2">
			<Icons.warning className="h-5 w-5" color="#fcb603" />
			<span>{params.message}</span>
		</div>
	)
}

export function materialConfirm(params: { title: string; description: string }): Promise<boolean> {
	return new Promise(resolve => {
		const container = document.createElement('div')
		document.body.appendChild(container)

		const root = createRoot(container)

		const closeDialog = () => {
			root.unmount()
		}

		const handleConfirm = (confirmation: boolean) => {
			closeDialog()
			resolve(confirmation)
		}

		root.render(
			<AlertModal
				loading={false}
				isOpen={true}
				onClose={closeDialog}
				onConfirm={handleConfirm}
				title={params.title}
				description={params.description}
			/>
		)
	})
}

export function parseMessageContentForHyperLink(message: string) {
	const urlRegex = /(https?:\/\/[^\s]+)/g
	return message.replace(urlRegex, '<a href="$1" target="_blank">$1</a>')
}

export function countParameterCountInTemplateComponent(template?: MessageTemplateSchema): number {
	let total = 0
	const parsedParams = parseTemplateComponents(template)
	total += parsedParams.header.length
	total += parsedParams.body.length
	total += parsedParams.buttons.length
	return total
}

type TemplateParameterInputType = z.infer<typeof TemplateComponentParametersSchema>['header'][0]

function extractExampleValueForUrlButton(templateUrl: string, exampleUrl: string): string {
	// Find the placeholder start
	console.log({ templateUrl, exampleUrl })
	const startIndex = templateUrl.indexOf('{{1}}')
	if (startIndex === -1) {
		// No placeholder, return full example
		return exampleUrl
	}

	// The prefix is everything before the placeholder
	const prefix = templateUrl.substring(0, startIndex)
	// Find the end of the placeholder (first "}" after the "${")
	const endIndex = templateUrl.indexOf('}', startIndex)
	// The suffix is everything after the placeholder, if any
	const suffix =
		endIndex !== -1 && endIndex + 1 < templateUrl.length
			? templateUrl.substring(endIndex + 1)
			: ''

	let dynamicPart = exampleUrl
	// Remove prefix if present
	if (prefix && exampleUrl.startsWith(prefix)) {
		dynamicPart = dynamicPart.substring(prefix.length)
	}
	// Remove suffix if present
	if (suffix && dynamicPart.endsWith(suffix)) {
		dynamicPart = dynamicPart.substring(0, dynamicPart.length - suffix.length)
	}
	return dynamicPart
}

export function parseTemplateComponents(
	template?: MessageTemplateSchema,
	defaults?: TemplateComponentParameters
): z.infer<typeof TemplateComponentParametersSchema> {
	// Initialize arrays to hold parameters for each component type.
	const headerParams: TemplateParameterInputType[] = []
	const bodyParams: TemplateParameterInputType[] = []
	const buttonParams: TemplateParameterInputType[] = []

	if (defaults) {
		headerParams.push(...defaults.header)
		bodyParams.push(...defaults.body)
		buttonParams.push(...defaults.buttons)

		return defaults
	}

	if (!template || !template.components) {
		return {
			header: headerParams,
			body: bodyParams,
			buttons: buttonParams
		}
	}

	console.log('template.components', template.components)

	template.components.forEach(comp => {
		const type = comp.type?.toUpperCase()

		if (type === 'HEADER') {
			// For HEADER components, check first for named parameters.
			if (
				comp.example?.header_text_named_params &&
				comp.example.header_text_named_params.length > 0
			) {
				comp.example.header_text_named_params.forEach(param => {
					headerParams.push({
						nameOrIndex: param.param_name,
						label: `Header parameter`,
						parameterType: 'static',
						example: param.example,
						placeholder: `{{${param.param_name}}}`
					})
				})
			} else if (comp.example?.header_text && comp.example.header_text.length > 0) {
				// Fallback: use positional parameters from header_text (array of strings).
				comp.example.header_text.forEach((ex, idx) => {
					headerParams.push({
						nameOrIndex: String(idx + 1),
						label: `Header`,
						parameterType: 'static',
						example: ex,
						placeholder: `{{${idx + 1}}}`
					})
				})
			}
			// If header is of media type (format !== 'TEXT') and no parameters added, add a default parameter.
			if (comp.format && comp.format !== 'TEXT' && headerParams.length === 0) {
				headerParams.push({
					nameOrIndex: 'media_link',
					label: 'Header media link',
					parameterType: 'static',
					example: 'https://example.com/image.jpg',
					placeholder: '{{media_link}}'
				})
			}
		} else if (type === 'BODY') {
			// For BODY components, check for named parameters first.
			if (
				comp.example?.body_text_named_params &&
				comp.example.body_text_named_params.length > 0
			) {
				comp.example.body_text_named_params.forEach(param => {
					bodyParams.push({
						nameOrIndex: param.param_name,
						label: `Body parameter {{${param.param_name}}}`,
						parameterType: 'static',
						example: param.example,
						placeholder: `{{${param.param_name}}}`
					})
				})
			} else if (comp.example?.body_text && comp.example.body_text.length > 0) {
				comp.example.body_text[0].forEach((ex, idx) => {
					bodyParams.push({
						nameOrIndex: String(idx + 1),
						label: `Body placeholder #${idx + 1}`,
						parameterType: 'static',
						example: ex,
						placeholder: `{{${idx + 1}}}`
					})
				})
			}
		} else if (type === 'BUTTONS') {
			// For BUTTONS components, iterate over each button.
			if (comp.buttons && comp.buttons.length > 0) {
				comp.buttons.forEach((btn, btnIndex) => {
					// Check if button has an example array (positional example)
					if (btn.example && Array.isArray(btn.example) && btn.example.length > 0) {
						btn.example.forEach((example, idx) => {
							if (btn.type === 'URL') {
								const actualExample = extractExampleValueForUrlButton(
									btn.url || '',
									example
								)

								buttonParams.push({
									nameOrIndex: 'url',
									label: `${btn.type} - parameter for placeholder "{{1}}"`,
									parameterType: 'static',
									example: actualExample,
									placeholder: btn.url
								})
							} else {
								buttonParams.push({
									nameOrIndex: String(idx + 1),
									label: `${btn.type} Button #${btnIndex + 1} parameter #${idx + 1}`,
									parameterType: 'static',
									example: example,
									placeholder: `{{${idx + 1}}}`
								})
							}
						})
					} else if (btn.type && btn.type.toUpperCase() === 'QUICK_REPLY') {
						// QUICK_REPLY buttons always need a parameter (using dynamic type).
						buttonParams.push({
							nameOrIndex: 'payload',
							label: `Quick Reply Button #${btnIndex + 1} {{payload}}`,
							parameterType: 'static',
							example: 'PAYLOAD_VALUE',
							placeholder: '{{payload}}'
						})
					}
				})
			}
		}
	})

	return {
		header: headerParams,
		body: bodyParams,
		buttons: buttonParams
	}
}

export const createHref = ({
	href,
	domain = APP_BASE_DOMAIN,
	utmParams,
	redirectUri
}: {
	href: string
	domain?: string
	// any params, doesn't have to be all of them
	utmParams?: Partial<Record<(typeof UtmTags)[number], string>>
	redirectUri?: string
}) => {
	if (domain === APP_BASE_DOMAIN) return href
	const url = new URL(`${domain}${href}`)
	if (utmParams) {
		Object.entries(utmParams).forEach(([key, value]) => {
			if (value) {
				url.searchParams.set(key, value)
			}
		})
	}
	if (redirectUri) {
		url.searchParams.set('redirect', redirectUri)
	}
	return url.toString()
}

function loadScript(src: string) {
	return new Promise(resolve => {
		const script = document.createElement('script')
		script.src = src
		script.onload = () => {
			resolve(true)
		}
		script.onerror = () => {
			resolve(false)
		}
		document.body.appendChild(script)
	})
}

export async function displayRazorpayCheckoutModal(params: {
	plan: PricingPlan
	userDetails: {
		email: string
		name: string
		phone?: string
	}
	isAnUpgrade: boolean
	sessionId: string
	verificationToken: string
	onSuccess: (token: string) => void
}) {
	const { sessionId, isAnUpgrade, plan, onSuccess, userDetails, verificationToken } = params
	const description = `${isAnUpgrade ? 'Upgrade' : 'Subscription'} to ${plan.tier} plan`

	await loadScript('https://checkout.razorpay.com/v1/checkout.js')

	// * reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/#123-checkout-options
	const options = {
		key: process.env.RAZORPAY_KEY_ID,
		amount: plan.finalPriceInLowestCurrencyUnits.toString(),
		currency: 'USD',
		name: 'WapiKit',
		prefill: {
			name: userDetails.name,
			email: userDetails.email,
			contact: userDetails.phone
		},
		image: '/logo/brand-logo.png',
		allow_rotation: true,
		recurring: true,
		description: description,
		subscription_id: sessionId,
		handler: function (response: any) {
			if (response.razorpay_payment_id) {
				onSuccess(verificationToken)
			} else {
				console.error('Payment failed')
			}
		},
		theme: {
			color: '#00AA45'
		}
	}

	// @ts-ignore - Razorpay is loaded in the global scope
	const paymentObject = new window.Razorpay(options)
	paymentObject.open()
}

/**
 * Determines the message type based on the file's MIME type, extension, and size.
 *
 * @param file The File object selected by the user.
 * @returns A string representing the message type.
 */
export function determineMessageType(file: File): MessageTypeEnum {
	// Use file.type if provided, otherwise fall back to looking it up by extension.
	const mimeTypeFromFile = file.type || (lookup(file.name) as string) || ''
	const mimeType = mimeTypeFromFile.toLowerCase()
	const fileName = file.name.toLowerCase()

	// Check for audio types.
	if (mimeType.startsWith('audio/')) {
		return MessageTypeEnum.Audio
	}

	// Check for video types.
	if (mimeType.startsWith('video/')) {
		return MessageTypeEnum.Video
	}

	// Check for image types.
	if (mimeType.startsWith('image/')) {
		// For WebP images, decide whether to treat them as stickers based on file size.
		if (mimeType === 'image/webp' || fileName.endsWith('.webp')) {
			// If the file size is small (e.g., ≤ 100KB), treat it as a sticker.
			if (file.size <= 100 * 1024) {
				return MessageTypeEnum.Sticker
			}
			// Otherwise, treat as a normal image.
			return MessageTypeEnum.Image
		}
		return MessageTypeEnum.Image
	}

	// Check for common document types.
	const documentMimeTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'text/plain'
	]

	if (documentMimeTypes.includes(mimeType)) {
		return MessageTypeEnum.Document
	}

	throw new Error('Unsupported file type')
}

type GroupedMessages = {
	date: dayjs.Dayjs
	messages: MessageSchema[]
}

/**
 * Group an array of messages by their date (ignoring time).
 */
export function groupMessagesByDate(messages: MessageSchema[]): GroupedMessages[] {
	const groups: GroupedMessages[] = []
	let currentDay: dayjs.Dayjs = dayjs()
	let currentGroup: MessageSchema[] = []

	for (const msg of messages) {
		const msgDay = dayjs(msg.createdAt).startOf('day')
		if (!currentDay || !msgDay.isSame(currentDay)) {
			// If we already have a current group, push it.
			if (currentGroup.length > 0) {
				groups.push({ date: currentDay, messages: currentGroup })
			}
			// Start a new group for this day.
			currentDay = msgDay
			currentGroup = [msg]
		} else {
			// Same day, keep adding messages to the current group.
			currentGroup.push(msg)
		}
	}

	// Push the final group if it exists.
	if (currentGroup.length > 0 && currentDay) {
		groups.push({ date: currentDay, messages: currentGroup })
	}

	return groups
}

/**
 * Return a label for the given date, such as "Today", "Yesterday", or "DD MMM".
 */
export function getDayLabel(date: dayjs.Dayjs): string {
	if (date.isSame(dayjs(), 'day')) {
		return 'Today'
	}
	if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
		return 'Yesterday'
	}
	return date.format('DD MMM')
}
