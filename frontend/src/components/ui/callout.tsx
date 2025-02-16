import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { clsx as cx } from 'clsx'

const calloutVariants = cva('flex flex-col overflow-hidden rounded-lg p-4 text-sm', {
	variants: {
		variant: {
			default: [
				// text color
				'text-blue-900 dark:text-blue-400',
				// background color
				'bg-blue-50 dark:bg-blue-950/70'
			],
			success: [
				// text color
				'text-emerald-900 dark:text-emerald-500',
				// background color
				'bg-emerald-50 dark:bg-emerald-950/70'
			],
			error: [
				// text color
				'text-red-900 dark:text-red-500',
				// background color
				'bg-red-50 dark:bg-red-950/70'
			],
			warning: [
				// text color
				'text-yellow-900 dark:text-yellow-500',
				// background color
				'bg-yellow-50 dark:bg-yellow-950/70'
			],
			neutral: [
				// text color
				'text-gray-900 dark:text-gray-400',
				// background color
				'bg-gray-100 dark:bg-gray-800/70'
			]
		}
	},
	defaultVariants: {
		variant: 'default'
	}
})

interface CalloutProps
	extends ComponentPropsWithoutRef<'div'>,
		VariantProps<typeof calloutVariants> {
	title: string
	icon?: React.ElementType | React.ReactElement
}

const Callout = forwardRef<HTMLDivElement, CalloutProps>(
	({ title, icon: Icon, className, variant, children, ...props }: CalloutProps, forwardedRef) => {
		return (
			<div
				ref={forwardedRef}
				className={cx(calloutVariants({ variant }), className)}
				tremor-id="tremor-raw"
				{...props}
			>
				<div className={cx('flex  items-center')}>
					{Icon && typeof Icon === 'function' ? (
						<Icon className={cx('mr-1.5 h-5 w-5 shrink-0')} aria-hidden="true" />
					) : (
						Icon
					)}
					<span className={cx('text-xl font-bold')}>{title}</span>
				</div>
				<div className={cx('overflow-y-auto', children ? 'mt-4' : '')}>{children}</div>
			</div>
		)
	}
)

Callout.displayName = 'Callout'

export { Callout, calloutVariants, type CalloutProps }
