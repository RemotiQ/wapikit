'use client'
import { useTheme } from 'next-themes'
import { Icons } from '~/components/icons'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

export default function ThemeToggle() {
	const { setTheme } = useTheme()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Icons.sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Icons.moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme(() => 'light')} className="flex gap-2">
					<Icons.sun />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme(() => 'dark')} className="flex gap-2">
					<Icons.moon />
					Dark
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
