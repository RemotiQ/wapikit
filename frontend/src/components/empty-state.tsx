import Image from 'next/image'
import { Card, CardContent, CardFooter } from './ui/card'

interface EmptyStateProps {
	title: string
	image?: string
	action: React.ReactNode
}

export function EmptyState({ title, image, action }: EmptyStateProps) {
	return (
		<Card className="flex min-h-60 w-1/3 flex-col items-center justify-center text-center">
			<CardContent className="flex flex-col items-center justify-center">
				{image ? <Image src={image} alt={title} width={100} height={100} /> : null}
				<h3 className="mb-2 text-xl font-semibold">{title}</h3>
			</CardContent>
			<CardFooter>{action}</CardFooter>
		</Card>
	)
}
