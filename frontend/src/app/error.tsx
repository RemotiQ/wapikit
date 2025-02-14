'use client'

import Link from 'next/link'
import { Icons } from '~/components/icons'
import { Button } from '~/components/ui/button'
import { WEBSITE_URL } from '~/constants'

export default function Error({ reset, error }: { error: Error; reset: () => void }) {
	return (
		<div className="flex h-[70vh] flex-col items-center justify-center gap-4">
			<h2 className="mx-auto text-center text-xl text-gray-900">
				Oops! Something went wrong{' '}
			</h2>
			<div className="flex gap-4">
				<Button onClick={() => reset()} size={'medium'}>
					<Icons.reload className="size-6 text-white" /> Try again
				</Button>
				<Link title="contact-support" href={`${WEBSITE_URL}/contact-us`} rel="">
					<Button size={'medium'} variant={'outline'}>
						<Icons.messageTextSquare className="h-6 w-6 text-white" /> Contact Support
					</Button>
				</Link>
			</div>
		</div>
	)
}
