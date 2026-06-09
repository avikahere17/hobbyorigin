import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { typeDefs } from './schema.js';
import { resolvers, scheduleReminders } from './resolvers.js';
import { getUser } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hobbyorigin_secret_2024';
const PORT = process.env.PORT || 4000;

class PubSub {
  constructor() { this.subs = {}; }
  asyncIterableIterator(event) {
    const queue = []; let resolve = null;
    const push = v => { if (resolve) { resolve({ value: v, done: false }); resolve = null; } else queue.push(v); };
    if (!this.subs[event]) this.subs[event] = [];
    this.subs[event].push(push);
    const cleanup = () => { this.subs[event] = (this.subs[event]||[]).filter(s=>s!==push); };
    return {
      [Symbol.asyncIterator]() { return this; },
      next() { return new Promise(r => { if (queue.length) r({ value: queue.shift(), done: false }); else resolve = r; }); },
      return() { cleanup(); return Promise.resolve({ value: undefined, done: true }); },
    };
  }
  publish(event, payload) { (this.subs[event]||[]).forEach(p=>p(payload)); }
}

function getUserFromToken(token) {
  if (!token) return null;
  try { const { userId } = jwt.verify(token, JWT_SECRET); return getUser(userId); } catch { return null; }
}

async function main() {
  const app = express();
  const httpServer = createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const pubsub = new PubSub();

  scheduleReminders(pubsub);

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({
    schema,
    context: ctx => {
      const token = ctx.connectionParams?.Authorization?.replace('Bearer ','') || '';
      return { user: getUserFromToken(token), pubsub };
    },
  }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      { async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; } },
    ],
  });
  await server.start();

  app.use('/graphql', cors({ origin: '*', credentials: true }), bodyParser.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      const token = (req.headers.authorization||'').replace('Bearer ','');
      return { user: getUserFromToken(token), pubsub };
    },
  }));

  httpServer.listen(PORT, () => {
    console.log(`🚀 HobbyOrigin server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket ready at ws://localhost:${PORT}/graphql`);
    console.log(`⏰ Session reminder scheduler active`);
  });
}

main().catch(console.error);
