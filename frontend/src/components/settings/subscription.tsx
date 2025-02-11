'use client'

import { useState } from 'react'
import {
	successNotification,
	errorNotification,
	materialConfirm,
	createHref
} from '~/reusable-functions'
import { Button } from '~/components/ui/button'
import { useCancelSubscription } from '~/cloud_generated'
import { Card, CardTitle, CardContent } from '~/components/ui/card'
import { Icons } from '../icons'
import dayjs from 'dayjs'
import { useLayoutStore } from '~/store/layout.store'
import Link from 'next/link'
import { WEBSITE_URL } from '~/constants'

const SubscriptionSettings = () => {
	const [isBusy, setIsBusy] = useState(false)
	const { writeProperty, subscriptionDetails } = useLayoutStore()

	const cancelSubscriptionMutation = useCancelSubscription()

	async function cancelSubscription() {
		try {
			const confirmed = await materialConfirm({
				title: 'Are you sure?',
				description:
					'Do you really want to cancel your subscription? Once you cancel your subscription your subscription remains active till the end of the period. You won’t be charged again.'
			})

			if (!confirmed) {
				return
			}

			if (subscriptionDetails?.willBeCancelledAtEndOfPeriod) {
				errorNotification({
					message:
						'You subscription is already set to be cancelled at the end of the period'
				})
				return
			}

			const subscriptionId = subscriptionDetails?.uniqueId

			if (!subscriptionId) {
				errorNotification({
					message: 'Subscription ID not found'
				})
				return
			}

			setIsBusy(true)

			const response = await cancelSubscriptionMutation.mutateAsync({
				params: {
					subscriptionId: subscriptionId
				}
			})

			if (response.isCancelled) {
				successNotification({
					message: 'Subscription cancelled successfully'
				})
			} else {
				errorNotification({
					message: 'Failed to cancel subscription'
				})
			}
		} catch (error) {
			console.error(error)
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<Card className="flex flex-col gap-4 p-4">
			<CardTitle className="ml-6">Subscription</CardTitle>
			<CardContent className="flex flex-col gap-4">
				{subscriptionDetails ? (
					<div className="flex flex-col gap-3">
						<p className="text-base">
							Plan:{' '}
							<span className="text-base font-semibold">
								{subscriptionDetails?.tier || 'Free'}{' '}
							</span>
						</p>
						<div className="flex flex-row items-center gap-2">
							<p className="text-sm">
								Valid Till:{' '}
								<span className="text-base font-bold">
									{dayjs(subscriptionDetails.validTill).format('DD MMM, YYYY')}
								</span>
							</p>
						</div>

						{subscriptionDetails.willBeCancelledAtEndOfPeriod ? (
							<div className="text-sm text-muted-foreground">
								<p>Subscription will be cancelled at the end of the period.</p>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								<p>
									Next Billing Date:{' '}
									{dayjs(subscriptionDetails.validTill)
										.add(
											1,
											subscriptionDetails?.validityDuration === 'Monthly'
												? 'month'
												: 'year'
										)
										.format('DD MMM, YYYY')}
								</p>
							</div>
						)}

						<div className="flex flex-row justify-between gap-3">
							<Button
								onClick={() => {
									writeProperty({
										isPricingModalOpen: true
									})
								}}
								className="flex flex-1 flex-row gap-2"
								disabled={isBusy}
							>
								<Icons.arrowUp className="size-4" />
								Upgrade Plan
							</Button>

							<Link
								href={createHref({
									href: '/contacts-us',
									domain: WEBSITE_URL,
									utmParams: {
										utm_content: 'Contact Support',
										utm_source: 'application',
										utm_medium: 'Subscription Settings'
									}
								})}
								className="flex-1"
							>
								<Button
									disabled={isBusy}
									variant={'secondary'}
									className="flex w-full flex-row gap-2"
								>
									<Icons.user className="size-4" />
									Contact Support
								</Button>
							</Link>

							<Button
								onClick={() => {
									cancelSubscription().catch(error => console.error(error))
								}}
								disabled={isBusy}
								variant={'destructive'}
								className="flex flex-row gap-2"
							>
								<Icons.xCircle className="size-4" />
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-row justify-between gap-3">
						<p>You are on Free Plan</p>
						<Button
							onClick={() => {
								writeProperty({
									isPricingModalOpen: true
								})
							}}
							disabled={isBusy}
							className="flex flex-row gap-2"
						>
							<Icons.star className="size-4" />
							Upgrade Plan
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

export default SubscriptionSettings
