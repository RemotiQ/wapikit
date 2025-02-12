'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '~/components/loader'
import { AUTH_TOKEN_LS } from '~/constants'
import { useLocalStorage } from '~/hooks/use-local-storage'

const LogoutPage = () => {
	const setAuthToken = useLocalStorage<string | null>(AUTH_TOKEN_LS, '')[1]
	const router = useRouter()

	useEffect(() => {
		setAuthToken(null)

		setTimeout(() => {
			router.replace('/signin')
		}, 500)
	}, [router, setAuthToken])

	return (
		<div className="flex h-[100vh] w-full flex-col items-center justify-center gap-4 font-bold">
			<div className="text-sm">Logging you out, please wait....</div>
			<div className="h-fit">
				<LoadingSpinner />
			</div>
		</div>
	)
}

export default LogoutPage
