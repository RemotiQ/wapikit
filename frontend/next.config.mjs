const isCloudEdition = process.env.NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION: process.env.NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION,
		BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
		RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
		GTM_ID: process.env.NEXT_PUBLIC_GTM_ID
	},
	output: !isCloudEdition ? 'export' : undefined,
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production'
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				hostname: 'unsplash.com'
			},
			{
				hostname: 'cdn.bfldr.com'
			}
		]
	}
}

export default nextConfig
