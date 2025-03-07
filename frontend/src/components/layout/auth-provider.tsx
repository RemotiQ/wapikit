'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAuthState } from '~/hooks/use-auth-state'
import LoadingSpinner from '../loader'
import { useGetAllPhoneNumbers, useGetAllTemplates, useGetUser } from 'root/.generated'
import { useLayoutStore } from '~/store/layout.store'
import { OnboardingStepsEnum } from '~/constants'

const AuthProvisioner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { authState } = useAuthState()
	const router = useRouter()
	const pathname = usePathname()

	const { writeProperty, onboardingSteps, currentOrganization, user } = useLayoutStore()

	useEffect(() => {
		if (!authState.isAuthenticated) {
			if (authState.isAuthenticated === false) {
				if (['/signup', '/signin', '/reset-password'].includes(pathname)) {
					return
				}

				router.push('/signin')
			}
		} else {
			if (pathname === '/') {
				router.replace('/dashboard')
			}
		}
	}, [authState.isAuthenticated, pathname, router])

	const {
		data: userData,
		isError: isGetUserErrored,
		error
	} = useGetUser({
		query: {
			enabled: !!authState.isAuthenticated
		}
	})

	const { data: phoneNumbersResponse } = useGetAllPhoneNumbers({
		query: {
			enabled: !!(authState.isAuthenticated && authState.data.user.organizationId)
		}
	})

	const { data: templatesResponse } = useGetAllTemplates({
		query: {
			enabled: !!(authState.isAuthenticated && authState.data.user.organizationId)
		}
	})

	useEffect(() => {
		if (phoneNumbersResponse && templatesResponse) {
			writeProperty({
				phoneNumbers: phoneNumbersResponse,
				templates: templatesResponse
			})
		}
	}, [phoneNumbersResponse, templatesResponse, writeProperty])

	const [hasRedirected, setHasRedirected] = useState(false)

	useEffect(() => {
		console.log({
			isGetUserErrored,
			error
		})
		// if (isGetUserErrored) return

		if (hasRedirected) return

		if (!authState.isAuthenticated || !userData || (user && currentOrganization)) {
			return
		}

		if (pathname === '/logout') {
			return
		}

		if (!authState.data.user.organizationId) {
			console.log('no organization found')
			writeProperty({
				user: userData.user,
				onboardingSteps: onboardingSteps.map(step => {
					if (step.slug === OnboardingStepsEnum.CreateOrganization) {
						return {
							...step,
							status: 'current'
						}
					} else {
						return step
					}
				})
			})

			// * check if the page is not the invite page
			if (pathname !== '/invite') {
				router.push(`/onboarding/${OnboardingStepsEnum.CreateOrganization}`)
				setHasRedirected(() => true)
			}
		} else {
			console.log('userData', userData)

			if (userData) {
				writeProperty({
					user: userData.user,
					currentOrganization: userData.user.organization,
					isOwner: userData.user.currentOrganizationAccessLevel === 'Owner'
				})
			}

			if (!userData.user.organization?.whatsappBusinessAccountDetails) {
				writeProperty({
					onboardingSteps: onboardingSteps.map(step => {
						if (step.slug === OnboardingStepsEnum.CreateOrganization) {
							return {
								...step,
								status: 'complete'
							}
						} else if (
							step.slug === OnboardingStepsEnum.WhatsappBusinessAccountDetails
						) {
							return {
								...step,
								status: 'current'
							}
						} else {
							return step
						}
					})
				})

				router.push(`/onboarding/${OnboardingStepsEnum.WhatsappBusinessAccountDetails}`)
				setHasRedirected(() => true)
			}
		}
	}, [
		userData,
		writeProperty,
		authState,
		onboardingSteps,
		router,
		user,
		currentOrganization,
		hasRedirected,
		pathname,
		isGetUserErrored,
		error
	])

	if (
		typeof authState.isAuthenticated !== 'boolean' &&
		!authState.isAuthenticated &&
		pathname !== '/'
	) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<LoadingSpinner />
			</div>
		)
	} else {
		return <>{children}</>
	}
}

export default AuthProvisioner
