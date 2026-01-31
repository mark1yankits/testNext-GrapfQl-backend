import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import typeDefs from './graphql/typeDefs.mjs'; 
import resolvers from './graphql/resolvers.mjs';

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  await server.start();


  app.use(cors())
  app.use(express.json())

  app.use('/graphql', expressMiddleware(server));


  app.listen(4000, () => {
    console.log('Server is running on port 4000');
  });
}

startServer();