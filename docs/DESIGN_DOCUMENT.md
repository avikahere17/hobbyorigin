# HobbyOrigin — Design Document
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft for Stakeholder Review  
**Authors:** HobbyOrigin Engineering & Design Team

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  React Web App  │  │  React Native /  │                  │
│  │  (port 3000)    │  │  Expo Mobile App │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │  HTTP / WebSocket  │  HTTP / WebSocket           │
└───────────┼───────────────────┼────────────────────────────-┘
            │                   │
┌───────────▼───────────────────▼──────────────────────────────┐
│                    API GATEWAY / SERVER                       │
│  Node.js + Express + Apollo Server 4                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ HTTP GraphQL │  │  WebSocket   │  │  Session Reminder   │ │
│  │   Endpoint   │  │   (graphql-  │  │  Scheduler (5-min)  │ │
│  │  :4000/gql   │  │   ws)        │  │                     │ │
│  └──────────────┘  └──────────────┘  └─────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  In-Process PubSub (asyncIterableIterator)               ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────┬───────────────────────────────────-┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                      DATA LAYER                               │
│  SQLite (better-sqlite3, WAL mode)                            │
│  hobbyorigin.db                                              │
│  ┌──────┐ ┌────────┐ ┌───────────────┐ ┌───────────────────┐ │
│  │users │ │groups  │ │group_members  │ │messages           │ │
│  └──────┘ └────────┘ └───────────────┘ └───────────────────┘ │
│  ┌───────────────┐ ┌────────────────┐                         │
│  │notifications  │ │buddy_requests  │                         │
│  └───────────────┘ └────────────────┘                         │
└──────────────────────────────────────────────────────────────-┘
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Web frontend | React 18 + Apollo Client 3 | Component model, GraphQL cache, real-time subscriptions |
| Mobile frontend | React Native (Expo) + Apollo Client | Code sharing with web; cross-platform |
| API server | Node.js + Apollo Server 4 + Express | GraphQL-first; same language across stack |
| Transport (queries/mutations) | HTTP/1.1 POST to `/graphql` | Standard; cacheable with Apollo InMemoryCache |
| Transport (subscriptions) | WebSocket via `graphql-ws` | Low-latency; auto-reconnect |
| Database | SQLite (`better-sqlite3`) | Zero-ops for prototype; WAL for concurrent reads |
| Auth | JWT (jsonwebtoken) + bcrypt | Stateless; 30-day tokens |
| Payments (v2) | Stripe Connect | Marketplace payments; tutor payouts |
| Media storage (v2) | AWS S3 + CloudFront | Scalable blob storage |
| Email (v2) | SendGrid | Transactional + campaign email |
| Video (v2) | Daily.co WebRTC SDK | Embedded video for virtual events |

---

## 3. Database Schema

### 3.1 users
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| name | TEXT | Display name |
| email | TEXT UNIQUE | Login credential |
| password | TEXT | bcrypt hash |
| bio | TEXT | Optional |
| interests | TEXT | JSON array e.g. `["Art","Reading"]` |
| avatar_color | TEXT | Hex colour |
| age | INTEGER | Used to derive age_group |
| age_group | TEXT | KIDS/TEENS/ADULTS/SENIORS |
| theme | TEXT | PLAYFUL/STANDARD/ACCESSIBLE |
| building | TEXT | Premises-level location |
| neighborhood | TEXT | Area-level location |
| city | TEXT | City |
| country | TEXT | Country |
| language | TEXT | ISO 639-1 code |
| notification_prefs | TEXT | JSON `{"session_reminder":true,...}` |
| created_at | TEXT | ISO 8601 timestamp |

### 3.2 groups
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| name | TEXT | Group display name |
| description | TEXT | |
| category | TEXT | Art, Music, Gaming, etc. |
| tags | TEXT | JSON array |
| max_members | INTEGER | Capacity cap |
| creator_id | TEXT FK→users | |
| age_groups | TEXT | JSON array of eligible age groups |
| building/neighborhood/city/country | TEXT | Location hierarchy |
| schedule_day | TEXT | Monday–Sunday |
| schedule_time | TEXT | HH:MM (24h) |
| schedule_frequency | TEXT | Weekly/Fortnightly/Monthly |
| schedule_duration | INTEGER | Minutes |
| created_at | TEXT | |

### 3.3 group_members
| Column | Type | Notes |
|--------|------|-------|
| group_id | TEXT FK→groups | Composite PK |
| user_id | TEXT FK→users | Composite PK |
| joined_at | TEXT | |

