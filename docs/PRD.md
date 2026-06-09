# HobbyOrigin — Product Requirements Document (PRD)
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft for Stakeholder Review  
**Owner:** HobbyOrigin Product Team

---

## 1. Executive Summary

HobbyOrigin is a community platform designed to connect people of all ages — children, teens, adults, and seniors — around shared hobbies, interests, and local activities. It is built with accessibility and personalisation at its core: every user experience adapts to age group, interests, and location (down to building or premises level).

The platform uniquely bridges the gap between digital community and local physical community, enabling group formation, real-time chat, skill sharing, tutoring, mentorship, virtual events, and a monetisation ecosystem that benefits creators, tutors, parents, and club organisers.

---

## 2. Problem Statement

- **Kids and teens** are increasingly isolated; despite social media saturation, meaningful real-world hobby connections are scarce.
- **Senior citizens** face loneliness and technological barriers that prevent participation in hobby communities.
- **Parents** lack tools to manage, monitor, and monetise their children's creative and educational group participation safely.
- **Tutors, mentors, and specialists** have no lightweight platform to offer sessions within local community settings and be fairly rewarded.
- **Community clubs and interest groups** lack affordable, integrated tools for membership, scheduling, campaigns, event management, and commerce.

---

## 3. Goals and Success Metrics

| Goal | Key Metric | Target (Year 1) |
|------|-----------|-----------------|
| Community growth | Monthly Active Users | 50,000 MAU |
| Engagement | Sessions per user per week | 3+ sessions |
| Retention | Day-30 retention | ≥ 40% |
| Monetisation | GMV (Gross Merchandise Value) | £500k |
| Inclusion | % users under 16 or over 60 | ≥ 35% |
| Events | Virtual events hosted per month | 500+ |

---

## 4. User Personas

### 4.1 Maya — The Creative Kid (Age 10)
- Loves drawing and chess; attends an after-school club
- Feels left out when friends don't share her interests
- Needs a safe, colourful, easy interface; parents approve all connections
- Value: finding peers nearby who share her interests

### 4.2 Arun — The Engaged Parent (Age 42)
- Two children (ages 8 and 13); wants structured, monitored hobby enrichment
- Willing to pay for quality tutoring and curated group content
- Needs dashboard to approve connections, manage spending, and see activity
- Value: safe environment + ability to reward/support tutors their kids love

### 4.3 George — The Retired Hobbyist (Age 68)
- Avid gardener and reader; recently widowed, seeks social connection
- Low digital literacy; needs large text, simple navigation, high contrast
- Value: meeting neighbours with shared interests; attending local group sessions

### 4.4 Priya — The Specialist Tutor (Age 35)
- Teaches creative writing; wants flexible income from hobby tutoring
- Already runs a WhatsApp group of 20 students but has no payment or scheduling infrastructure
- Value: tool to manage her student group, collect tips, run paid sessions, sell worksheets

### 4.5 The Elm Court Residents Club (Organisation)
- 120-household building community; runs pottery, yoga, and book clubs
- Needs: member management, session scheduling, event promotion, product sales (e.g. pottery kits)
- Value: one platform for all club operations with campaign tools built in

---

## 5. Core Features (v1.0)

### 5.1 Profile & Personalisation
- Age-aware theme: PLAYFUL (kids ≤12), STANDARD (teens/adults), ACCESSIBLE (seniors 60+)
- Interest selection from a curated list (20+ categories)
- Location hierarchy: building → neighbourhood → city → country
- Age group badges; language preference

### 5.2 Group Discovery & Management
- Browse and filter groups by category, age group, location, and schedule
- "Near Me" toggle — filters by user's building or city
- Group capacity enforcement; creator auto-joins as member
- Group scheduling: day, time, frequency, duration with session reminders

### 5.3 Find Folks
- Proximity-based user matching (building=3pts, city=1pt) + interest overlap scoring
- Age group filter; buddy request system
- Proximity badge per matched user (building / neighbourhood / city)

### 5.4 Real-Time Chat
- GraphQL subscriptions over WebSocket
- Messages persist (last 80 per group); sender avatar and name
- Members-only access enforcement

### 5.5 Notifications
- Types: SESSION_REMINDER, NEW_MEMBER, BUDDY_REQUEST
- Delivered in-app with real-time push via subscription
- Per-user notification preferences (opt-out per type)

### 5.6 Tutoring & Mentorship Sessions
- Tutors can create specialist groups with a session schedule and capacity cap
- Attendees can send tips (in-app virtual currency or real payment via Stripe)
- Tutor profile shows speciality, average rating, total tips earned
- Volunteer mentors can offer free sessions; platform surfaces these for kids/seniors

### 5.7 Virtual Hosted Events
- Scheduled live group sessions (video via embedded WebRTC or Zoom link)
- Event landing page with registration, description, capacity, and marketing banner
- Marketing campaign creation: share link, social card generator, reminder broadcast

### 5.8 Club Commerce & Product Sales
- Clubs can list physical or digital products (kits, PDFs, printables) in a Club Shop
- Stripe-powered checkout; fulfilment managed by club organiser
- Club can set a membership subscription fee (monthly/annual)

### 5.9 Campaign & Service Management for Clubs
- Campaign builder: title, goal (awareness / sign-ups / donations), dates, target audience (age group, city)
- Service listings: clubs can advertise services (e.g. "Pottery Taster Session — £12")
- Booking flow with calendar integration and confirmation notification

### 5.10 Parental Controls & Kids' Monetisation
- Parent account linked to child profiles (approval required for all connections)
- Parent can allocate a "contribution wallet" — virtual coins a child earns by participating
- Coins redeemable for platform credits, or donated to a charity of choice
- Parent can tip tutors directly on behalf of their child
- Parental dashboard: activity log, spending summary, pending approvals

---

## 6. Non-Functional Requirements

| Area | Requirement |
|------|------------|
| Performance | Page load < 2s; WebSocket message latency < 200ms |
| Accessibility | WCAG 2.1 AA for ACCESSIBLE theme; keyboard navigable |
| Security | JWT auth (30-day expiry); bcrypt password hashing; parent approval gate for under-13s |
| Scalability | Horizontally scalable Node.js server; SQLite → PostgreSQL migration path |
| Data Privacy | GDPR compliant; COPPA compliant for under-13 users; no PII in URLs |
| Availability | 99.5% uptime SLA |

---

## 7. Out of Scope (v1.0)

- Native iOS/Android apps (mobile web + Expo prototype only)
- AI content moderation (manual reporting + moderation queue in v1.0)
- Cryptocurrency payments
- Direct messaging (buddy requests only, no private chat in v1.0)

---

## 8. Roadmap

| Quarter | Milestone |
|---------|-----------|
| Q3 2026 | v1.0 launch: core groups, chat, find folks, notifications |
| Q4 2026 | Tutoring tips, parental controls, virtual events |
| Q1 2027 | Club commerce, campaign management, product sales |
| Q2 2027 | Native mobile apps; AI-assisted group recommendations |
| Q3 2027 | Multi-language localisation; expanded partner integrations |

---

## 9. Dependencies

- **Stripe** — payment processing for tips, subscriptions, product sales
- **WebRTC / Zoom SDK** — virtual event video hosting
- **SendGrid** — email notifications and campaign broadcast
- **AWS S3** — media/asset storage (product images, marketing banners)
- **Expo** — mobile prototype delivery

---

## 10. Open Questions

1. Should under-13 users be restricted to building/neighbourhood-only discovery (not city-wide)?
2. What is the tip/commission split between tutor and platform?
3. Do we partner with existing community centre networks for launch?
4. What moderation infrastructure is required before opening to the public?
