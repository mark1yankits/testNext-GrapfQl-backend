import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema'; // ДОДАНО

import typeDefs from './graphql/typeDefs.mjs'; 
import resolvers from './graphql/resolvers.mjs';

async function startServer() {
  const PORT = 4000;
  const app = express(); 
  const httpServer = http.createServer(app); 

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql', 
  });

  const serverCleanup = useServer({ 
    schema,
    context: async (ctx) => {
       const authHeader = ctx.connectionParams?.Authorization || ctx.connectionParams?.authorization;
       const token = authHeader?.replace('Bearer ', '');
       
       if (token) {
         try {
           const decoded = jwt.verify(token, process.env.JWT_SECRET);
           return { user: { id: decoded.userId, email: decoded.email } };
         } catch (e) {
           return {};
         }
       }
       return {};
    }
  }, wsServer);

  const server = new ApolloServer({
    schema, 
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          return {
            user: { id: decoded.userId, email: decoded.email }
          };
        } catch (error) {
          console.error('Помилка токену:', error.message);
          return {};
        }
      }
      return {};
    }
  }));
  console.log(`🚀 Server ready at http://localhost:${PORT}`);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch(err => console.error("Помилка при запуску:", err));