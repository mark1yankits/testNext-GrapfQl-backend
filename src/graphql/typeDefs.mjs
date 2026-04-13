const typeDefs =`

    
    type User {
        id: ID!
        name: String!
        password: String!
        email: String!
        createdAt: String!
        updatedAt: String!
    }
    type ChatMember {
      chat_id: ID!
      user_id: ID!
      role: String!
      joined_at: String
      user: User
    }
    
    type Message {
      id: ID!
      chatId: ID!      
      userId: ID!    
      text: String!    
      createdAt: String! 
      is_read: Boolean
      user: User
    }

    type Chat{
     id: ID!
     name: String!
     description: String
     owner_id: ID!
     createdAt: String!
     members: [ChatMember!]!
    }
        
    type Subscription {
        chatCreated: Chat!
        messageSent(chatId: ID!): Message!
    }
    type Query {
        me: User
        chats: [Chat!]!
        chat(id: ID!): Chat
        users: [User!]!
        messages(chatId: ID!): [Message!]!
    }

    type AuthPayload {
        success: Boolean!
        token: String
        user: User
        error: String
    }
    type Mutation {
        login(email: String!, password: String!): AuthPayload  
        register(name: String!, email: String!, password: String!): AuthPayload 
        updateUser(name: String, email: String, password: String): AuthPayload
        createChat(name: String!, description: String, memberIds: [ID!]!): Chat!
        createMessage(chatId: ID!, text: String!): Message!
    }
`;

export default typeDefs;