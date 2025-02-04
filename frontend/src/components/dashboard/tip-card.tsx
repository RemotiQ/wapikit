import Link from 'next/link'
import { Icons } from '../icons'
import { Card, CardContent } from '../ui/card'
import { type TipCardPropType } from '~/types'

export function TipCard(props: { tip: TipCardPropType }) {
	const { tip } = props

	const Icon = Icons[tip.icon]

	return (
		<Link key={tip.title} href={tip.href} className="h-full flex-1 hover:cursor-pointer ">
			<Card className="min-h-44 py-3 transition-all">
				<CardContent className="flex items-start gap-4">
					<div className={`rounded-lg bg-accent p-2`}>
						<Icon className="size-8" />
					</div>
					<div className="flex flex-col items-start justify-start gap-2">
						<h3 className="font-medium">{tip.title}</h3>
						<p className="max-w-sm text-sm text-muted-foreground">{tip.description}</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
