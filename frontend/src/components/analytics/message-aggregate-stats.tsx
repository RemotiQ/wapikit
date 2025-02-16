'use client'

import { AreaChart, Legend } from '@tremor/react'
import React from 'react'
import { type MessageAnalyticGraphDataPointSchema } from 'root/.generated'

export const MessageAggregateAnalytics: React.FC<{
	data: MessageAnalyticGraphDataPointSchema[]
}> = ({ data }) => {
	return (
		<div className="h-[375px] w-full rounded-lg">
			<Legend
				categories={['Sent', 'Read', 'Replied', 'Delivered']}
				colors={['red', 'green', 'indigo', 'blue']}
			/>
			<AreaChart
				className="mt-20"
				data={data || []}
				index="label"
				categories={['sent', 'read', 'replied', 'delivered']}
				colors={['red', 'green', 'indigo', 'blue']}
				showLegend={false}
				showAnimation
				showTooltip={true}
				curveType="natural"
				unselectable="on"
			/>
		</div>
	)
}
