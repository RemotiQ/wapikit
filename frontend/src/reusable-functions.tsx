import { v4 } from 'uuid'
import { toast } from 'sonner'
import { CheckCircledIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { createRoot } from 'react-dom/client'
import { AlertModal } from './components/modal/alert-modal'
import { type MessageTemplateSchema } from 'root/.generated'
import { Icons } from './components/icons'
import { APP_BASE_DOMAIN } from './constants'
import { type UtmTags } from './types'
import { type PricingPlan } from 'root/cloud_generated'

export function generateUniqueId() {
	return v4()
}

export function infoNotification(params: { message: string; darkMode?: true; duration?: string }) {
	return toast.error(
		<div className="flex flex-row items-center justify-start gap-2">
			<InfoCircledIcon className="h-5 w-5" color="#3b82f6" />
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
			<CheckCircledIcon className="h-5 w-5" color="#22c55e" />
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

/**
 * Calculates the number of parameters required for each component in the template.
 * @param template - The template object.
 * @returns An object with component types as keys and parameter counts as values.
 */
export function getParametersPerComponent(
	template?: MessageTemplateSchema
): Record<string, number> {
	const parameterCounts: Record<string, number> = {}

	if (!template || !template.components) {
		return parameterCounts
	}

	template.components.forEach(component => {
		if (!component.type) {
			return
		}

		let parameterCount = 0

		// Check the example field of the main component
		if (component.example) {
			switch (component.type) {
				case 'BODY': {
					if (component.example.body_text?.length) {
						// it is an array of array
						component.example.body_text.forEach(bodyText => {
							parameterCount += bodyText.length
						})
					}
					break
				}

				case 'HEADER': {
					if (component.example.header_text) {
						parameterCount += component.example.header_text.length
					}

					if (component.format !== 'TEXT') {
						parameterCount += 1
					}

					break
				}
			}
		}

		// Check the example field of any buttons
		// ! TODO: enable this after fixing the wapi.go object structure for template buttons
		if (component.buttons) {
			component.buttons.forEach(button => {
				if (button.example) {
					parameterCount += button.example.length
				}
			})
		}

		const keyToUse =
			component.type === 'BODY' ? 'body' : component.type === 'BUTTONS' ? 'buttons' : 'header'

		// Add the count for this component
		parameterCounts[keyToUse] = parameterCount
	})

	return parameterCounts
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
		image: '/assets/logo/brand-logo.png',
		allow_rotation: true,
		recurring: true,
		description: description,
		subscription_id: sessionId,
		handler: function (response: any) {
			console.log(response)
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
