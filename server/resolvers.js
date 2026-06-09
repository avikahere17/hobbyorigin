import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import {
  getUser, getUserByEmail, createUser, updateUser, findFolks,
  getGroup, getGroups, createGroup, getGroupMembers, getMemberCount, isMember, joinGroup, leaveGroup, getUserGroups,
  getGroupMessages, createMessage,
  createNotification, getUserNotifications, markNotificationsRead, getUnreadCount, getBuddyStatus, sendBuddyRequest,
  sendTip as dbSendTip, getTipsTotal,
  createEvent, getEvent, getGroupEvents, registerForEvent as dbRegisterForEvent, unregisterFromEvent as dbUnregisterFromEvent, getEventRegistrationCount, isRegisteredForEvent,
  createProduct, getGroupProducts,
  createCampaign, getGroupCampaigns,
  getWallet, addCoins, linkParentChild, getChildren,
} from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hobbyorigin_secret_2024';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#14b8a6','#06b6d4','#84cc16','#eab308','#ef4444','#10b981'];

function requireAuth(user) {
  if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
}

function ageToGroup(age) {
  if (!age) return 'ADULTS';
  if (age <= 12) return 'KIDS';
  if (age <= 17) return 'TEENS';
  if (age <= 59) return 'ADULTS';
  return 'SENIORS';
}

function ageGroupToTheme(ageGroup) {
  if (ageGroup === 'KIDS') return 'PLAYFUL';
  if (ageGroup === 'SENIORS') return 'ACCESSIBLE';
  return 'STANDARD';
}

function nextSession(g) {
  if (!g.scheduleDay || !g.scheduleTime) return null;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const targetDay = days.indexOf(g.scheduleDay);
  if (targetDay === -1) return null;
  const [h, m] = g.scheduleTime.split(':').map(Number);
  const now = new Date();
  let next = new Date();
  next.setHours(h, m, 0, 0);
  const diff = (targetDay - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + (diff === 0 && next <= now ? 7 : diff));
  return next.toISOString();
}

function resolveGroup(g, userId) {
  if (!g) return null;
  const members = getGroupMembers(g.id);
  const count = getMemberCount(g.id);
  return {
    ...g,
    memberCount: count,
    members: members.map(resolveUser),
    isOpen: count < g.maxMembers,
    isMember: userId ? isMember(g.id, userId) : false,
    creator: resolveUser(getUser(g.creatorId)),
    messages: getGroupMessages(g.id),
    location: { building: g.building, neighborhood: g.neighborhood, city: g.city, country: g.country },
    schedule: g.scheduleDay ? {
      day: g.scheduleDay, time: g.scheduleTime,
      frequency: g.scheduleFrequency, duration: g.scheduleDuration,
      nextSession: nextSession(g),
    } : null,
    events: getGroupEvents(g.id).map(e => resolveEvent(e, userId)),
    products: getGroupProducts(g.id).map(resolveProduct),
    campaigns: getGroupCampaigns(g.id).map(resolveCampaign),
  };
}

function resolveUser(u) {
  if (!u) return null;
  return {
    ...u,
    location: { building: u.building||'', neighborhood: u.neighborhood||'', city: u.city||'', country: u.country||'' },
    joinedGroups: getUserGroups(u.id),
    unreadCount: getUnreadCount(u.id),
    tipsEarned: getTipsTotal(u.id),
    walletCoins: getWallet(u.id).coins,
    children: getChildren(u.id).map(c => resolveUser(c)),
  };
}

function resolveEvent(e, userId) {
  if (!e) return null;
  return {
    ...e,
    registrationCount: getEventRegistrationCount(e.id),
    isRegistered: userId ? isRegisteredForEvent(e.id, userId) : false,
    creator: resolveUser(getUser(e.creatorId)),
  };
}

function resolveProduct(p) {
  if (!p) return null;
  return { ...p, creator: resolveUser(getUser(p.creatorId)) };
}

function resolveCampaign(c) {
  if (!c) return null;
  return { ...c, creator: resolveUser(getUser(c.creatorId)) };
}

