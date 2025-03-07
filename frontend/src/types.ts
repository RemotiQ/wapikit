import { type MessageTypeEnum } from 'root/.generated'
import type { Icons } from '~/components/icons'

export interface NavItem {
	title: string
	href?: string
	disabled?: boolean
	external?: boolean
	icon?: keyof typeof Icons
	label?: string
	description?: string
	status: 'coming-soon' | 'beta' | 'new' | 'default'
	shouldBeLocked?: boolean
	requiredFeatureFlag?: string[]
}

export type CommandItemType = {
	slug: string
	icon?: keyof typeof Icons
	label: string
	action: () => void
}

export interface Contact {
	name: string
	phone: string
	list: string[]
}

export interface TableCellActionProps {
	icon: keyof typeof Icons
	label: string
	onClick: (data: any) => Promise<void> | void
	disabled?: boolean
}

export enum SseEventSourceStateEnum {
	Connecting = 'Connecting',
	Connected = 'Connected',
	Disconnected = 'Disconnected'
}

export enum ChatBotStateEnum {
	Idle = 'Idle',
	Streaming = 'Streaming',
	Thinking = 'Thinking'
}

export type TipCardPropType = {
	icon: keyof typeof Icons
	title: string
	description: string
	href: string
	ctaText: string
}

export const UtmTags = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'ref'
] as const

export type ConversationFileAttachmentType = {
	file: File
	isUploading: boolean
	mediaType: MessageTypeEnum
	fileName: string
}
