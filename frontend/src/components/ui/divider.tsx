import { clsx } from 'clsx'
import React, { forwardRef } from 'react'

type DividerProps = React.ComponentPropsWithoutRef<'div'>

const Divider = forwardRef<HTMLDivElement, DividerProps>(
	({ className, children, ...props }, forwardedRef) => (
		<div
			ref={forwardedRef}
			className={clsx(
				// base
				'mx-auto my-6 flex w-full items-center justify-between gap-3 text-sm',
				// text color
				'text-gray-500 dark:text-gray-500',
				className
			)}
			tremor-id="tremor-raw"
			{...props}
		>
			{children ? (
				<>
					<div
						className={clsx(
							// base
							'h-[1px] w-full',
							// background color
							'bg-gray-500 dark:bg-gray-800'
						)}
					/>
					<div className="whitespace-nowrap text-inherit">{children}</div>
					<div
						className={clsx(
							// base
							'h-[1px] w-full',
							// background color
							'bg-gray-500 dark:bg-gray-800'
						)}
					/>
				</>
			) : (
				<div
					className={clsx(
						// base
						'h-[1px] w-full',
						// background color
						'bg-gray-500 dark:bg-gray-800'
					)}
				/>
			)}
		</div>
	)
)

Divider.displayName = 'Divider'

export { Divider }
