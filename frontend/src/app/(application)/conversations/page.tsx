'use client'

import { useEffect } from 'react'
import { useGetConversations } from 'root/.generated'
import { useConversationInboxStore } from '~/store/conversation-inbox.store'
import ChatCanvas from '~/components/chat/chat-canvas'
import ConversationsSidebar from '~/components/chat/conversation-list-sidebar'
import { Card } from '~/components/ui/card'
import { useSearchParams } from 'next/navigation'

const ChatDashboard = () => {
	const queryParams = useSearchParams()
	const conversationId = queryParams.get('id')

	const { writeProperty: writeConversationStoreProperty } = useConversationInboxStore()

	const { data: conversations } = useGetConversations({
		page: 1,
		per_page: 50
	})

	useEffect(() => {
		if (!conversations?.conversations) return

		writeConversationStoreProperty({
			conversations: conversations?.conversations || []
		})
	}, [conversations?.conversations, writeConversationStoreProperty])

	return (
		<div className="flex h-full flex-1 flex-col">
			<div className="grid h-screen gap-2 px-4 md:grid-cols-8 lg:grid-cols-7">
				<Card className="h-full rounded-md md:col-span-4 lg:col-span-3 xl:col-span-2">
					<ConversationsSidebar />
				</Card>
				<Card className=" h-full w-full rounded-md md:col-span-4 lg:col-span-4 xl:col-span-5">
					<ChatCanvas conversationId={conversationId || undefined} />
				</Card>
			</div>
		</div>
	)
}

export default ChatDashboard
