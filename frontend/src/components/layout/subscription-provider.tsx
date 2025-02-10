'use client'

import { useEffect } from 'react'
import { useGetSubscriptionDetails } from 'root/cloud_generated'
import { useAuthState } from '~/hooks/use-auth-state'
import { useLayoutStore } from '~/store/layout.store'

const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { authState } = useAuthState()
	const { writeProperty, featureFlags } = useLayoutStore()

	const { data: subscriptionDetails } = useGetSubscriptionDetails({
		query: {
			enabled: !!authState.isAuthenticated && featureFlags?.SystemFeatureFlags.isCloudEdition
		}
	})

	useEffect(() => {
		if (subscriptionDetails?.subscriptionDetails) {
			writeProperty({
				subscriptionDetails: subscriptionDetails.subscriptionDetails
			})
		}
	}, [subscriptionDetails, writeProperty])

	return children
}

export default SubscriptionProvider
