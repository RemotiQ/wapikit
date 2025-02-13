'use client'

import Link from 'next/link'
import Image from 'next/image'
import { GitHubLogoIcon, StarFilledIcon } from '@radix-ui/react-icons'
import UserResetPasswordForm from '~/components/forms/user-reset-password-form'

export default function AuthenticationPage() {
	return (
		<div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
			<div className="relative  hidden h-full flex-col overflow-hidden bg-primary-gradient p-10 text-white  dark:border-r lg:flex">
				<div className="relative z-20 flex items-center text-lg font-medium">
					<Image src={'/logo/dark.svg'} width={100} height={40} alt="logo" />
				</div>
				<div className="relative z-20 mt-auto flex max-w-lg flex-col items-start justify-start gap-3 text-left leading-relaxed">
					<span className="font-sans text-5xl font-light">
						Do <span className="font-semibold">AI Automated</span> WhatsApp Marketing
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
					className="group relative z-10 mt-auto w-fit cursor-pointer rounded-lg border border-gray-500 px-2.5 py-1.5"
				>
					<blockquote className=" flex items-center gap-2">
						<GitHubLogoIcon className="text-gray-400" />
						<p className="text-sm font-bold text-gray-400">Star us on Github</p>
						<StarFilledIcon className="size-4 text-yellow-400" />
					</blockquote>
				</Link>
			</div>
			<div className="flex h-full items-center p-4 lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-1 sm:w-[350px]">
					<div className="flex flex-col space-y-2 text-left">
						<h1 className="text-2xl font-bold tracking-tight">Reset your Password</h1>
					</div>
					<UserResetPasswordForm />
				</div>
			</div>
		</div>
	)
}
