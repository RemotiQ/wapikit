'use client'

import React from 'react'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { errorNotification, infoNotification } from '~/reusable-functions'
import { useLayoutStore } from '~/store/layout.store'

export default function ApiQueryClientProvider({ children }: { children: React.ReactNode }) {
	console.log('API QUERY CLIENT PROVIDER')

	const { writeProperty } = useLayoutStore()

	function showErrorNotification(code: number) {
		switch (code) {
			case 401:
				errorNotification({
					message: 'You are not authorized to perform this action.'
				})
				break
			case 402:
				writeProperty({
					isPricingModalOpen: true
				})
				infoNotification({
					message: 'You need to upgrade to further access this feature.'
				})
				break
			case 403:
				errorNotification({
					message: 'You are forbidden from performing this action.'
				})
				break
			case 404:
				errorNotification({
					message: 'The requested resource was not found.'
				})
				break
			case 500:
				errorNotification({
					message: 'An internal server error occurred. Please try again later.'
				})
				break
			case 429:
				errorNotification({
					message: 'You have hit the rate limit. Please try again after some time.'
				})
				break
			default:
				errorNotification({
					message: 'An error occurred. Please try again later.'
				})
				break
		}
	}

	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError(error) {
				const actualError = error as unknown as { statusCode: number; error: any }
				showErrorNotification(actualError.statusCode)
			}
		}),
		defaultOptions: {
			mutations: {
				retry: false,
				throwOnError: false,
				networkMode: 'online',
				onError: error => {
					console.log('ON ERROR CALLED FROM API QUERY CLIENT PROVIDER')
					console.error({
						error
					})
					if (((error as unknown as { status: number }).status as number) === 429) {
						errorNotification({
							message:
								'You have hit the rate limit. Please try again after some time.'
						})
					}
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
