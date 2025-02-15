import { clsx as cn } from 'clsx'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('bg-gray-200 animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
