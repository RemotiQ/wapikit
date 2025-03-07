'use client'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '~/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import {
	countParameterCountInTemplateComponent,
	errorNotification,
	materialConfirm,
	parseTemplateComponents,
	successNotification
} from '~/reusable-functions'
import { NewCampaignSchema, TemplateComponentParametersSchema } from '~/schema'
import {
	type CampaignSchema,
	useCreateCampaign,
	useGetContactLists,
	useUpdateCampaignById,
	useGetAllPhoneNumbers,
	useGetAllTemplates,
	useDeleteCampaignById,
	getTemplateById,
	type UpdateCampaignSchema,
	CampaignStatusEnum
} from 'root/.generated'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { type CheckedState } from '@radix-ui/react-checkbox'
import { MultiSelect } from '../multi-select'
import { useLayoutStore } from '~/store/layout.store'
import { useAuthState } from '~/hooks/use-auth-state'
import * as React from 'react'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle
} from '~/components/ui/drawer'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { isPresent } from 'ts-is-present'
import TemplateMessageRenderer from '../chat/template-message-renderer'
import { Icons } from '../icons'
import { clsx } from 'clsx'
import TemplateParameterForm from './template-parameter-form'
import { Skeleton } from '../ui/skeleton'
import { DateTimePicker } from '../ui/date-time-picker/date-time-picker'

interface FormProps {
	initialData: CampaignSchema | null
}

