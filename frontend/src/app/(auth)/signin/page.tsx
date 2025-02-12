'use client'

import Link from 'next/link'
import UserLoginForm from '~/components/forms/user-login-form'
import { buttonVariants } from '~/components/ui/button'
import { clsx } from 'clsx'
import Image from 'next/image'
import { useAuthState } from '~/hooks/use-auth-state'
import { redirect } from 'next/navigation'
import LoadingSpinner from '~/components/loader'
import { createHref } from '~/reusable-functions'
import { WEBSITE_URL } from '~/constants'
import { GitHubLogoIcon, StarFilledIcon } from '@radix-ui/react-icons'

export default function AuthenticationPage() {
	const { authState } = useAuthState()

	if (authState.isAuthenticated) {
		redirect('/dashboard')
	} else if (authState.isAuthenticated === false) {
		return (
			<div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
				<Link
					href="/signin"
					className={clsx(
						buttonVariants({ variant: 'ghost' }),
						'absolute right-4 top-4 hidden md:right-8 md:top-8'
					)}
				>
					Login
				</Link>
				<div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
					<div className="bg-primary-gradient absolute inset-0" />
					<div className="relative z-20 flex items-center text-lg font-medium">
						<Image src={'/logo/dark.svg'} width={100} height={40} alt="logo" />
					</div>

					<div className="relative z-20 mt-auto max-w-lg text-left leading-relaxed flex flex-col items-start justify-start gap-3">
						<span className="font-sans text-5xl font-light">
							Do <span className="font-semibold">AI Automated</span> WhatsApp
							Marketing
						</span>{' '}
						<div className="flex flex-row items-start justify-start gap-1">
							<span className="text-2xl font-light italic">Faster.</span>
							<span className="text-2xl font-light italic">Smarter.</span>
							<span className="text-2xl font-light italic">Better.</span>
						</div>
					</div>

					<Link
						href={'https://github.com/wapikit/wapikit'}
						target="_blank"
						className="group relative z-20 mt-auto w-fit rounded-lg border border-gray-500 px-2.5 py-1.5"
					>
						<blockquote className=" flex items-center gap-2">
							<GitHubLogoIcon className='text-gray-400' />
							<p className="text-sm font-bold text-gray-400">Star us on Github</p>
							<StarFilledIcon className="text-gray-400 size-4 group-hover:text-yellow-400" />
						</blockquote>
					</Link>
				</div>
				<div className="flex h-full items-center p-4 lg:p-8">
					<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
						<div className="flex flex-col space-y-2 text-left">
							<h1 className="text-2xl font-semibold tracking-tight">
								Sign in to WapiKit
							</h1>
						</div>
						<UserLoginForm />
						<p className="text-left text-sm text-muted-foreground">
							By clicking continue, you agree to our{' '}
							<Link
								href={createHref({
									href: '/terms-and-conditions',
									domain: WEBSITE_URL,
									utmParams: {
										utm_medium: 'auth',
										utm_content: 'terms-and-conditions',
										utm_source: 'application-login-page'
									}
								})}
								className="underline underline-offset-4 hover:text-primary"
							>
								Terms & Conditions
							</Link>{' '}
							and{' '}
							<Link
								href={createHref({
									href: '/privacy-policy',
									domain: WEBSITE_URL,
									utmParams: {
										utm_medium: 'auth',
										utm_content: 'privacy-policy',
										utm_source: 'application-login-page'
									}
								})}
								className="underline underline-offset-4 hover:text-primary"
							>
								Privacy Policy
							</Link>
							.
						</p>
						<p className="text-left text-xs text-muted-foreground">
							Don't have an account?{' '}
							<Link
								href="/signup"
								className="underline underline-offset-4 hover:text-primary"
							>
								Signup
							</Link>
							.
						</p>
					</div>
				</div>
			</div>
		)
	} else {
		// auth is still loading
		return <LoadingSpinner />
	}
}
