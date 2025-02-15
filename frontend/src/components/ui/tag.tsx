import React, { useState, useEffect } from 'react'

const getRandomColor = (): string => {
	const colors = [
		'#FF5733',
		'#33FF57',
		'#3357FF',
		'#FF33A1',
		'#A133FF',
		'#FFD700',
		'#00FFFF',
		'#FF4500',
		'#8A2BE2',
		'#00FA9A',
		'#FF6347',
		'#4682B4',
		'#32CD32',
		'#DC143C',
		'#FF8C00',
		'#BA55D3',
		'#20B2AA',
		'#008B8B',
		'#B22222',
		'#D2691E',
		'#6A5ACD',
		'#FF1493',
		'#7B68EE',
		'#ADFF2F'
	]
	return colors[Math.floor(Math.random() * colors.length)]
}

// Function to adjust color brightness
const adjustColor = (color: string, amount: number): string => {
	if (!color || !color.startsWith('#') || color.length !== 7) return '#CCCCCC' // Default color
	const num = parseInt(color.substring(1), 16) // Remove # before parsing
	const r = Math.min(255, Math.max(0, (num >> 16) + amount))
	const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
	const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
	return `rgb(${r}, ${g}, ${b})`
}

// Get colors from localStorage
const getStoredColors = (): Record<string, string> => {
	try {
		const stored = localStorage.getItem('tagColors')
		return stored ? JSON.parse(stored) : {}
	} catch (error) {
		console.error('Error reading colors from storage:', error)
		return {}
	}
}

// Store colors persistently
const storeColors = (colors: Record<string, string>) => {
	localStorage.setItem('tagColors', JSON.stringify(colors))
}

const Tag: React.FC<{ label: string }> = ({ label }) => {
	const [colorMap, setColorMap] = useState<Record<string, string>>(() => getStoredColors())
	const [tagColor, setTagColor] = useState<string | null>(null)

	useEffect(() => {
		let updatedMap = { ...colorMap }

		if (!colorMap[label]) {
			const newColor = getRandomColor()
			updatedMap[label] = newColor
			storeColors(updatedMap)
		}

		setColorMap(updatedMap)
		setTagColor(updatedMap[label] || '#CCCCCC') // Ensure tagColor is always defined
	}, [label])

	if (!tagColor) return null // Prevent rendering until color is available

	const backgroundColor = adjustColor(tagColor, 100) // Lighten color
	const textColor = adjustColor(tagColor, -50) // Darken color

	return (
		<div
			className="py-o.5 rounded-md px-2 text-sm font-medium"
			style={{ backgroundColor, color: textColor }}
		>
			{label}
		</div>
	)
}

export { Tag }
