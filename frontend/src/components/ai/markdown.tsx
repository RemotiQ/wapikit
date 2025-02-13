import Link from 'next/link'
import React, { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Partial<Components> = {
	pre: ({ children }) => <>{children}</>,
	ol: ({ children, ...props }) => {
		return (
			<ol className="ml-4 w-full list-outside list-decimal" {...props}>
				{children}
			</ol>
		)
	},
	li: ({ children, ...props }) => {
		return (
			<li className="w-full py-1" {...props}>
				{children}
			</li>
		)
	},
	ul: ({ children, ...props }) => {
		return (
			<ul className="ml-4 w-full list-outside list-decimal" {...props}>
				{children}
			</ul>
		)
	},
	strong: ({ children, ...props }) => {
		return (
			<span className="w-full font-semibold" {...props}>
				{children}
			</span>
		)
	},
	a: ({ children, ...props }) => {
		return (
			// @ts-expect-error
			<Link
				className="w-full text-blue-500 hover:underline"
				target="_blank"
				rel="noreferrer"
				{...props}
			>
				{children}
			</Link>
		)
	},
	h1: ({ children, ...props }) => {
		return (
			<h1 className="mb-1 mt-3 w-full text-3xl font-semibold" {...props}>
				{children}
			</h1>
		)
	},
	h2: ({ children, ...props }) => {
		return (
			<h2 className="mb-1 mt-3 w-full text-2xl font-semibold" {...props}>
				{children}
			</h2>
		)
	},
	h3: ({ children, ...props }) => {
		return (
			<h3 className="mb-1 mt-3 w-full text-xl font-semibold" {...props}>
				{children}
			</h3>
		)
	},
	h4: ({ children, ...props }) => {
		return (
			<h4 className="mb-1 mt-3 w-full text-lg font-semibold" {...props}>
				{children}
			</h4>
		)
	},
	h5: ({ children, ...props }) => {
		return (
			<h5 className="mb-1 w-full text-base font-semibold" {...props}>
				{children}
			</h5>
		)
	},
	h6: ({ children, ...props }) => {
		return (
			<h6 className="mb-1 mt-3 w-full text-sm font-semibold" {...props}>
				{children}
			</h6>
		)
	},
	p: ({ children, ...props }) => {
		return (
			<p className="mb-1 w-full text-base" {...props}>
				{children}
			</p>
		)
	}
}

const remarkPlugins = [remarkGfm]

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
	return (
		<ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
			{children}
		</ReactMarkdown>
	)
}

export const Markdown = memo(
	NonMemoizedMarkdown,
	(prevProps, nextProps) => prevProps.children === nextProps.children
)
