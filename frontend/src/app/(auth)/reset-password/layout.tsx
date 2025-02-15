import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Reset Password | WapiKit'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return <> {children}</>
}
