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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { typeDefs } from './schema.js';
import { resolvers, scheduleReminders } from './resolvers.js';
import { getUser, initDB } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hobbyorigin_secret_2024';
const PORT = process.env.PORT || 4000;

// Allowed origins: local dev + production domains
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://hobbyorigin.com',
  'https://www.hobbyorigin.com',
  'https://app.hobbyorigin.com',
  'https://hobbyorigin-app.netlify.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

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

async function getUserFromToken(token) {
  if (!token) return null;
  try { const { userId } = jwt.verify(token, JWT_SECRET); return await getUser(userId); } catch { return null; }
}

async function main() {
  // Connect to PostgreSQL and create tables if they don't exist
  await initDB();

  const app = express();
  const httpServer = createServer(app);

  // ── Security headers (GDPR/CPRA: data minimisation, XSS, clickjacking) ──
  app.use(helmet({
    contentSecurityPolicy: false,   // Apollo Studio needs this disabled; tighten in prod with specific directives
    crossOriginEmbedderPolicy: false,
  }));
  app.set('trust proxy', 1); // Required for rate-limit behind Render/Netlify proxies

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Strict limiter for auth mutations (login/register) — brute-force protection
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { errors: [{ message: 'Too many requests — please wait 15 minutes before trying again.' }] },
  });
  // General API limiter
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 300,                   // 300 requests/min per IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/graphql', apiLimiter);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const pubsub = new PubSub();

  scheduleReminders(pubsub);

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({
    schema,
    context: async ctx => {
      const token = ctx.connectionParams?.Authorization?.replace('Bearer ','') || '';
      return { user: await getUserFromToken(token), pubsub };
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

  // Apply strict rate limit to auth operations at HTTP level
  app.use('/graphql', (req, res, next) => {
    const body = req.body || {};
    const op = body.operationName || '';
    if (['Login', 'Register'].includes(op)) return authLimiter(req, res, next);
    next();
  });

  app.use('/graphql', cors({
    origin: (origin, cb) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }), bodyParser.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      const token = (req.headers.authorization||'').replace('Bearer ','');
      return { user: await getUserFromToken(token), pubsub };
    },
  }));

  httpServer.listen(PORT, () => {
    console.log(`🚀 HobbyOrigin server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket ready at ws://localhost:${PORT}/graphql`);
    console.log(`⏰ Session reminder scheduler active`);
  });
}

main().catch(console.error);
