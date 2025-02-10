import type { Metadata, Viewport } from 'next'
import {
	APP_URL,
	META_CATEGORY,
	META_CLASSIFICATION,
	META_KEYWORDS,
	MetaTitle,
	ProductDescription
} from '~/constants'

export const viewport: Viewport = {
	themeColor: {
		color: '#00AA45'
	},
	colorScheme: 'light',
	width: 'device-width',
	initialScale: 1
}

export const metadata: Metadata = {
	title: `Team | ${MetaTitle}`,
	description: ProductDescription,
	applicationName: 'Wapikit',
	authors: [{ name: 'Wapikit Team', url: `${APP_URL}/` }],
	generator: 'Next.js',
	referrer: 'origin-when-cross-origin',
	keywords: META_KEYWORDS,
	publisher: 'WapiKit',
	robots: 'index, follow',
	creator: 'Wapikit',
	manifest: `/manifest.json`,
	openGraph: {
		type: 'website',
		url: APP_URL,
		title: MetaTitle,
		description: ProductDescription,
		images: [{ url: `/open-graph.png` }],
		siteName: 'Wapikit'
	},
	twitter: {
		card: 'summary_large_image',
		site: '@wapikit',
		description: ProductDescription,
		title: MetaTitle,
		creator: '@wapikit',
		images: `/twitter-og.png`
	},
	verification: {
		google: ''
	},
	formatDetection: { telephone: false },
	appleWebApp: true,
	assets: `${APP_URL}/assets`,
	category: META_CATEGORY.join(', '),
	classification: META_CLASSIFICATION.join(', '),
	other: {
		'X-UA-Compatible': 'IE=edge,chrome=1',
		'mobile-web-app-capable': 'yes'
	},
	metadataBase: new URL(APP_URL),
	alternates: {
		canonical: new URL(APP_URL)
	},
	icons: [
		{ rel: 'icon', url: `${APP_URL}/favicon.ico` },
		{ rel: 'apple-touch-icon', url: `${APP_URL}/apple-icon.png` }
	]
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