### 3.4 messages
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| content | TEXT | |
| sender_id | TEXT FK→users | |
| group_id | TEXT FK→groups | |
| created_at | TEXT | |

### 3.5 notifications
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| user_id | TEXT FK→users | Recipient |
| type | TEXT | SESSION_REMINDER / NEW_MEMBER / BUDDY_REQUEST |
| title | TEXT | Short heading |
| message | TEXT | Body |
| is_read | INTEGER | 0/1 boolean |
| group_id | TEXT | Related group (nullable) |
| actor_id | TEXT | Who triggered it (nullable) |
| scheduled_for | TEXT | For session reminders |
| created_at | TEXT | |

### 3.6 buddy_requests
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| from_id | TEXT FK→users | |
| to_id | TEXT FK→users | |
| status | TEXT | pending / accepted / rejected |
| created_at | TEXT | |

---

## 4. GraphQL Schema (Key Types)

```graphql
enum AgeGroup { KIDS TEENS ADULTS SENIORS }
enum Theme { PLAYFUL STANDARD ACCESSIBLE }

type User {
  id: ID!; name: String!; email: String!; bio: String
  interests: [String!]!; avatarColor: String!
  age: Int; ageGroup: AgeGroup!; theme: Theme!
  location: Location; joinedGroups: [Group!]!
  unreadCount: Int!
}

type Group {
  id: ID!; name: String!; description: String!
  category: String!; tags: [String!]!
  maxMembers: Int!; memberCount: Int!; isOpen: Boolean!
  members: [User!]!; creator: User!; isMember: Boolean!
  messages: [Message!]!; ageGroups: [AgeGroup!]!
  location: Location; schedule: Schedule
}

type FolkResult {
  user: User!; sharedInterests: [String!]!
  proximity: String!; buddyStatus: String
}

type Notification {
  id: ID!; type: String!; title: String!; message: String!
  isRead: Boolean!; groupId: ID; createdAt: String!
}

type Query {
  me: User; groups(...): [Group!]!; group(id:ID!): Group
  user(id:ID!): User; findFolks(...): [FolkResult!]!
  myNotifications: [Notification!]!
}

type Mutation {
  register(...): AuthPayload!; login(...): AuthPayload!
  updateProfile(...): User!; createGroup(...): Group!
  joinGroup(groupId:ID!): Group!; leaveGroup(groupId:ID!): Group!
  sendMessage(groupId:ID!, content:String!): Message!
  sendBuddyRequest(toUserId:ID!): Boolean!
  markNotificationsRead: Boolean!
}

type Subscription {
  messageSent(groupId:ID!): Message!
  groupMemberChanged(groupId:ID!): Group!
  notificationReceived: Notification!
}
```

---

## 5. Authentication & Security

### 5.1 Auth Flow
1. Client calls `register` or `login` mutation → server returns `{ token, user }`
2. Token stored in `localStorage` (web) or `expo-secure-store` (mobile)
3. Every request includes `Authorization: Bearer <token>` header
4. Apollo auth link injects header automatically
5. Server middleware (`jsonwebtoken.verify`) decodes token → sets `context.user`
6. Protected resolvers call `requireAuth(context.user)` — throws `UNAUTHENTICATED` if missing

### 5.2 Security Controls
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT secret from environment variable (`JWT_SECRET`); never hardcoded in production
- SQL injection prevented: `better-sqlite3` parameterised queries throughout
- Group capacity enforced server-side; cannot be bypassed client-side
- Under-13 users: parent approval gate (v2); building-only discovery by default (v2)
- HTTPS enforced in production (TLS termination at load balancer)

---

## 6. Real-Time Architecture

### 6.1 PubSub
A minimal in-process pub/sub is implemented using async generators:

```
Mutation (e.g. sendMessage)
  → pubsub.publish(`MESSAGE_SENT_${groupId}`, payload)
    → asyncIterableIterator yields to all subscribed clients
      → Apollo Client subscription hook updates component state
```

### 6.2 Subscription Channels
| Channel | Triggered by | Subscribers |
|---------|-------------|-------------|
| `MESSAGE_SENT_${groupId}` | `sendMessage` | All group members |
| `GROUP_MEMBER_CHANGED_${groupId}` | `joinGroup`, `leaveGroup` | All group members |
| `NOTIFICATION_${userId}` | Any notification-creating mutation | Single user |

