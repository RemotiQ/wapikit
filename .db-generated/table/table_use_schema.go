//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package table

// UseSchema sets a new schema name for all generated table SQL builder types. It is recommended to invoke
// this method only once at the beginning of the program.
func UseSchema(schema string) {
	AiApiCallLogs = AiApiCallLogs.FromSchema(schema)
	AiChat = AiChat.FromSchema(schema)
	AiChatMessage = AiChatMessage.FromSchema(schema)
	AiChatMessageVote = AiChatMessageVote.FromSchema(schema)
	AiChatSuggestions = AiChatSuggestions.FromSchema(schema)
	ApiKey = ApiKey.FromSchema(schema)
	Campaign = Campaign.FromSchema(schema)
	CampaignList = CampaignList.FromSchema(schema)
	CampaignTag = CampaignTag.FromSchema(schema)
	Contact = Contact.FromSchema(schema)
	ContactList = ContactList.FromSchema(schema)
	ContactListContact = ContactListContact.FromSchema(schema)
	ContactListTag = ContactListTag.FromSchema(schema)
	Conversation = Conversation.FromSchema(schema)
	ConversationAssignment = ConversationAssignment.FromSchema(schema)
	ConversationTag = ConversationTag.FromSchema(schema)
	Integration = Integration.FromSchema(schema)
	Message = Message.FromSchema(schema)
	Notification = Notification.FromSchema(schema)
	NotificationReadLog = NotificationReadLog.FromSchema(schema)
	Organization = Organization.FromSchema(schema)
	OrganizationIntegration = OrganizationIntegration.FromSchema(schema)
	OrganizationMember = OrganizationMember.FromSchema(schema)
	OrganizationMemberInvite = OrganizationMemberInvite.FromSchema(schema)
	OrganizationRole = OrganizationRole.FromSchema(schema)
	RoleAssignment = RoleAssignment.FromSchema(schema)
	Tag = Tag.FromSchema(schema)
	TrackLink = TrackLink.FromSchema(schema)
	TrackLinkClick = TrackLinkClick.FromSchema(schema)
	User = User.FromSchema(schema)
	WhatsappBusinessAccount = WhatsappBusinessAccount.FromSchema(schema)
}
