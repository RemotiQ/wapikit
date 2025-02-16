import Link from 'next/link'
import { Icons } from '../icons'
import { Card, CardContent } from '../ui/card'
import { type TipCardPropType } from '~/types'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

export function TipCard(props: { tip: TipCardPropType }) {
	const { tip } = props

	const Icon = Icons[tip.icon]

	return (
		<Card className="flex min-h-36 flex-1 p-2 transition-all">
			<CardContent className="flex flex-col items-start gap-4 !p-2">
				<div className="flex flex-row gap-2">
					<div className={`flex h-fit rounded-lg bg-accent p-3`}>
						<Icon className="size-6" />
					</div>
					<div className="flex flex-col gap-1">
						<h3 className="font-semibold">{tip.title}</h3>
						<p className="max-w-sm text-sm text-muted-foreground">{tip.description}</p>
					</div>
				</div>
				<Separator orientation="horizontal" />
				<Link key={tip.title} href={tip.href} className="pl-3 hover:cursor-pointer">
					<Button variant={'link'} className="!p-0 hover:underline">
						<Icons.arrowCircleRight className="size-4" />
						<span className="text-sm">{tip.ctaText}</span>
					</Button>
				</Link>
			</CardContent>
		</Card>
	)
}
