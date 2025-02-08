'use client'

import { useState } from 'react'
import { successNotification, errorNotification } from '~/reusable-functions'
import { Button } from '~/components/ui/button'
import {
	useCancelSubscription,
	useGetSubscriptionDetails,
	useRefundPayment
} from '~/cloud_generated'
import { useAuthState } from '~/hooks/use-auth-state'
import { Card, CardTitle, CardContent } from '~/components/ui/card'
import { Icons } from '../icons'
import dayjs from 'dayjs'

const SubscriptionSettings = () => {
	const { authState } = useAuthState()
	const [isBusy, setIsBusy] = useState(false)

	const { data: subscriptionDetails } = useGetSubscriptionDetails({
		query: {
			enabled: !!authState.isAuthenticated
		}
	})

	const cancelSubscriptionMutation = useCancelSubscription()
	const initRefundMutation = useRefundPayment()

	async function cancelSubscription() {
		try {
			if (subscriptionDetails?.subscriptionDetails.willBeCancelledAtEndOfPeriod) {
				errorNotification({
					message:
						'You subscription is already set to be cancelled at the end of the period'
				})
				return
			}

			const subscriptionId = subscriptionDetails?.subscriptionDetails.uniqueId

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

	async function initRefund() {
		try {
			if (!subscriptionDetails?.subscriptionDetails.isRefundAllowed) {
				errorNotification({
					message: 'Refund is not allowed for this subscription'
				})
			}

			const subscriptionId = subscriptionDetails?.subscriptionDetails.uniqueId

			if (!subscriptionId) {
				errorNotification({
					message: 'Subscription ID not found'
				})
				return
			}

			setIsBusy(true)

			const response = await initRefundMutation.mutateAsync({
				params: {
					paymentId: subscriptionId
				}
			})

			if (response.isRefundedInitiated) {
				successNotification({
					message: 'Refund initiated successfully'
				})
			} else {
				errorNotification({
					message: 'Failed to initiate refund'
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
			<CardTitle>Subscription Settings</CardTitle>
			<CardContent className="flex flex-col gap-4">
				{subscriptionDetails?.subscriptionDetails ? (
					<div>
						<p>
							You are on {subscriptionDetails?.subscriptionDetails?.tier || 'Free'}{' '}
							Plan
						</p>
						<div className="text-sm text-muted-foreground">Subscription Valid Till</div>
						<div className="text-lg font-semibold">
							{dayjs(subscriptionDetails.subscriptionDetails.validTill).format(
								'DD MMM, YYYY'
							)}
						</div>
						<div>
							<p>
								Next Billing Date:{' '}
								{dayjs(subscriptionDetails.subscriptionDetails.validTill)
									.add(
										1,
										subscriptionDetails.subscriptionDetails
											?.validityDuration === 'Monthly'
											? 'month'
											: 'year'
									)
									.format('DD MMM, YYYY')}
							</p>
						</div>
						<div className="flex flex-row justify-between gap-3">
							<Button
								onClick={() => {
									// show pricing plan modal
								}}
								disabled={isBusy}
							>
								Upgrade Plan
							</Button>
							<Button
								onClick={() => {
									initRefund().catch(error => console.error(error))
								}}
								disabled={isBusy}
							>
								<Icons.arrowClockwise className="size-4" />
								Refund
							</Button>

							{/* Cancel Button */}
							<Button
								onClick={() => {
									cancelSubscription().catch(error => console.error(error))
								}}
								disabled={isBusy}
								variant={'destructive'}
							>
								<Icons.xCircle className="size-4" />
								Cancel
							</Button>
							<Button
								onClick={() => {
									cancelSubscription().catch(error => console.error(error))
								}}
								disabled={isBusy}
								variant={'destructive'}
							>
								<Icons.user className="size-4" />
								Contact Support
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-row justify-between gap-3">
						<p>
							You are on {subscriptionDetails?.subscriptionDetails?.tier || 'Free'}{' '}
							Plan
						</p>
						<Button
							onClick={() => {
								// show pricing plan modal
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
