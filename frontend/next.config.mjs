/** @type {import('next').NextConfig} */

const isCloudEdition = process.env.NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION === 'true'

const nextConfig = {
	env: {
		NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION: process.env.NEXT_PUBLIC_IS_MANAGED_CLOUD_EDITION,
		BACKEND_URL: process.env.BACKEND_URL,
	},
	output: !isCloudEdition ? 'export' : undefined,
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
