'use client'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'

interface ModalProps {
	title: string
	description: string
	isOpen: boolean
	isDismissible?: boolean
	onClose: () => void
	children?: React.ReactNode
	fullWidth?: boolean
	className?: string
}

export const Modal: React.FC<ModalProps> = ({
	title,
	description,
	isOpen,
	onClose,
	children,
	isDismissible = true,
	className
}) => {
	const onChange = (open: boolean) => {
		if (!open) {
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onChange}>
			<DialogContent
				onInteractOutside={e => {
					if (!isDismissible) {
						e.preventDefault()
					}
				}}
				className={className}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div>{children}</div>
			</DialogContent>
		</Dialog>
	)
}
