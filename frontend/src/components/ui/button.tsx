import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { clsx as cn } from 'clsx'

const buttonVariants = cva(
	'inline-flex min-w-max  items-center justify-center flex-shrink-0 border font-semibold focus:outline-none disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transform transition-colors',
	{
		variants: {
			variant: {
				default:
					'bg-primary border border-primaryShades-600 font-semibold text-primary-foreground shadow hover:shadow-md transition-all',
				destructive:
					'bg-destructive border border-red-600 text-destructive-foreground shadow-sm hover:shadow-md shadow',
				outline:
					'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
				text: 'border-none border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md shadow',
				secondaryBlack:
					'bg-black text-white shadow-sm hover:bg-black/90hover:shadow-md shadow',
				ghost: 'rounded-full border-none ',
				link: 'text-muted-foreground hover:text-foreground transition-colors border-none hover:border-none',
				rainbow:
					'group relative animate-rainbow cursor-pointer border-0 bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,#FF4242,#A1FF42,#42A1FF,#42D0FF,#A142FF)]  bg-[length:200%] text-white [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,#FF4242,#A1FF42,#42A1FF,#42D0FF,#A142FF)] before:[filter:blur(calc(0.8*1rem))]'
			},
			size: {
				default: 'px-4 py-2 text-sm rounded-lg gap-2',
				xSmallForGraphics: 'rounded-[4px] px-1.5 py-[2px] text-[5px] gap-1',
				smallForGraphics: 'rounded-md px-1.5 py-1 text-[6px] gap-1',
				sm: 'rounded-lg px-2.5 py-1.5 text-xs gap-2',
				medium: 'rounded-lg px-3 py-1.5 text-sm gap-2',
				lg: 'rounded-lg px-4 py-2 text-sm gap-2',
				xLarge: 'rounded-lg px-6 py-1.5 text-base gap-2',
				badge: 'rounded-lg px-2 py-1 text-xs gap-1',
				icon: 'rounded-full p-2'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = 'Button'

export { Button, buttonVariants }
