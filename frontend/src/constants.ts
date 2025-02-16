import { type Icons } from './components/icons'
import { type NavItem } from './types'

export const WEBSITE_URL = 'https://www.wapikit.com'
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
export const IS_MANAGED_CLOUD_EDITION = process.env.NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION === 'true'

export const AUTH_TOKEN_LS = '__auth_token'

export const REDIRECT_URL_LS = '__redirect_url'

export function getBackendUrl() {
	if (IS_DEVELOPMENT) {
		return 'http://127.0.0.1:8000/api'
	}

	if (IS_MANAGED_CLOUD_EDITION) {
		return process.env.BACKEND_URL
	} else {
		return '/api'
	}
}

export const IMG_MAX_LIMIT = 10

export const navItems: NavItem[] = [
	{
		title: 'Dashboard',
		href: '/dashboard',
		icon: 'grid',
		label: 'Dashboard',
		status: 'default'
	},
	{
		title: 'WapiKit AI',
		href: '/ai',
		icon: 'aiStar',
		label: 'WapiKit AI',
		requiredFeatureFlag: ['isAiIntegrationEnabled'],
		status: 'beta'
	},
	{
		title: 'Analytics',
		href: '/analytics',
		icon: 'analytics',
		label: 'Analytics',
		status: 'default'
	},
	{
		title: 'Inbox',
		href: '/conversations',
		icon: 'messageChatSquare',
		label: 'Conversations',
		status: 'default'
	},
	{
		title: 'Campaigns',
		href: '/campaigns',
		icon: 'announcement',
		label: 'Campaigns',
		status: 'default'
	},
	{
		title: 'Contacts',
		href: '/contacts',
		icon: 'contacts',
		label: 'profile',
		status: 'default'
	},
	{
		title: 'Lists',
		href: '/lists',
		icon: 'file',
		label: 'employee',
		status: 'default'
	},
	{
		title: 'Team',
		href: '/team',
		icon: 'team',
		label: 'Teams',
		status: 'default'
	},
	{
		title: 'Settings',
		href: '/settings',
		icon: 'settings',
		label: 'kanban',
		status: 'default'
	},
	{
		title: 'Integrations',
		href: '/integrations',
		icon: 'zapFast',
		label: 'Integrations',
		status: 'coming-soon'
	}
]

export enum OnboardingStepsEnum {
	CreateOrganization = 'create-organization',
	WhatsappBusinessAccountDetails = 'whatsapp-business-account-details',
	InviteTeamMembers = 'invite-team-members'
}

export const OnboardingSteps: {
	title: string
	description: string
	slug: OnboardingStepsEnum
	status: 'current' | 'incomplete' | 'complete'
	icon: keyof typeof Icons
}[] = [
	{
		title: 'Create Organization',
		description: 'Create an organization to get started',
		slug: OnboardingStepsEnum.CreateOrganization,
		status: 'current',
		icon: 'globe'
	},
	{
		title: 'Whatsapp Business Account Details',
		description: 'Enter your Whatsapp Business Account details to get started',
		slug: OnboardingStepsEnum.WhatsappBusinessAccountDetails,
		status: 'incomplete',
		icon: 'whatsapp'
	},
	{
		title: 'Invite Team Members',
		description:
			'Enter the email addresses of your team members to invite them to your organization',
		slug: OnboardingStepsEnum.InviteTeamMembers,
		status: 'incomplete',
		icon: 'inviteTeamMember'
	}
] as const

export const pathAtWhichSidebarShouldBeCollapsedByDefault = ['/conversations']

export const APP_BASE_DOMAIN = 'app.wapikit.com'

export const APP_URL = `https://${APP_BASE_DOMAIN}`

export const OFFICIAL_DOCUMENTATION_URL = 'https://docs.wapikit.com'

export const ProductDescription =
	'WapiKit is an AI-powered WhatsApp marketing & customer engagement platform that automates campaigns, enhances conversations, and drives business growth effortlessly with automation.'

export const MetaTitle = 'Wapikit - AI Automated WhatsApp Marketing & Customer Engagement Platform'

export const META_CATEGORY = ['Whatsapp Marketing', '']

export const META_KEYWORDS = ['Whatsapp Marketing', '']

export const META_CLASSIFICATION = ['Whatsapp Marketing']

export const PRODUCTION_WEBHOOK_URL = 'https://api.wapikit.com/api/webhook/whatsapp'
