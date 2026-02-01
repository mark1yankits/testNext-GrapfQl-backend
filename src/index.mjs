import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config'; // ДОДАЙТЕ ЦЕ!
import typeDefs from './graphql/typeDefs.mjs'; 
import resolvers from './graphql/resolvers.mjs';
import jwt from 'jsonwebtoken';

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  await server.start();

  app.use(cors())
  app.use(express.json())

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          return {
            user: {
              id: decoded.userId,
              email: decoded.email
            }
          };
        } catch (error) {
          console.error('Помилка декодування токену:', error.message);
          return {};
        }
      }
      
      return {};
    }
  }));

  app.listen(4000, () => {
    console.log('Server is running on port 4000');
  });
}

startServer();