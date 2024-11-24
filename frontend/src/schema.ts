import { ContactStatusEnum, RolePermissionEnum, UserPermissionLevel } from 'root/.generated'
import { z } from 'zod'

export const UserTokenPayloadSchema = z.object({
	unique_id: z.string(),
	username: z.string(),
	email: z.string(),
	role: z.nativeEnum(UserPermissionLevel),
	organization_id: z.string(),
	name: z.string()
})

export const NewTeamMemberInviteFormSchema = z.object({
	email: z.string().email({ message: 'Enter a valid email address' })
})

export const UpdateOrganizationMemberRolesFormSchema = z.object({
	roles: z.string().array()
})

export const NewRoleFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z.string().optional(),
	permissions: z.nativeEnum(RolePermissionEnum).array()
})

export const UserUpdateFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' })
})

export const OrganizationUpdateFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z
		.string()
		.min(3, { message: 'Description must be at least 3 characters' })
		.optional()
})

export const WhatsappBusinessAccountDetailsFormSchema = z.object({
	whatsappBusinessAccountId: z.string(),
	webhookSecret: z.string(),
	apiToken: z.string()
})

export const NewOrganizationFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z.string().optional()
})

export const NewContactFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z
		.string()
		.min(3, { message: 'Description must be at least 3 characters' })
		.optional(),
	phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
	lists: z.string().array().default([]),
	status: z.nativeEnum(ContactStatusEnum),
	attributes: z.any()
})

export const NewContactListFormSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z.string().optional(),
	tagIds: z.string().array().default([])
})

export const NewCampaignSchema = z.object({
	name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
	description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
	tags: z.string().array(),
	lists: z.string().array(),
	templateId: z.string().nullish(),
	isLinkTrackingEnabled: z.boolean(),
	templateParameter: z.object({
		parameter: z.string(),
		parameterIndex: z.string(),
		parameterType: z.string(),
		value: z.string()
	}),
	schedule: z.object({
		date: z.string(),
		time: z.string()
	})
})

export const TemplateComponentSchema = z.array(
	z.object({
		type: z.enum(['body', 'header', 'button']),
		value: z.string()
	})
)

export const BulkImportContactsFormSchema = z.object({
	delimiter: z.string().min(1, { message: 'Delimiter must be at least 1 character' }),
	file: z.any(),
	listIds: z.string().array().default([])
})
