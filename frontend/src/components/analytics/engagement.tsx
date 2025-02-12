'use client'

import { AreaChart } from '@tremor/react'
import React from 'react'
import { type LinkClicksGraphDataPointSchema } from 'root/.generated'

export const EngagementTrends: React.FC<{ data: LinkClicksGraphDataPointSchema[] }> = ({
	data
}) => {
	return (
		<div className="h-[375px] w-full rounded-lg">
			<AreaChart
				className="mt-20 text-xs"
				data={data || []}
				index="label"
				categories={['count']}
				colors={['green']}
				showLegend={false}
				showAnimation
				showTooltip={true}
			/>
		</div>
	)
}
