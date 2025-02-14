interface HeadingProps {
	title: string
	description: string
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
	return (
		<div>
			<h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	)
}
