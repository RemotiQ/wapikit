'use client'

import React from 'react'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { errorNotification, infoNotification } from '~/reusable-functions'
import { useLayoutStore } from '~/store/layout.store'

export default function ApiQueryClientProvider({ children }: { children: React.ReactNode }) {
	const { writeProperty } = useLayoutStore()

	function showErrorNotification(code: number, message?: string) {
		switch (code) {
			case 400:
				errorNotification({
					message: message || 'Bad request. Please check your input and try again.'
				})
				break
			case 401:
				errorNotification({
					message: message || 'You are not authorized to perform this action.'
				})
				break
			case 402:
				writeProperty({
					isPricingModalOpen: true
				})
				infoNotification({
					message: message || 'You need to upgrade to further access this feature.'
				})
				break
			case 403:
				errorNotification({
					message: message || 'You are forbidden from performing this action.'
				})
				break
			case 404:
				errorNotification({
					message: message || 'Resource not found.'
				})
				break
			case 500:
				errorNotification({
					message: message || 'An internal server error occurred. Please try again later.'
				})
				break
			case 429:
				errorNotification({
					message:
						message || 'You have hit the rate limit. Please try again after some time.'
				})
				break
			default:
				break
		}
	}

	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError(error) {
				const actualError = error as unknown as { statusCode: number; error: string }
				showErrorNotification(actualError.statusCode, actualError.error)
			}
		}),
		defaultOptions: {
			mutations: {
				retry: false,
				throwOnError: false,
				networkMode: 'online',
				onError: error => {
					console.log('ON ERROR CALLED FROM API QUERY CLIENT PROVIDER')
					const actualError = error as unknown as { statusCode: number; error: string }
					showErrorNotification(actualError.statusCode, actualError.error)
				}
			},
			queries: {
				retry: false,
				throwOnError: false,
				networkMode: 'online',
				refetchOnWindowFocus: false
			}
		}
	})

	return (
		<>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</>
	)
}