// ── Session reminder scheduler ────────────────────────────────────────────────
// Runs every 5 minutes, notifies group members 1h before a scheduled session
let _pubsub = null;
function scheduleReminders(pubsub) {
  _pubsub = pubsub;
  setInterval(() => {
    try {
      const groups = getGroups();
      const now = new Date();
      groups.forEach(g => {
        const ns = nextSession(g);
        if (!ns) return;
        const diff = (new Date(ns) - now) / 60000; // minutes
        if (diff >= 55 && diff <= 65) { // ~1 hour window
          const members = getGroupMembers(g.id);
          members.forEach(m => {
            const prefs = m.notificationPrefs || {};
            if (prefs.session_reminder === false) return;
            const id = uuid();
            createNotification({ id, userId: m.id, type: 'SESSION_REMINDER',
              title: `⏰ ${g.name} starts in 1 hour`,
              message: `Your group session is scheduled for ${g.scheduleTime} today. Don't miss it!`,
              groupId: g.id, scheduledFor: ns,
            });
            if (pubsub) pubsub.publish(`NOTIFICATION_${m.id}`, {
              notificationReceived: { id, type: 'SESSION_REMINDER', title: `⏰ ${g.name} starts in 1 hour`, message: `Session at ${g.scheduleTime}`, isRead: false, groupId: g.id, createdAt: new Date().toISOString() }
            });
          });
        }
      });
    } catch {}
  }, 5 * 60 * 1000);
}

export { scheduleReminders };

