const typeDefs =`
    type Query {
        me: User
    }
    
    type User {
        id: ID!
        name: String!
        password: String!
        email: String!
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
    }
`;

export default typeDefs;