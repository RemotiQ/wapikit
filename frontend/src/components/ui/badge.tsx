import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { clsx as cn } from 'clsx'

const badgeVariants = cva(
	'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold cursor-default transform transition-colors',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground shadow',
				secondary: 'border-transparent bg-gray-300 text-secondary-foreground',
				destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
				outline: 'text-foreground',
				highlighted: 'bg-primary border border-primary text-white shadow px-[5px]'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
