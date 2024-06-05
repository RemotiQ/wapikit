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
	Campaign = Campaign.FromSchema(schema)
	CampaignTag = CampaignTag.FromSchema(schema)
	Contact = Contact.FromSchema(schema)
	ContactList = ContactList.FromSchema(schema)
	ContactListContact = ContactListContact.FromSchema(schema)
	ContactListTag = ContactListTag.FromSchema(schema)
	Conversation = Conversation.FromSchema(schema)
	ConversationTag = ConversationTag.FromSchema(schema)
	Message = Message.FromSchema(schema)
	MessageReply = MessageReply.FromSchema(schema)
	Organisation = Organisation.FromSchema(schema)
	OrganisationMember = OrganisationMember.FromSchema(schema)
	Tag = Tag.FromSchema(schema)
	TrackLink = TrackLink.FromSchema(schema)
	TrackLinkClick = TrackLinkClick.FromSchema(schema)
	WhatsappBusinessAccount = WhatsappBusinessAccount.FromSchema(schema)
	WhatsappBusinessAccountPhoneNumber = WhatsappBusinessAccountPhoneNumber.FromSchema(schema)
}