const NewCampaignForm: React.FC<FormProps> = ({ initialData }) => {
	const router = useRouter()
	const { authState } = useAuthState()
	const [loading, setLoading] = useState(false)
	const toastMessage = initialData ? 'Campaign updated.' : 'Campaign created.'
	const action = initialData ? 'Save changes' : 'Create'

	const [newCampaignId, setNewCampaignId] = useState<string | null>(null)

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [isBusy, setIsBusy] = useState(false)
	const [isTemplateComponentsInputModalOpen, setIsTemplateComponentsInputModalOpen] =
		useState(false)
	const [isScheduled, setIsScheduled] = useState(initialData?.scheduledAt ? true : false)

	const { writeProperty, tags } = useLayoutStore()

	const listsResponse = useGetContactLists({
		order: 'asc',
		page: 1,
		per_page: 50
	})

	const {
		data: phoneNumbersResponse,
		refetch: refetchPhoneNumbers,
		isFetching: isFetchingPhoneNumbers
	} = useGetAllPhoneNumbers({
		query: {
			enabled: !!(authState.isAuthenticated && authState.data.user.organizationId)
		}
	})

	const {
		data: templatesResponse,
		refetch: refetchMessageTemplates,
		isFetching: isFetchingTemplates
	} = useGetAllTemplates({
		query: {
			enabled: !!(authState.isAuthenticated && authState.data.user.organizationId)
		}
	})

	const createNewCampaign = useCreateCampaign()
	const deleteCampaignById = useDeleteCampaignById()
	const updateCampaign = useUpdateCampaignById()

	const campaignForm = useForm<CampaignFormValues>({
		resolver: zodResolver(NewCampaignSchema)
	})

	const templateMessageComponentParameterForm = useForm<
		z.infer<typeof TemplateComponentParametersSchema>
	>({
		resolver: zodResolver(TemplateComponentParametersSchema),
		defaultValues: {
			body: [],
			header: [],
			buttons: []
		}
	})

	useEffect(() => {
		if (initialData) {
			campaignForm.reset(
				{
					...initialData,
					name: initialData.name,
					description: initialData.description,
					tags: initialData.tags.map(tag => tag.uniqueId),
					lists: initialData.lists.map(list => list.uniqueId),
					templateId: initialData.templateMessageId,
					isLinkTrackingEnabled: initialData.isLinkTrackingEnabled,
					phoneNumberToUse: initialData.phoneNumberInUse
				},
				{
					keepDirty: false
				}
			)

			if (initialData.templateComponentParameters) {
				templateMessageComponentParameterForm.reset(
					{
						...initialData.templateComponentParameters
					},
					{
						keepDirty: true
					}
				)
			}
		}
	}, [campaignForm, initialData, templateMessageComponentParameterForm])

	const onSubmit = async (data: CampaignFormValues) => {
		try {
			setLoading(true)
			if (initialData) {
				const response = await updateCampaign.mutateAsync({
					id: initialData.uniqueId,
					data: {
						description: data.description,
						enableLinkTracking: data.isLinkTrackingEnabled,
						listIds: data.lists,
						name: data.name,
						templateMessageId: data.templateId,
						phoneNumber: data.phoneNumberToUse,
						tags: data.tags,
						status: isScheduled ? CampaignStatusEnum.Scheduled : initialData.status,
						scheduledAt: isScheduled ? data.schedule.date : undefined
					}
				})

				if (response.isUpdated) {
					successNotification({
						message: toastMessage
					})
				} else {
					errorNotification({
						message: 'There was a problem with your request.'
					})
				}
			} else {
				const response = await createNewCampaign.mutateAsync({
					data: {
						description: data.description,
						isLinkTrackingEnabled: data.isLinkTrackingEnabled,
						listIds: data.lists,
						name: data.name,
						templateMessageId: data.templateId,
						phoneNumberToUse: data.phoneNumberToUse,
						tags: data.tags,
						scheduledAt: isScheduled ? data.schedule.date : undefined
					}
				})

				if (response.campaign) {
					successNotification({
						message: toastMessage
					})
					setNewCampaignId(response.campaign.uniqueId)
					if (data.templateId) {
						// fetch the template here and show the modal

						const templateInuse = (await getTemplateById(data.templateId)).template
						if (!templateInuse) {
							errorNotification({
								message:
									'Unable to fetch your selected message template. However, your campaign has been created successfully. You can edit it later.'
							})
						}

						setIsTemplateComponentsInputModalOpen(true)

						const parameterCount = countParameterCountInTemplateComponent(templateInuse)

						if (parameterCount === 0) {
							router.push(`/campaigns`)
						}
					} else {
						router.push(`/campaigns`)
					}
				} else {
					errorNotification({
						message: 'There was a problem with your request.'
					})
				}
			}
		} catch (error: unknown) {
			errorNotification({
				message:
					error instanceof Error
						? error.message || 'There was a problem with your request.'
						: 'There was a problem with your request.'
			})
		} finally {
			setLoading(false)
		}
	}

	const handleTemplateComponentParameterSubmit = async (
		data: z.infer<typeof TemplateComponentParametersSchema>
	) => {
		try {
			const campaignId = newCampaignId || initialData?.uniqueId

			if (!campaignId) {
				errorNotification({
					message: 'Something went wrong while creating the campaign.'
				})
				return
			}

			setLoading(true)
			const updateCampaignData: UpdateCampaignSchema = initialData
				? {
						...initialData,
						templateComponentParameters: data,
						enableLinkTracking: initialData.isLinkTrackingEnabled,
						listIds: initialData.lists.map(list => list.uniqueId),
						tags: initialData.tags.map(tag => tag.uniqueId),
						phoneNumber: initialData.phoneNumberInUse,
						templateMessageId: initialData.templateMessageId
					}
				: {
						description: campaignForm.getValues('description'),
						enableLinkTracking: campaignForm.getValues('isLinkTrackingEnabled'),
						listIds: campaignForm.getValues('lists'),
						name: campaignForm.getValues('name'),
						templateMessageId: campaignForm.getValues('templateId'),
						phoneNumber: campaignForm.getValues('phoneNumberToUse'),
						tags: campaignForm.getValues('tags'),
						status: CampaignStatusEnum.Draft
					}

			const response = await updateCampaign.mutateAsync({
				data: {
					...updateCampaignData
				},
				id: campaignId
			})

			if (response.isUpdated) {
				router.push(`/campaigns`)
			} else {
				errorNotification({
					message: 'Something went wrong while creating the campaign.'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong while inviting the team member.'
			})
		} finally {
			setLoading(false)
		}
	}

	async function deleteCampaign() {
		try {
			setIsBusy(true)
			if (!initialData?.uniqueId) return

			const confirmation = await materialConfirm({
				title: 'Delete Campaign',
				description: 'Are you sure you want to delete this campaign?'
			})

			if (!confirmation) {
				return
			}

			const response = await deleteCampaignById.mutateAsync({
				id: initialData.uniqueId
			})

			if (response.data) {
				successNotification({
					message: 'Campaign deleted successfully.'
				})
				router.push(`/campaigns`)
			} else {
				errorNotification({
					message: 'Something went wrong while deleting the campaign.'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong while deleting the campaign.'
			})
		} finally {
			setIsBusy(false)
		}
	}

	useEffect(() => {
		return () => {
			if (campaignForm.formState.isDirty) {
				setHasUnsavedChanges(true)
			} else if (campaignForm.formState.isSubmitted) {
				setHasUnsavedChanges(false)
			}
		}
	}, [campaignForm.formState.isDirty, campaignForm.formState.isSubmitted])

	useEffect(() => {
		function handleUnload(e: BeforeUnloadEvent) {
			if (hasUnsavedChanges) {
				e.preventDefault()
			}
		}

		// add a event listener to notify if the form has unsaved changes and user tries to leave the page
		window.addEventListener('beforeunload', handleUnload)

		return () => {
			window.removeEventListener('beforeunload', handleUnload)
		}
	}, [hasUnsavedChanges])

	const currentTemplateId = campaignForm.watch('templateId')

	const isSetupDone = useRef(false)
	// On initial load, use initial data if available
	useEffect(() => {
		if (isSetupDone.current || !currentTemplateId || isFetchingTemplates) return

		console.log('setting up form')
		const currentTemplate = templatesResponse?.find(
			template => template.id === currentTemplateId
		)

		// Use saved parameters if available; otherwise, use undefined so defaults are parsed.
		const defaultValuesForTemplateParameter = parseTemplateComponents(
			currentTemplate,
			initialData?.templateComponentParameters ?? undefined
		)

		console.log({ defaultValuesForTemplateParameter })

		templateMessageComponentParameterForm.reset(defaultValuesForTemplateParameter, {
			keepDirty: false
		})

		isSetupDone.current = true
	}, [
		templatesResponse,
		isFetchingTemplates,
		currentTemplateId,
		initialData?.templateComponentParameters,
		templateMessageComponentParameterForm
	])

	// When the template id changes after initial setup, reset the form with new defaults.
	useEffect(() => {
		if (!isSetupDone.current || !campaignForm.formState.dirtyFields.templateId) return

		console.log('resetting form due to template change')
		const currentTemplate = templatesResponse?.find(
			template => template.id === currentTemplateId
		)

		// Always parse defaults for new template; ignore any saved parameters.
		const defaultValuesForTemplateParameter = parseTemplateComponents(
			currentTemplate,
			undefined
		)

		templateMessageComponentParameterForm.reset(defaultValuesForTemplateParameter)
	}, [
		currentTemplateId,
		templatesResponse,
		templateMessageComponentParameterForm,
		campaignForm.formState.dirtyFields.templateId
	])

	return (
		<>
			<Drawer
				open={isTemplateComponentsInputModalOpen}
				dismissible={false}
				onClose={() => {
					// if in case template parameter has not been saved show a warning.
					const isDirty = templateMessageComponentParameterForm.formState.isDirty
					if (isDirty) {
						materialConfirm({
							title: 'Unsaved changes',
							description: 'You have unsaved changes. Are you sure you want to leave?'
						})
							.then((response: boolean) => {
								if (response) {
									setIsTemplateComponentsInputModalOpen(() => false)
									router.push(`/campaigns`)
								} else {
									// do not close, user  has clicked on cancel
									return
								}
							})
							.catch(error => {
								console.error(error)
							})
					} else {
						router.push(`/campaigns`)
					}
				}}
			>
				<DrawerContent
					className={clsx(
						'mx-auto max-h-[80vh] min-h-[80vh]',
						countParameterCountInTemplateComponent(
							templatesResponse?.find(template => {
								return template.id === currentTemplateId
							})
						) > 0
							? ''
							: 'w-2/3 px-20'
					)}
				>
					{countParameterCountInTemplateComponent(
						templatesResponse?.find(template => {
							return template.id === currentTemplateId
						})
					) > 0 ? (
						<div className="mx-auto w-full">
							<DrawerHeader className="w-full">
								<DrawerTitle>Fill template components</DrawerTitle>
								<DrawerDescription>
									Add the values for the template components parameters. You may
									use templating variables to add dynamic values. For example, you
									can use first_name to add the first name of the contact. Check
									docs here.
								</DrawerDescription>
							</DrawerHeader>
							<Separator />
							<div className="relative flex h-full w-full items-start justify-end space-x-2 pt-6">
								<div className="h-screen flex-1 pb-72">
									<ScrollArea className="h-full">
										<TemplateParameterForm
											templateParameterForm={
												templateMessageComponentParameterForm
											}
											onSubmit={handleTemplateComponentParameterSubmit}
											closeModal={() => {
												setIsTemplateComponentsInputModalOpen(() => false)
											}}
										/>
									</ScrollArea>
								</div>

								<Separator orientation="vertical" className="h-full" />

								<div className="h-full flex-1 rounded-md border">
									<div className="rounded-t-md bg-primary px-2 py-1 text-sm text-primary-foreground">
										Template Preview
									</div>
									<div className="relative h-full w-full rounded-b-md bg-[#ebe5de] p-4 dark:bg-[#202c33]">
										<div className='absolute inset-0 z-20 h-full w-full  bg-[url("/assets/conversations-canvas-bg.png")] bg-repeat opacity-20' />

										<div className="relative z-30 h-96">
											<TemplateMessageRenderer
												templateMessage={templatesResponse?.find(
													template => {
														return template.id === currentTemplateId
													}
												)}
												parameterValues={templateMessageComponentParameterForm.getValues()}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="mx-auto w-full">
							<DrawerHeader className="w-full">
								<DrawerTitle className="text-center">Template Preview</DrawerTitle>
							</DrawerHeader>
							<Separator />
							<div className="mx-auto mt-4 flex h-full w-full max-w-xl flex-1 flex-col gap-4 rounded-md">
								<div className="flex flex-col">
									<div className="rounded-t-md bg-primary px-2 py-1 text-sm text-primary-foreground">
										Template Preview
									</div>
									<div className="relative h-full w-full rounded-b-md bg-[#ebe5de] p-4 dark:bg-[#202c33]">
										<div className='absolute inset-0 z-20 h-full w-full  bg-[url("/assets/conversations-canvas-bg.png")] bg-repeat opacity-20' />
										<div className="relative z-30 h-96">
											<TemplateMessageRenderer
												templateMessage={templatesResponse?.find(
													template => {
														return template.id === currentTemplateId
													}
												)}
												parameterValues={templateMessageComponentParameterForm.getValues()}
											/>
										</div>
									</div>
								</div>
								<Button
									size={'medium'}
									variant={'secondary'}
									onClick={() => {
										setIsTemplateComponentsInputModalOpen(() => false)
									}}
									className="gap-2"
								>
									<Icons.crossCircle className="size-4" />
									Close
								</Button>
							</div>
						</div>
					)}
				</DrawerContent>
			</Drawer>

			<Form {...campaignForm}>
				<form
					onSubmit={e => {
						e.preventDefault()
						onSubmit(campaignForm.getValues()).catch(error => console.error(error))
					}}
					className="w-full space-y-8"
				>
					<div className="w-full space-y-8">
						<div className="flex flex-col gap-8">
							<FormField
								control={campaignForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input
												disabled={loading}
												placeholder="Campaign title"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={campaignForm.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												disabled={loading}
												placeholder="Campaign description"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={campaignForm.control}
								name="lists"
								render={({}) => (
									<FormItem className="tablet:w-3/4 tablet:gap-2 desktop:w-1/2 flex flex-col gap-1 ">
										<FormLabel>Select the lists</FormLabel>
										<MultiSelect
											options={
												listsResponse?.data?.lists.map(list => ({
													label: list.name,
													value: list.uniqueId
												})) || []
											}
											onValueChange={e => {
												campaignForm.setValue('lists', e, {
													shouldValidate: true,
													shouldDirty: true
												})
											}}
											defaultValue={campaignForm.watch('lists')}
											placeholder="Select lists"
											variant="default"
										/>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={campaignForm.control}
								name="tags"
								render={({}) => (
									<FormItem className="tablet:w-3/4 tablet:gap-2 desktop:w-1/2 flex flex-col gap-1 ">
										<FormLabel>Select the tags to add</FormLabel>
										<MultiSelect
											options={
												tags?.map(tag => ({
													label: tag.label,
													value: tag.uniqueId
												})) || []
											}
											onValueChange={e => {
												campaignForm.setValue('tags', e, {
													shouldValidate: true,
													shouldDirty: true
												})
											}}
											defaultValue={campaignForm.watch('tags')}
											placeholder="Select Tags"
											variant="default"
											showCloseButton={false}
											actionButtonConfig={{
												label: (
													<span className="flex items-center gap-2">
														<Icons.plus className="h-4 w-4" />
														Create Tag
													</span>
												),
												onClick: () => {
													writeProperty({
														isCreateTagModalOpen: true
													})
												}
											}}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={campaignForm.control}
								name="templateId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex flex-row items-center gap-2">
											Message Template
											<Button
												disabled={isBusy}
												size={'badge'}
												variant={'outline'}
												type="button"
												onClick={e => {
													e.preventDefault()
													refetchMessageTemplates()
														.then(data => {
															writeProperty({
																templates: data.data || []
															})
														})
														.catch(error => console.error(error))
												}}
											>
												<Icons.regenerate className="size-3" />
											</Button>
										</FormLabel>
										<FormControl>
											<Select
												disabled={loading}
												onValueChange={e => {
													field.onChange(e)
												}}
												name="templateId"
											>
												<SelectTrigger>
													<div>
														{templatesResponse
															?.map(template => {
																if (
																	template.id ===
																	campaignForm.getValues(
																		'templateId'
																	)
																) {
																	const stringToReturn = `${template.name} - ${template.language} - ${template.category}`
																	return stringToReturn
																} else {
																	return null
																}
															})
															.filter(isPresent)[0] ||
															'Select message template'}
													</div>
												</SelectTrigger>
												<SelectContent side="bottom" className="max-h-64">
													{!templatesResponse ||
													templatesResponse?.length === 0 ? (
														<SelectItem
															value={'no message template'}
															disabled
														>
															No message template.
														</SelectItem>
													) : (
														<>
															{templatesResponse?.map(
																(template, index) => (
																	<SelectItem
																		key={`${template.id}-${index}`}
																		value={template.id}
																	>
																		{template.name} -{' '}
																		{template.language} -{' '}
																		{template.category}
																	</SelectItem>
																)
															)}
														</>
													)}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={campaignForm.control}
								name="phoneNumberToUse"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex flex-row items-center gap-2">
											Phone Number
											<Button
												disabled={isBusy}
												variant={'outline'}
												size={'badge'}
												type="button"
												onClick={e => {
													e.preventDefault()
													refetchPhoneNumbers()
														.then(data => {
															writeProperty({
																phoneNumbers: data.data || []
															})
														})
														.catch(error => console.error(error))
												}}
											>
												<Icons.regenerate className="size-3" />
											</Button>
										</FormLabel>
										<FormControl>
											<Select
												disabled={loading}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<div>
														{phoneNumbersResponse
															?.map(phoneNumber => {
																if (
																	phoneNumber.id ===
																	campaignForm.getValues(
																		'phoneNumberToUse'
																	)
																) {
																	return phoneNumber.display_phone_number
																} else {
																	return null
																}
															})
															.filter(isPresent)[0] ||
															'Select Phone Number'}
													</div>
												</SelectTrigger>
												<SelectContent side="bottom" className="max-h-64">
													{!phoneNumbersResponse ||
													phoneNumbersResponse?.length === 0 ? (
														<SelectItem
															value={'no phone numbers found'}
															disabled
														>
															No Phone Numbers.
														</SelectItem>
													) : (
														<>
															{phoneNumbersResponse?.map(phone => (
																<SelectItem
																	key={phone.id}
																	value={phone.id}
																>
																	{phone.display_phone_number}
																</SelectItem>
															))}
														</>
													)}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex items-center gap-6">
								{/* <FormField
									control={campaignForm.control}
									name="isLinkTrackingEnabled"
									render={({ field }) => (
										<FormItem className="flex items-center gap-2">
											<FormControl className="mt-2 flex items-center justify-center">
												<Checkbox
													disabled={loading}
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<FormLabel>Enable Link Tracking</FormLabel>
											<FormMessage />
										</FormItem>
									)}
								/> */}
								<div className="">
									<FormItem className="flex items-center gap-2">
										<Checkbox
											className="mt-2"
											disabled={loading}
											checked={isScheduled}
											onCheckedChange={(e: CheckedState) => {
												setIsScheduled(() => !!e)
											}}
										/>
										<FormLabel>Schedule</FormLabel>
										<FormMessage />
									</FormItem>
								</div>
							</div>
							{isScheduled ? (
								<FormField
									control={campaignForm.control}
									name="schedule.date"
									render={({ field }) => (
										<FormItem>
											<DateTimePicker
												defaultDate={
													field.value ? new Date(field.value) : undefined
												}
												onChange={() => {
													field.onChange(new Date())
												}}
											/>
											{/* <DateTimePickerForm /> */}
											<FormMessage />
										</FormItem>
									)}
								/>
							) : null}
						</div>

						{isFetchingPhoneNumbers || isFetchingTemplates ? (
							<div className="sticky bottom-0 mr-auto flex w-full flex-1 items-start justify-start gap-2 bg-background py-5">
								{Array.from({ length: 3 }).map((_, index) => (
									<Skeleton className="h-10 w-full flex-1" key={index} />
								))}
							</div>
						) : (
							<div className="sticky bottom-0 mr-auto flex w-full flex-1 items-start justify-start gap-2 bg-background py-5">
								<Button
									disabled={loading || isBusy || !campaignForm.formState.isDirty}
									className="ml-auto flex-1"
									type="submit"
								>
									{action}
								</Button>
								{initialData && (
									<>
										{countParameterCountInTemplateComponent(
											templatesResponse?.find(
												template =>
													template.id ===
													campaignForm.getValues('templateId')
											)
										) > 0 ? (
											<Button
												disabled={
													loading ||
													isBusy ||
													!campaignForm.getValues('templateId')
												}
												variant="secondary"
												type="button"
												onClick={() => {
													setIsTemplateComponentsInputModalOpen(true)
												}}
												className="flex flex-1 items-center justify-center gap-1"
											>
												<Icons.pencilEdit className="h-4 w-4" />
												Edit Template Parameters
											</Button>
										) : (
											<Button
												disabled={
													loading ||
													isBusy ||
													!campaignForm.getValues('templateId')
												}
												variant="secondary"
												type="button"
												onClick={() => {
													setIsTemplateComponentsInputModalOpen(true)
												}}
												className="flex flex-1 items-center justify-center gap-1"
											>
												<Icons.eye className="h-4 w-4" />
												Preview Template Parameters
											</Button>
										)}

										<Button
											disabled={loading || isBusy}
											variant="destructive"
											type="button"
											onClick={() => {
												deleteCampaign().catch(error =>
													console.error(error)
												)
											}}
											className="flex flex-1 items-center justify-center gap-1"
										>
											<Icons.trash className="h-4 w-4" />
											Delete
										</Button>
									</>
								)}
							</div>
						)}
					</div>
				</form>
			</Form>
		</>
	)
}

export default NewCampaignForm

type CampaignFormValues = z.infer<typeof NewCampaignSchema>
