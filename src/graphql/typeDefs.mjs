const typeDefs =`
    type Query {
        me: User
        chats: [Chat!]!
    }
    
    type User {
        id: ID!
        name: String!
        password: String!
        email: String!
        createdAt: String!
        updatedAt: String!
    }

    type Chat{
     id: ID!
     name: String!
     description: String
     ownerid: ID!
     createdAt: String!
    }
        
    type Subscription {
        chatCreated: Chat!
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
        createChat(name: String!, description: String): Chat
        updateUser(name: String, email: String, password: String): AuthPayload
    }
`;

export default typeDefs;