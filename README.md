# 🔗 HobbyOrigin

> **Connect people of all ages around shared hobbies — in their own building, neighbourhood, and city.**

HobbyOrigin is an open-source community platform that bridges loneliness for kids, teens, adults, and seniors through hyper-local, interest-matched group discovery. Built as a full-stack prototype using React, GraphQL, and Node.js — with no prior coding experience, using AI-assisted development.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎨 **Age-adaptive themes** | PLAYFUL (kids ≤12), STANDARD (teens/adults), ACCESSIBLE (seniors 60+) — auto-applied on login |
| 📍 **Hyper-local discovery** | Find people in your building, neighbourhood, or city |
| 👥 **Groups & real-time chat** | Create/join groups with capacity limits, schedules & live WebSocket chat |
| 🤝 **Find Folks** | Proximity + interest-scored user matching with buddy requests |
| 🎪 **Virtual Events** | Schedule live sessions, manage registrations, share video links |
| 🛍️ **Club Shop** | Sell physical & digital products within your group |
| 📢 **Campaigns** | Launch audience-targeted marketing campaigns for your group |
| ⭐ **Tutor Tips** | Reward tutors and creators with in-app coin tips |
| 👨‍👩‍👧 **Parental Controls** | Link child accounts, manage wallets, gift coins |
| 🔔 **Smart Notifications** | Session reminders, member joins, buddy requests — real-time via subscriptions |

---

## 🏗️ Architecture

```
hobbyorigin/
├── server/      Node.js + Apollo Server 4 + GraphQL + SQLite
├── client/      React 18 + Apollo Client (web app)
├── mobile/      React Native + Expo (iOS & Android)
└── docs/        PRD, Design Document, Business Proposal
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (install via [nvm](https://github.com/nvm-sh/nvm))

### Server
```bash
cd server
npm install
npm start          # → http://localhost:4000/graphql
# or
npm run dev        # auto-restart on file changes
```

### Web Client
```bash
cd client
npm install
npm start          # → http://localhost:3000
```

### Mobile (Expo)
```bash
cd mobile
npm install
npx expo start     # scan QR code with Expo Go app
```

For a physical device, edit `mobile/src/apollo.js` and set `SERVER_HOST` to your LAN IP address.

---

## 🔑 Environment Variables (Server)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | HTTP & WebSocket port |
| `JWT_SECRET` | `hobbyorigin_secret_2024` | **Change before any production deployment** |

---

## 💼 Business Model

HobbyOrigin operates a 7-stream revenue model:

1. **Kids Contribution Wallet** — 5% on parent top-ups; 10% on tutor tips
2. **Tutor Tips & Awards** — 10% commission + £9.99/mo premium plan
3. **Club Memberships** — 8% of subscription revenue
4. **Marketing Campaigns** — CPM credits + managed packages
5. **Club Product Sales** — 12% commission on GMV
6. **Virtual Events** — ticket commission + marketing bundles
7. **Mentorship & Sponsorship** — institutional packages for councils/charities

**Year 1 projection: £670k revenue | Year 3: £9.8M**

See [`docs/BUSINESS_PROPOSAL.md`](docs/BUSINESS_PROPOSAL.md) for the full investor pitch.

---

## 📄 Documents

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
- [`docs/DESIGN_DOCUMENT.md`](docs/DESIGN_DOCUMENT.md) — Technical Design Document
- [`docs/BUSINESS_PROPOSAL.md`](docs/BUSINESS_PROPOSAL.md) — Investor Business Proposal

---

## 🛡️ Security Notes

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 30 days
- All GraphQL resolvers enforce authentication via `requireAuth()`
- SQLite uses parameterised queries — no SQL injection surface
- GDPR/COPPA compliance considerations documented in PRD

---

## 🗺️ Roadmap

| Quarter | Milestone |
|---|---|
| Q3 2026 | v1.0 launch — groups, chat, find folks, notifications |
| Q4 2026 | Stripe payments, tutor tips, parental controls, virtual events |
| Q1 2027 | Club commerce, campaign analytics, product sales |
| Q2 2027 | Native iOS/Android apps; AI-powered group recommendations |
| Q3 2027 | Multi-language localisation; council & charity partnerships |

---

## 🤝 Investment

We are raising **£1.5M Seed** on a SAFE at **£8M valuation cap**, 20% discount.

📩 **hello@hobbyorigin.community** | Subject: `Investor Enquiry`

---

## 📜 Licence

MIT — free to use, fork, and build upon. Attribution appreciated.

---

*Built with ❤️ using React, GraphQL, Node.js, and Claude (Anthropic AI)*
