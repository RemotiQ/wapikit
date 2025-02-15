import React, { useEffect, useState } from 'react'

/**
 * A small, soothing pastel palette.
 * Add or remove colors as you like.
 */
const pastelPalette = [
	'#E8F1FE', // Pastel red
	'#FFEBEB', // Pastel orange
	'#FBE4F0', // Pastel yellow
	'#E4F3E9', // Pastel green
	'#F8F8EF', // Pastel blue
	'#F9ECE3', // Pastel purple
	'#EDE4FB', // Pastel pink
	'#E4EEFA', // Pastel lavender
	'#E1F1EF'
]

/**
 * We'll keep color usage in memory.
 * Once the page refreshes, all is lost.
 */
const colorUsage: Record<string, number> = {}
const assignedColors: Record<string, string> = {}

/**
 * Tag component that picks a pastel color for each label,
 * balancing usage among the palette to reduce duplication.
 */
interface TagProps {
	label: string
}

const Tag: React.FC<TagProps> = ({ label }) => {
	const [bgColor, setBgColor] = useState('#ccc')

	useEffect(() => {
		// If already assigned, reuse that color.
		if (assignedColors[label]) {
			setBgColor(assignedColors[label])
			return
		}

		// Otherwise, pick the color in pastelPalette with the lowest usage.
		// Initialize usage to 0 if not present.
		pastelPalette.forEach(c => {
			if (colorUsage[c] === undefined) {
				colorUsage[c] = 0
			}
		})

		// Find color with the minimum usage count.
		let leastUsedColor = pastelPalette[0]
		for (const c of pastelPalette) {
			if (colorUsage[c] < colorUsage[leastUsedColor]) {
				leastUsedColor = c
			}
		}

		// Assign it to this label
		assignedColors[label] = leastUsedColor
		// Increment usage
		colorUsage[leastUsedColor] += 1

		// Update our state
		setBgColor(leastUsedColor)
	}, [label])

	// We can use a simple dark color for text to ensure contrast with the pastel background.
	const textColor = '#444'

	return (
		<span
			style={{
				backgroundColor: bgColor,
				color: textColor,
				padding: '4px 8px',
				borderRadius: '8px',
				fontSize: '0.85rem',
				fontWeight: 500,
				display: 'inline-block',
				margin: '2px'
			}}
		>
			{label}
		</span>
	)
}

export { Tag }