export const resolvers = {
  Query: {
    me: (_, __, { user }) => user ? resolveUser(user) : null,

    groups: (_, args, { user }) =>
      getGroups(args).map(g => resolveGroup(g, user?.id)),

    group: (_, { id }, { user }) => resolveGroup(getGroup(id), user?.id),

    user: (_, { id }) => resolveUser(getUser(id)),

    findFolks: (_, { interests = [], city, building, ageGroup }, { user }) => {
      requireAuth(user);
      const searchCity = city || user.city || null;
      const searchBuilding = building || null;
      const searchInterests = interests.length ? interests : (user.interests || []);
      const folks = findFolks({ interests: searchInterests, city: searchCity, building: searchBuilding, ageGroup, excludeId: user.id });
      return folks.map(f => {
        const shared = (user.interests || []).filter(i => f.interests.includes(i));
        let proximity = 'city';
        if (searchBuilding && f.building?.toLowerCase() === searchBuilding.toLowerCase()) proximity = 'building';
        const buddyStatus = getBuddyStatus(user.id, f.id);
        return { user: resolveUser(f), sharedInterests: shared, proximity, buddyStatus };
      });
    },

    myNotifications: (_, __, { user }) => {
      requireAuth(user);
      return getUserNotifications(user.id);
    },

    myWallet: (_, __, { user }) => { requireAuth(user); return getWallet(user.id); },

    groupEvents: (_, { groupId }, { user }) =>
      getGroupEvents(groupId).map(e => resolveEvent(e, user?.id)),

    groupProducts: (_, { groupId }) =>
      getGroupProducts(groupId).map(resolveProduct),

    groupCampaigns: (_, { groupId }) =>
      getGroupCampaigns(groupId).map(resolveCampaign),
  },

  Mutation: {
    register: async (_, { name, email, password, age, city, country, building, neighborhood }) => {
      if (getUserByEmail(email)) throw new GraphQLError('Email already in use');
      if (password.length < 6) throw new GraphQLError('Password must be at least 6 characters');
      const hashed = await bcrypt.hash(password, 10);
      const ageGroup = ageToGroup(age);
      const theme = ageGroupToTheme(ageGroup);
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const id = uuid();
      const user = createUser({ id, name, email, password: hashed, avatarColor: color, age: age || null, ageGroup, theme, createdAt: new Date().toISOString() });
      if (city || building) updateUser(id, { city: city||'', country: country||'', building: building||'', neighborhood: neighborhood||'' });
      const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
      return { token, user: resolveUser(getUser(id)) };
    },

    login: async (_, { email, password }) => {
      const row = getUserByEmail(email);
      if (!row || !await bcrypt.compare(password, row.password)) throw new GraphQLError('Invalid credentials');
      const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '30d' });
      return { token, user: resolveUser(getUser(row.id)) };
    },

    updateProfile: (_, args, { user }) => {
      requireAuth(user);
      const dbFields = { bio: args.bio, interests: args.interests, age: args.age, building: args.building, neighborhood: args.neighborhood, city: args.city, country: args.country, language: args.language };
      if (args.theme) dbFields.theme = args.theme;
      if (args.age) { dbFields.age_group = ageToGroup(args.age); }
      updateUser(user.id, dbFields);
      return resolveUser(getUser(user.id));
    },

    createGroup: (_, args, { user, pubsub }) => {
      requireAuth(user);
      if (args.maxMembers < 2 || args.maxMembers > 200) throw new GraphQLError('Max members must be 2–200');
      const id = uuid();
      createGroup({ id, ...args, tags: args.tags || [], ageGroups: args.ageGroups || ['KIDS','TEENS','ADULTS','SENIORS'], creatorId: user.id, createdAt: new Date().toISOString() });
      return resolveGroup(getGroup(id), user.id);
    },

    joinGroup: (_, { groupId }, { user, pubsub }) => {
      requireAuth(user);
      const group = getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (getMemberCount(groupId) >= group.maxMembers) throw new GraphQLError('Group is full');
      joinGroup(groupId, user.id);
      // Notify creator
      const notifId = uuid();
      createNotification({ id: notifId, userId: group.creatorId, type: 'NEW_MEMBER', title: `👋 ${user.name} joined ${group.name}`, message: `A new member just joined your group!`, groupId, actorId: user.id });
      if (pubsub) {
        const r = resolveGroup(getGroup(groupId), user.id);
        pubsub.publish(`GROUP_MEMBER_CHANGED_${groupId}`, { groupMemberChanged: r });
        pubsub.publish(`NOTIFICATION_${group.creatorId}`, { notificationReceived: { id: notifId, type: 'NEW_MEMBER', title: `👋 ${user.name} joined ${group.name}`, message: 'New member!', isRead: false, groupId, createdAt: new Date().toISOString() } });
      }
      return resolveGroup(getGroup(groupId), user.id);
    },

    leaveGroup: (_, { groupId }, { user, pubsub }) => {
      requireAuth(user);
      const group = getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId === user.id) throw new GraphQLError('Creator cannot leave their own group');
      leaveGroup(groupId, user.id);
      const r = resolveGroup(getGroup(groupId), user.id);
      if (pubsub) pubsub.publish(`GROUP_MEMBER_CHANGED_${groupId}`, { groupMemberChanged: r });
      return r;
    },

    sendMessage: (_, { groupId, content }, { user, pubsub }) => {
      requireAuth(user);
      if (!content.trim()) throw new GraphQLError('Message cannot be empty');
      if (!isMember(groupId, user.id)) throw new GraphQLError('Join the group first');
      const id = uuid();
      const msg = createMessage({ id, content: content.trim(), senderId: user.id, groupId, createdAt: new Date().toISOString() });
      const resolved = { ...msg, sender: getUser(user.id) };
      if (pubsub) pubsub.publish(`MESSAGE_SENT_${groupId}`, { messageSent: resolved });
      return resolved;
    },

    sendBuddyRequest: (_, { toUserId }, { user, pubsub }) => {
      requireAuth(user);
      const to = getUser(toUserId);
      if (!to) throw new GraphQLError('User not found');
      sendBuddyRequest({ id: uuid(), fromId: user.id, toId: toUserId, createdAt: new Date().toISOString() });
      const notifId = uuid();
      createNotification({ id: notifId, userId: toUserId, type: 'BUDDY_REQUEST', title: `🤝 ${user.name} wants to connect!`, message: `${user.name} sent you a buddy request.`, actorId: user.id });
      if (pubsub) pubsub.publish(`NOTIFICATION_${toUserId}`, { notificationReceived: { id: notifId, type: 'BUDDY_REQUEST', title: `🤝 ${user.name} wants to connect!`, message: `Buddy request`, isRead: false, createdAt: new Date().toISOString() } });
      return true;
    },

    markNotificationsRead: (_, __, { user }) => {
      requireAuth(user);
      markNotificationsRead(user.id);
      return true;
    },

    sendTip: (_, { toUserId, groupId, amount, message }, { user, pubsub }) => {
      requireAuth(user);
      if (amount < 1 || amount > 100) throw new GraphQLError('Amount must be 1–100 coins');
      const to = getUser(toUserId);
      if (!to) throw new GraphQLError('User not found');
      const id = uuid();
      dbSendTip({ id, fromId: user.id, toId: toUserId, groupId, amount, message });
      const notifId = uuid();
      createNotification({ id: notifId, userId: toUserId, type: 'TIP_RECEIVED', title: `⭐ ${user.name} sent you ${amount} coin${amount > 1 ? 's' : ''}!`, message: message || `You received a tip from ${user.name}.`, actorId: user.id, groupId });
      if (pubsub) pubsub.publish(`NOTIFICATION_${toUserId}`, { notificationReceived: { id: notifId, type: 'TIP_RECEIVED', title: `⭐ ${user.name} sent you ${amount} coins!`, message: message || 'Tip received!', isRead: false, createdAt: new Date().toISOString() } });
      return { id, fromId: user.id, toId: toUserId, groupId, amount, message: message||'', createdAt: new Date().toISOString() };
    },

    createEvent: (_, { groupId, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice }, { user }) => {
      requireAuth(user);
      const group = getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can add events');
      const id = uuid();
      const event = createEvent({ id, groupId, creatorId: user.id, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice });
      return resolveEvent(event, user.id);
    },

    registerForEvent: (_, { eventId }, { user }) => {
      requireAuth(user);
      const event = getEvent(eventId);
      if (!event) throw new GraphQLError('Event not found');
      if (getEventRegistrationCount(eventId) >= event.capacity) throw new GraphQLError('Event is full');
      dbRegisterForEvent(eventId, user.id);
      return resolveEvent(getEvent(eventId), user.id);
    },

    unregisterFromEvent: (_, { eventId }, { user }) => {
      requireAuth(user);
      dbUnregisterFromEvent(eventId, user.id);
      return resolveEvent(getEvent(eventId), user.id);
    },

    createProduct: (_, { groupId, name, description, price, productType, imageEmoji, stock }, { user }) => {
      requireAuth(user);
      const group = getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can add products');
      const id = uuid();
      const product = createProduct({ id, groupId, creatorId: user.id, name, description, price, productType, imageEmoji, stock });
      return resolveProduct(product);
    },

    createCampaign: (_, { groupId, title, goal, description, targetAgeGroups, targetCity, startDate, endDate }, { user }) => {
      requireAuth(user);
      const group = getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can create campaigns');
      const id = uuid();
      const campaign = createCampaign({ id, groupId, creatorId: user.id, title, goal, description, targetAgeGroups, targetCity, startDate, endDate });
      return resolveCampaign(campaign);
    },

    addCoins: (_, { userId, amount }, { user }) => {
      requireAuth(user);
      if (amount < 1) throw new GraphQLError('Amount must be positive');
      return addCoins(userId, amount);
    },

    linkChild: (_, { childEmail }, { user }) => {
      requireAuth(user);
      const child = getUserByEmail(childEmail);
      if (!child) throw new GraphQLError('No user found with that email');
      if (child.age_group !== 'KIDS' && child.age_group !== 'TEENS') throw new GraphQLError('Can only link to KIDS or TEENS accounts');
      linkParentChild(user.id, child.id);
      return resolveUser(getUser(child.id));
    },
  },

  Subscription: {
    messageSent: { subscribe: (_, { groupId }, { pubsub }) => pubsub.asyncIterableIterator(`MESSAGE_SENT_${groupId}`) },
    groupMemberChanged: { subscribe: (_, { groupId }, { pubsub }) => pubsub.asyncIterableIterator(`GROUP_MEMBER_CHANGED_${groupId}`) },
    notificationReceived: { subscribe: (_, __, { user, pubsub }) => { requireAuth(user); return pubsub.asyncIterableIterator(`NOTIFICATION_${user.id}`); } },
  },
};
