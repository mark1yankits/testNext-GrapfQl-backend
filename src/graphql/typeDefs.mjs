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
    }
    type Query {
        me: User
        chats: [Chat!]!
        chat(id: ID!): Chat
        users: [User!]!
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
    }
`;

export default typeDefs;