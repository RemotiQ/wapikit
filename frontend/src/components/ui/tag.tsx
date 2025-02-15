import React, { useState, useEffect } from 'react'

const getRandomColor = () => {
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

const getStoredColors = () => {
	const stored = localStorage.getItem('tagColors')
	return stored ? JSON.parse(stored) : {}
}

const storeColors = (colors: Record<string, string>) => {
	localStorage.setItem('tagColors', JSON.stringify(colors))
}

const Tag: React.FC<{ label: string }> = ({ label }) => {
	const [colorMap, setColorMap] = useState<Record<string, string>>(() => getStoredColors())

	useEffect(() => {
		if (!colorMap[label]) {
			const newColor = getRandomColor()
			const updatedMap = { ...colorMap, [label]: newColor }
			setColorMap(updatedMap)
			storeColors(updatedMap)
		}
	}, [label, colorMap])

	return (
		<div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 pointer-events-none">
			<span
				className="h-2 w-2 rounded-full"
				style={{ backgroundColor: colorMap[label] }}
			></span>
			<span className="text-xs font-medium text-gray-700">{label}</span>
		</div>
	)
}

export { Tag }