### 6.3 Session Reminder Scheduler
- Runs `setInterval` every 5 minutes on server startup
- Iterates all groups with a schedule; calculates `nextSession`
- If next session is 55–65 minutes away → creates notification + publishes to `NOTIFICATION_${userId}`
- Respects per-user `notification_prefs.session_reminder` flag

---

## 7. Frontend Architecture

### 7.1 Web (React)
```
src/
  apollo.js          — Apollo Client; split link (HTTP + WebSocket)
  context/
    AuthContext.js   — JWT storage; user state; theme application
  graphql/
    index.js         — All GQL operations (queries, mutations, subscriptions)
  components/
    Navbar.js        — Notification bell; profile dropdown; auth links
    AuthModal.js     — 2-step registration; login form
    GroupCard.js     — Category colour bar; schedule pill; age badges
    CreateGroupModal.js — 2-step group creation with location & schedule
  pages/
    Home.js          — Group browser; Near Me toggle; age-personalised hero
    GroupDetail.js   — Chat; member list; join/leave; real-time updates
    Profile.js       — Bio; interests chips; location; theme selector
    FindFolks.js     — Proximity search; buddy requests; folk cards
    Notifications.js — Notification list; mark all read; type icons
```

### 7.2 Age-Adaptive Theming
CSS custom properties are scoped under three body classes:

| Theme class | Target audience | Background | Font size | Border radius | Tone |
|-------------|----------------|-----------|-----------|---------------|------|
| `.theme-PLAYFUL` | Kids (≤12) | Light purple `#fdf4ff` | 18px | 20px | Colourful, emoji-rich |
| `.theme-STANDARD` | Teens + Adults | Dark `#0d0d1a` | 15px | 12px | Professional, dark |
| `.theme-ACCESSIBLE` | Seniors (60+) | Light grey `#f0f4f8` | 20px | 8px | High contrast, large text |

Theme switches automatically on login, profile update, and logout (reset to STANDARD).

### 7.3 Apollo Cache Strategy
- `Group.messages`: `merge: false` (always replace, never append duplicates)
- `Group.members`: `merge: false`
- `InMemoryCache` with field policies; `refetchQueries` on profile updates

---

## 8. Mobile Architecture (Expo)

- React Navigation: bottom-tab + native-stack
- JWT in `expo-secure-store` (hardware-backed encryption)
- Same GraphQL operations mirrored in `src/graphql.js`
- `SERVER_HOST` configured in `src/apollo.js` (LAN IP for physical device)
- WebSocket link: `ws://<SERVER_HOST>:4000/graphql`

---

## 9. Scalability Path

| Phase | Infrastructure | Notes |
|-------|---------------|-------|
| Prototype | SQLite + single Node.js process | Current |
| Beta (10k users) | PostgreSQL + Node.js cluster | Replace better-sqlite3 with pg |
| Growth (100k users) | PostgreSQL + Redis PubSub + load balancer | Redis replaces in-process PubSub |
| Scale (1M+ users) | Microservices + managed Postgres + CDN | Auth, chat, notifications as separate services |

---

## 10. Future Feature Technical Notes

### 10.1 Tip/Payment Flow (v2)
- Stripe Connect for marketplace payouts
- Tutor creates Stripe account; platform creates PaymentIntent
- Platform fee: configurable % deducted before payout
- Parent wallet: Stripe stored payment method; child triggers tip → parent approves

### 10.2 Virtual Events (v2)
- Daily.co SDK embedded in GroupDetail for live video
- Event `status` field: UPCOMING / LIVE / ENDED
- Recording stored to S3; replay accessible to group members

### 10.3 Campaign Management (v2)
- `campaigns` table: id, club_id, type, target_audience (JSON), budget, start/end dates
- Campaign email: SendGrid template API
- Analytics: open rate, click rate, conversion (join / purchase)

### 10.4 Club Commerce (v2)
- `products` table: id, club_id, name, description, price, stock, image_url
- `orders` table: id, product_id, buyer_id, quantity, status, stripe_payment_id
- Club shop page rendered as a sub-route of group page

---

## 11. Testing Strategy

| Layer | Approach |
|-------|---------|
| Unit | Jest for resolver logic and DB helpers |
| Integration | Supertest for GraphQL HTTP endpoint |
| E2E | Playwright for critical paths (register → join group → send message) |
| Subscription | Mock WebSocket client; assert event delivery |
| Accessibility | axe-core automated scans on all three themes |
