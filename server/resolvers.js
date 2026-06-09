import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import {
  getUser, getUserByEmail, createUser, updateUser, findFolks, setUserRole, getAdminStats, getAdminUsers,
  getGroup, getGroups, createGroup, getGroupMembers, getMemberCount, isMember, joinGroup, leaveGroup, getUserGroups,
  getGroupMessages, createMessage,
  createNotification, getUserNotifications, markNotificationsRead, getUnreadCount, getBuddyStatus, sendBuddyRequest,
  sendTip as dbSendTip, getTipsTotal,
  createEvent, getEvent, getGroupEvents, registerForEvent as dbRegisterForEvent, unregisterFromEvent as dbUnregisterFromEvent, getEventRegistrationCount, isRegisteredForEvent,
  createProduct, getGroupProducts,
  createCampaign, getGroupCampaigns,
  getWallet, addCoins, linkParentChild, getChildren,
  registerExpert, getExpert, getExpertByUser, updateExpert, searchExperts as dbSearchExperts,
  createBooking, getBooking, getUserBookings, getExpertBookings, updateBookingStatus,
  createReview, getExpertReviews,
  createCoupon, getCoupon, getCouponByCode, getSellerCoupons, deleteCoupon,
  seedGroups as dbSeedGroups,
  createLearningContent, getLearningContent, getLearningContentList, deleteLearningContent as dbDeleteLearningContent, incrementViewCount,
  createWebinar as dbCreateWebinar, getWebinar, getGroupWebinars, joinWebinar as dbJoinWebinar, leaveWebinar as dbLeaveWebinar,
  getWebinarAttendees, getWebinarAttendeeCount, isWebinarAttendee, updateWebinarStatus, addWebinarReward,
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

async function resolveUser(u) {
  if (!u) return null;
  try {
    const [groups, unread, tips, wallet, children] = await Promise.all([
      getUserGroups(u.id).catch(() => []),
      getUnreadCount(u.id).catch(() => 0),
      getTipsTotal(u.id).catch(() => 0),
      getWallet(u.id).catch(() => ({ coins: 0 })),
      getChildren(u.id).catch(() => []),
    ]);
    return {
      ...u,
      role: u.role || 'USER',
      location: { building: u.building||'', neighborhood: u.neighborhood||'', city: u.city||'', country: u.country||'', lat: u.lat||null, lng: u.lng||null },
      joinedGroups: groups,
      unreadCount: unread,
      tipsEarned: tips,
      walletCoins: wallet.coins,
      children: await Promise.all(children.map(c => resolveUser(c))),
    };
  } catch (e) {
    // Return minimal user to prevent null on profile page
    return {
      ...u,
      role: u.role || 'USER',
      location: { building: u.building||'', neighborhood: u.neighborhood||'', city: u.city||'', country: u.country||'', lat: null, lng: null },
      joinedGroups: [],
      unreadCount: 0,
      tipsEarned: 0,
      walletCoins: 0,
      children: [],
    };
  }
}

async function resolveGroup(g, userId) {
  if (!g) return null;
  const [members, count, memberCheck, messages, events, products, campaigns, creator, webinars] = await Promise.all([
    getGroupMembers(g.id).catch(() => []),
    getMemberCount(g.id).catch(() => 0),
    userId ? isMember(g.id, userId).catch(() => false) : Promise.resolve(false),
    getGroupMessages(g.id).catch(() => []),
    getGroupEvents(g.id).catch(() => []),
    getGroupProducts(g.id).catch(() => []),
    getGroupCampaigns(g.id).catch(() => []),
    getUser(g.creatorId).catch(() => null),
    getGroupWebinars(g.id).catch(() => []),
  ]);
  return {
    ...g,
    memberCount: count,
    members: await Promise.all(members.map(m => resolveUser(m))),
    isOpen: count < g.maxMembers,
    isMember: memberCheck,
    isSeeded: !!g.isSeeded,
    creator: creator ? await resolveUser(creator) : { id: g.creatorId, name: 'HobbyOrigin', avatarColor: '#6366f1', ageGroup: 'ADULTS', role: 'ADMIN', bio: '', interests: [], theme: 'STANDARD', language: 'en', currency: 'GBP', locale: 'en-GB', joinedGroups: [], unreadCount: 0, tipsEarned: 0, walletCoins: 0, children: [], createdAt: g.createdAt, location: { building:'', neighborhood:'', city:'', country:'', lat:null, lng:null } },
    messages,
    location: { building: g.building||'', neighborhood: g.neighborhood||'', city: g.city||'', country: g.country||'', lat: null, lng: null },
    schedule: g.scheduleDay ? {
      day: g.scheduleDay, time: g.scheduleTime,
      frequency: g.scheduleFrequency, duration: g.scheduleDuration,
      nextSession: nextSession(g),
    } : null,
    events: await Promise.all(events.map(e => resolveEvent(e, userId))),
    products: await Promise.all(products.map(p => resolveProduct(p))),
    campaigns: await Promise.all(campaigns.map(c => resolveCampaign(c))),
    webinars: await Promise.all(webinars.map(w => resolveWebinar(w, userId))),
  };
}

async function resolveEvent(e, userId) {
  if (!e) return null;
  const [count, registered, creator] = await Promise.all([
    getEventRegistrationCount(e.id),
    userId ? isRegisteredForEvent(e.id, userId) : Promise.resolve(false),
    getUser(e.creatorId),
  ]);
  return {
    ...e,
    registrationCount: count,
    isRegistered: registered,
    creator: await resolveUser(creator),
  };
}

async function resolveProduct(p) {
  if (!p) return null;
  return { ...p, creator: await resolveUser(await getUser(p.creatorId)) };
}

async function resolveCampaign(c) {
  if (!c) return null;
  return { ...c, creator: await resolveUser(await getUser(c.creatorId)) };
}

async function resolveExpert(e) {
  if (!e) return null;
  const [user, reviews] = await Promise.all([
    getUser(e.userId),
    getExpertReviews(e.id),
  ]);
  return {
    ...e,
    user: await resolveUser(user),
    reviews: await Promise.all(reviews.map(async r => ({
      ...r,
      expertId: r.expert_id,
      userId: r.user_id,
      bookingId: r.booking_id,
      createdAt: r.created_at,
      reviewer: await resolveUser(await getUser(r.user_id)),
    }))),
  };
}

async function resolveWebinar(w, userId) {
  if (!w) return null;
  const [host, attendees, count, attending] = await Promise.all([
    getUser(w.hostId).catch(() => null),
    getWebinarAttendees(w.id).catch(() => []),
    getWebinarAttendeeCount(w.id).catch(() => 0),
    userId ? isWebinarAttendee(w.id, userId).catch(() => false) : Promise.resolve(false),
  ]);
  return {
    ...w,
    host: host ? await resolveUser(host) : { id: w.hostId, name: 'Unknown', avatarColor: '#6366f1', ageGroup: 'ADULTS', role: 'USER', bio: '', interests: [], theme: 'STANDARD', language: 'en', currency: 'GBP', locale: 'en-GB', joinedGroups: [], unreadCount: 0, tipsEarned: 0, walletCoins: 0, children: [], createdAt: w.createdAt, location: { building:'', neighborhood:'', city:'', country:'', lat:null, lng:null } },
    attendees: await Promise.all(attendees.map(a => resolveUser(a))),
    attendeeCount: count,
    isAttending: attending,
  };
}

async function resolveBooking(b) {
  if (!b) return null;
  const [expert, user] = await Promise.all([
    getExpert(b.expertId),
    getUser(b.userId),
  ]);
  return {
    ...b,
    expert: await resolveExpert(expert),
    user: await resolveUser(user),
  };
}

// ── Session reminder scheduler ────────────────────────────────────────────────
let _pubsub = null;
function scheduleReminders(pubsub) {
  _pubsub = pubsub;
  setInterval(async () => {
    try {
      const groups = await getGroups();
      const now = new Date();
      for (const g of groups) {
        const ns = nextSession(g);
        if (!ns) continue;
        const diff = (new Date(ns) - now) / 60000;
        if (diff >= 55 && diff <= 65) {
          const members = await getGroupMembers(g.id);
          for (const m of members) {
            const prefs = m.notificationPrefs || {};
            if (prefs.session_reminder === false) continue;
            const id = uuid();
            await createNotification({ id, userId: m.id, type: 'SESSION_REMINDER',
              title: `⏰ ${g.name} starts in 1 hour`,
              message: `Your group session is scheduled for ${g.scheduleTime} today. Don't miss it!`,
              groupId: g.id, scheduledFor: ns,
            });
            if (pubsub) pubsub.publish(`NOTIFICATION_${m.id}`, {
              notificationReceived: { id, type: 'SESSION_REMINDER', title: `⏰ ${g.name} starts in 1 hour`, message: `Session at ${g.scheduleTime}`, isRead: false, groupId: g.id, createdAt: new Date().toISOString() }
            });
          }
        }
      }
    } catch {}
  }, 5 * 60 * 1000);
}

export { scheduleReminders };

export const resolvers = {
  Query: {
    me: async (_, __, { user }) => user ? resolveUser(user) : null,

    groups: async (_, args, { user }) => {
      const groups = await getGroups(args);
      return Promise.all(groups.map(g => resolveGroup(g, user?.id)));
    },

    group: async (_, { id }, { user }) => resolveGroup(await getGroup(id), user?.id),

    user: async (_, { id }) => resolveUser(await getUser(id)),

    findFolks: async (_, { interests = [], city, building, ageGroup }, { user }) => {
      requireAuth(user);
      const searchCity = city || user.city || null;
      const searchBuilding = building || null;
      const searchInterests = interests.length ? interests : (user.interests || []);
      const folks = await findFolks({ interests: searchInterests, city: searchCity, building: searchBuilding, ageGroup, excludeId: user.id });
      return Promise.all(folks.map(async f => {
        const shared = (user.interests || []).filter(i => f.interests.includes(i));
        let proximity = 'city';
        if (searchBuilding && f.building?.toLowerCase() === searchBuilding.toLowerCase()) proximity = 'building';
        const buddyStatus = await getBuddyStatus(user.id, f.id);
        return { user: await resolveUser(f), sharedInterests: shared, proximity, buddyStatus };
      }));
    },

    myNotifications: async (_, __, { user }) => {
      requireAuth(user);
      return getUserNotifications(user.id);
    },

    myWallet: async (_, __, { user }) => { requireAuth(user); return getWallet(user.id); },

    groupEvents: async (_, { groupId }, { user }) => {
      const events = await getGroupEvents(groupId);
      return Promise.all(events.map(e => resolveEvent(e, user?.id)));
    },

    groupProducts: async (_, { groupId }) => {
      const products = await getGroupProducts(groupId);
      return Promise.all(products.map(p => resolveProduct(p)));
    },

    groupCampaigns: async (_, { groupId }) => {
      const campaigns = await getGroupCampaigns(groupId);
      return Promise.all(campaigns.map(c => resolveCampaign(c)));
    },

    searchExperts: async (_, { skill, isElderSupport, country, serviceType }) => {
      const experts = await dbSearchExperts({ skill, isElderSupport, country, serviceType });
      return Promise.all(experts.map(e => resolveExpert(e)));
    },

    expert: async (_, { id }) => resolveExpert(await getExpert(id)),

    myExpertProfile: async (_, __, { user }) => {
      requireAuth(user);
      const e = await getExpertByUser(user.id);
      return e ? resolveExpert(e) : null;
    },

    myBookings: async (_, __, { user }) => {
      requireAuth(user);
      const bookings = await getUserBookings(user.id);
      return Promise.all(bookings.map(b => resolveBooking(b)));
    },

    expertBookings: async (_, __, { user }) => {
      requireAuth(user);
      const expert = await getExpertByUser(user.id);
      if (!expert) throw new GraphQLError('You are not registered as an expert');
      const bookings = await getExpertBookings(expert.id);
      return Promise.all(bookings.map(b => resolveBooking(b)));
    },

    myCoupons: async (_, __, { user }) => {
      requireAuth(user);
      const coupons = await getSellerCoupons(user.id);
      return Promise.all(coupons.map(async c => ({
        ...c,
        seller: await resolveUser(await getUser(c.sellerId)),
      })));
    },

    coupon: async (_, { code }) => {
      const c = await getCouponByCode(code);
      if (!c) return null;
      return { ...c, seller: await resolveUser(await getUser(c.sellerId)) };
    },

    adminStats: async (_, __, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      const stats = await getAdminStats();
      return {
        ...stats,
        recentUsers: await Promise.all(stats.recentUsers.map(u => resolveUser(u))),
        recentGroups: await Promise.all(stats.recentGroups.map(g => resolveGroup(g, null))),
      };
    },

    adminUsers: async (_, args, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      const users = await getAdminUsers(args);
      return Promise.all(users.map(u => resolveUser(u)));
    },

    learningContent: async (_, args) => {
      const items = await getLearningContentList(args);
      return Promise.all(items.map(async lc => ({ ...lc, author: await resolveUser(await getUser(lc.authorId)) })));
    },

    learningContentItem: async (_, { id }) => {
      const lc = await getLearningContent(id);
      if (!lc) return null;
      await incrementViewCount(id);
      return { ...lc, author: await resolveUser(await getUser(lc.authorId)) };
    },

    groupWebinars: async (_, { groupId }, { user }) => {
      const webinars = await getGroupWebinars(groupId);
      return Promise.all(webinars.map(w => resolveWebinar(w, user?.id)));
    },
  },

  Mutation: {
    register: async (_, { name, email, password, age, city, country, building, neighborhood, currency, locale, lat, lng }) => {
      const existing = await getUserByEmail(email);
      if (existing) throw new GraphQLError('Email already in use');
      if (password.length < 6) throw new GraphQLError('Password must be at least 6 characters');
      const hashed = await bcrypt.hash(password, 10);
      const ageGroup = ageToGroup(age);
      const theme = ageGroupToTheme(ageGroup);
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const id = uuid();
      await createUser({ id, name, email, password: hashed, avatarColor: color, age: age || null, ageGroup, theme, currency: currency||'GBP', locale: locale||'en-GB', lat: lat||null, lng: lng||null, createdAt: new Date().toISOString() });
      if (city || building || country || lat || lng) await updateUser(id, { city: city||'', country: country||'', building: building||'', neighborhood: neighborhood||'', lat: lat||null, lng: lng||null });
      const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
      return { token, user: await resolveUser(await getUser(id)) };
    },

    login: async (_, { email, password }) => {
      const row = await getUserByEmail(email);
      if (!row || !await bcrypt.compare(password, row.password)) throw new GraphQLError('Invalid credentials');
      const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '30d' });
      return { token, user: await resolveUser(await getUser(row.id)) };
    },

    createGroup: async (_, args, { user }) => {
      requireAuth(user);
      if (args.maxMembers < 2 || args.maxMembers > 200) throw new GraphQLError('Max members must be 2–200');
      const id = uuid();
      await createGroup({ id, ...args, tags: args.tags || [], ageGroups: args.ageGroups || ['KIDS','TEENS','ADULTS','SENIORS'], creatorId: user.id, createdAt: new Date().toISOString() });
      return resolveGroup(await getGroup(id), user.id);
    },

    joinGroup: async (_, { groupId }, { user, pubsub }) => {
      requireAuth(user);
      const group = await getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      const count = await getMemberCount(groupId);
      if (count >= group.maxMembers) throw new GraphQLError('Group is full');
      await joinGroup(groupId, user.id);
      const notifId = uuid();
      await createNotification({ id: notifId, userId: group.creatorId, type: 'NEW_MEMBER', title: `👋 ${user.name} joined ${group.name}`, message: `A new member just joined your group!`, groupId, actorId: user.id });
      if (pubsub) {
        const r = await resolveGroup(await getGroup(groupId), user.id);
        pubsub.publish(`GROUP_MEMBER_CHANGED_${groupId}`, { groupMemberChanged: r });
        pubsub.publish(`NOTIFICATION_${group.creatorId}`, { notificationReceived: { id: notifId, type: 'NEW_MEMBER', title: `👋 ${user.name} joined ${group.name}`, message: 'New member!', isRead: false, groupId, createdAt: new Date().toISOString() } });
      }
      return resolveGroup(await getGroup(groupId), user.id);
    },

    leaveGroup: async (_, { groupId }, { user, pubsub }) => {
      requireAuth(user);
      const group = await getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId === user.id) throw new GraphQLError('Creator cannot leave their own group');
      await leaveGroup(groupId, user.id);
      const r = await resolveGroup(await getGroup(groupId), user.id);
      if (pubsub) pubsub.publish(`GROUP_MEMBER_CHANGED_${groupId}`, { groupMemberChanged: r });
      return r;
    },

    sendMessage: async (_, { groupId, content, messageType, videoUrl }, { user, pubsub }) => {
      requireAuth(user);
      if (!content.trim() && !videoUrl) throw new GraphQLError('Message cannot be empty');
      const memberCheck = await isMember(groupId, user.id);
      if (!memberCheck) throw new GraphQLError('Join the group first');
      const id = uuid();
      const msg = await createMessage({ id, content: content?.trim()||'', messageType: messageType||'TEXT', videoUrl: videoUrl||'', senderId: user.id, groupId, createdAt: new Date().toISOString() });
      const sender = await getUser(user.id);
      const resolved = { ...msg, sender };
      if (pubsub) pubsub.publish(`MESSAGE_SENT_${groupId}`, { messageSent: resolved });
      return resolved;
    },

    sendBuddyRequest: async (_, { toUserId }, { user, pubsub }) => {
      requireAuth(user);
      const to = await getUser(toUserId);
      if (!to) throw new GraphQLError('User not found');
      await sendBuddyRequest({ id: uuid(), fromId: user.id, toId: toUserId, createdAt: new Date().toISOString() });
      const notifId = uuid();
      await createNotification({ id: notifId, userId: toUserId, type: 'BUDDY_REQUEST', title: `🤝 ${user.name} wants to connect!`, message: `${user.name} sent you a buddy request.`, actorId: user.id });
      if (pubsub) pubsub.publish(`NOTIFICATION_${toUserId}`, { notificationReceived: { id: notifId, type: 'BUDDY_REQUEST', title: `🤝 ${user.name} wants to connect!`, message: `Buddy request`, isRead: false, createdAt: new Date().toISOString() } });
      return true;
    },

    markNotificationsRead: async (_, __, { user }) => {
      requireAuth(user);
      await markNotificationsRead(user.id);
      return true;
    },

    sendTip: async (_, { toUserId, groupId, amount, message }, { user, pubsub }) => {
      requireAuth(user);
      if (amount < 1 || amount > 100) throw new GraphQLError('Amount must be 1–100 coins');
      const to = await getUser(toUserId);
      if (!to) throw new GraphQLError('User not found');
      const id = uuid();
      await dbSendTip({ id, fromId: user.id, toId: toUserId, groupId, amount, message });
      const notifId = uuid();
      await createNotification({ id: notifId, userId: toUserId, type: 'TIP_RECEIVED', title: `⭐ ${user.name} sent you ${amount} coin${amount > 1 ? 's' : ''}!`, message: message || `You received a tip from ${user.name}.`, actorId: user.id, groupId });
      if (pubsub) pubsub.publish(`NOTIFICATION_${toUserId}`, { notificationReceived: { id: notifId, type: 'TIP_RECEIVED', title: `⭐ ${user.name} sent you ${amount} coins!`, message: message || 'Tip received!', isRead: false, createdAt: new Date().toISOString() } });
      return { id, fromId: user.id, toId: toUserId, groupId, amount, message: message||'', createdAt: new Date().toISOString() };
    },

    createEvent: async (_, { groupId, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice }, { user }) => {
      requireAuth(user);
      const group = await getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can add events');
      const id = uuid();
      const event = await createEvent({ id, groupId, creatorId: user.id, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice });
      return resolveEvent(event, user.id);
    },

    registerForEvent: async (_, { eventId }, { user }) => {
      requireAuth(user);
      const event = await getEvent(eventId);
      if (!event) throw new GraphQLError('Event not found');
      const count = await getEventRegistrationCount(eventId);
      if (count >= event.capacity) throw new GraphQLError('Event is full');
      await dbRegisterForEvent(eventId, user.id);
      return resolveEvent(await getEvent(eventId), user.id);
    },

    unregisterFromEvent: async (_, { eventId }, { user }) => {
      requireAuth(user);
      await dbUnregisterFromEvent(eventId, user.id);
      return resolveEvent(await getEvent(eventId), user.id);
    },

    createProduct: async (_, { groupId, name, description, price, productType, imageEmoji, stock }, { user }) => {
      requireAuth(user);
      const group = await getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can add products');
      const id = uuid();
      const product = await createProduct({ id, groupId, creatorId: user.id, name, description, price, productType, imageEmoji, stock });
      return resolveProduct(product);
    },

    createCampaign: async (_, { groupId, title, goal, description, targetAgeGroups, targetCity, startDate, endDate }, { user }) => {
      requireAuth(user);
      const group = await getGroup(groupId);
      if (!group) throw new GraphQLError('Group not found');
      if (group.creatorId !== user.id) throw new GraphQLError('Only the group creator can create campaigns');
      const id = uuid();
      const campaign = await createCampaign({ id, groupId, creatorId: user.id, title, goal, description, targetAgeGroups, targetCity, startDate, endDate });
      return resolveCampaign(campaign);
    },

    addCoins: async (_, { userId, amount }, { user }) => {
      requireAuth(user);
      if (amount < 1) throw new GraphQLError('Amount must be positive');
      return addCoins(userId, amount);
    },

    linkChild: async (_, { childEmail }, { user }) => {
      requireAuth(user);
      const child = await getUserByEmail(childEmail);
      if (!child) throw new GraphQLError('No user found with that email');
      if (child.age_group !== 'KIDS' && child.age_group !== 'TEENS') throw new GraphQLError('Can only link to KIDS or TEENS accounts');
      await linkParentChild(user.id, child.id);
      return resolveUser(await getUser(child.id));
    },

    registerAsExpert: async (_, args, { user }) => {
      requireAuth(user);
      const existing = await getExpertByUser(user.id);
      if (existing) throw new GraphQLError('You are already registered as an expert');
      if (!args.skills || args.skills.length === 0) throw new GraphQLError('At least one skill is required');
      const id = uuid();
      const expert = await registerExpert({ id, userId: user.id, ...args });
      return resolveExpert(expert);
    },

    updateExpertProfile: async (_, args, { user }) => {
      requireAuth(user);
      const expert = await getExpertByUser(user.id);
      if (!expert) throw new GraphQLError('Expert profile not found');
      const dbFields = {};
      if (args.headline !== undefined) dbFields.headline = args.headline;
      if (args.bio !== undefined) dbFields.bio = args.bio;
      if (args.skills) dbFields.skills = args.skills;
      if (args.serviceType) dbFields.service_type = args.serviceType;
      if (args.hourlyRate !== undefined) dbFields.hourly_rate = args.hourlyRate;
      if (args.currency) dbFields.currency = args.currency;
      if (args.languages) dbFields.languages = args.languages;
      if (args.countries) dbFields.countries = args.countries;
      if (args.isElderSupport !== undefined) dbFields.is_elder_support = args.isElderSupport;
      if (args.availability !== undefined) dbFields.availability = args.availability;
      return resolveExpert(await updateExpert(expert.id, dbFields));
    },

    bookExpert: async (_, { expertId, skill, serviceType, scheduledAt, durationMins, notes }, { user }) => {
      requireAuth(user);
      const expert = await getExpert(expertId);
      if (!expert) throw new GraphQLError('Expert not found');
      if (expert.userId === user.id) throw new GraphQLError('You cannot book yourself');
      const effectiveServiceType = serviceType || (expert.serviceType === 'CHARITY' ? 'CHARITY' : 'PAID');
      const amount = effectiveServiceType === 'CHARITY' ? 0 : (expert.hourlyRate * (durationMins || 60)) / 60;
      const id = uuid();
      const booking = await createBooking({ id, expertId, userId: user.id, skill, serviceType: effectiveServiceType, scheduledAt, durationMins: durationMins||60, amount: Math.round(amount), currency: expert.currency, notes });
      const notifId = uuid();
      await createNotification({ id: notifId, userId: expert.userId, type: 'BOOKING_REQUEST', title: `📅 New booking from ${user.name}`, message: `${user.name} has requested a session on ${skill}`, actorId: user.id });
      return resolveBooking(booking);
    },

    confirmBooking: async (_, { bookingId, meetingUrl }, { user }) => {
      requireAuth(user);
      const booking = await getBooking(bookingId);
      if (!booking) throw new GraphQLError('Booking not found');
      const expert = await getExpert(booking.expertId);
      if (expert.userId !== user.id) throw new GraphQLError('Only the expert can confirm this booking');
      return resolveBooking(await updateBookingStatus(bookingId, 'CONFIRMED', meetingUrl));
    },

    cancelBooking: async (_, { bookingId }, { user }) => {
      requireAuth(user);
      const booking = await getBooking(bookingId);
      if (!booking) throw new GraphQLError('Booking not found');
      const expert = await getExpert(booking.expertId);
      if (booking.userId !== user.id && expert.userId !== user.id) throw new GraphQLError('Not authorised');
      return resolveBooking(await updateBookingStatus(bookingId, 'CANCELLED', ''));
    },

    completeBooking: async (_, { bookingId }, { user }) => {
      requireAuth(user);
      const booking = await getBooking(bookingId);
      if (!booking) throw new GraphQLError('Booking not found');
      const expert = await getExpert(booking.expertId);
      if (expert.userId !== user.id) throw new GraphQLError('Only the expert can mark this completed');
      return resolveBooking(await updateBookingStatus(bookingId, 'COMPLETED', booking.meetingUrl));
    },

    reviewExpert: async (_, { expertId, bookingId, rating, comment }, { user }) => {
      requireAuth(user);
      if (rating < 1 || rating > 5) throw new GraphQLError('Rating must be 1–5');
      const expert = await getExpert(expertId);
      if (!expert) throw new GraphQLError('Expert not found');
      const id = uuid();
      return resolveExpert(await createReview({ id, expertId, userId: user.id, bookingId, rating, comment }));
    },

    createCoupon: async (_, { code, description, discountPct, maxUses, groupId, expiresAt }, { user }) => {
      requireAuth(user);
      if (user.role !== 'SELLER' && user.role !== 'ADMIN') throw new GraphQLError('Seller or Admin access required');
      if (discountPct < 1 || discountPct > 100) throw new GraphQLError('Discount must be 1–100%');
      const id = uuid();
      const coupon = await createCoupon({ id, code, description, discountPct, maxUses: maxUses||100, groupId, sellerId: user.id, expiresAt });
      return { ...coupon, seller: await resolveUser(await getUser(user.id)) };
    },

    deleteCoupon: async (_, { id }, { user }) => {
      requireAuth(user);
      const coupon = await getCoupon(id);
      if (!coupon) throw new GraphQLError('Coupon not found');
      if (coupon.sellerId !== user.id && user.role !== 'ADMIN') throw new GraphQLError('Not authorised');
      await deleteCoupon(id);
      return true;
    },

    setUserRole: async (_, { userId, role }, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      const updated = await setUserRole(userId, role);
      return resolveUser(updated);
    },

    seedGroups: async (_, __, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      return dbSeedGroups(user.id);
    },

    createLearningContent: async (_, args, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      const id = uuid();
      const lc = await createLearningContent({ id, ...args, authorId: user.id });
      return { ...lc, author: await resolveUser(await getUser(user.id)) };
    },

    deleteLearningContent: async (_, { id }, { user }) => {
      requireAuth(user);
      if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required');
      await dbDeleteLearningContent(id);
      return true;
    },

    createWebinar: async (_, args, { user, pubsub }) => {
      requireAuth(user);
      const memberCheck = await isMember(args.groupId, user.id);
      if (!memberCheck) throw new GraphQLError('You must be a group member to host a webinar');
      const id = uuid();
      const webinar = await dbCreateWebinar({ id, ...args, hostId: user.id });
      const notifId = uuid();
      const members = await getGroupMembers(args.groupId);
      await Promise.all(members.filter(m => m.id !== user.id).map(m =>
        createNotification({ id: uuid(), userId: m.id, type: 'WEBINAR_CREATED', title: `🎙️ ${user.name} is hosting a webinar!`, message: `"${args.title}" — Join now`, groupId: args.groupId, actorId: user.id })
      ));
      return resolveWebinar(webinar, user.id);
    },

    joinWebinar: async (_, { webinarId }, { user }) => {
      requireAuth(user);
      const w = await getWebinar(webinarId);
      if (!w) throw new GraphQLError('Webinar not found');
      const count = await getWebinarAttendeeCount(webinarId);
      if (count >= w.maxAttendees) throw new GraphQLError('Webinar is full');
      await dbJoinWebinar(webinarId, user.id);
      return resolveWebinar(await getWebinar(webinarId), user.id);
    },

    leaveWebinar: async (_, { webinarId }, { user }) => {
      requireAuth(user);
      await dbLeaveWebinar(webinarId, user.id);
      return resolveWebinar(await getWebinar(webinarId), user.id);
    },

    startWebinar: async (_, { webinarId, meetingUrl }, { user }) => {
      requireAuth(user);
      const w = await getWebinar(webinarId);
      if (!w) throw new GraphQLError('Webinar not found');
      if (w.hostId !== user.id) throw new GraphQLError('Only the host can start the webinar');
      return resolveWebinar(await updateWebinarStatus(webinarId, 'LIVE', meetingUrl), user.id);
    },

    endWebinar: async (_, { webinarId }, { user }) => {
      requireAuth(user);
      const w = await getWebinar(webinarId);
      if (!w) throw new GraphQLError('Webinar not found');
      if (w.hostId !== user.id && user.role !== 'ADMIN') throw new GraphQLError('Only the host can end the webinar');
      return resolveWebinar(await updateWebinarStatus(webinarId, 'ENDED'), user.id);
    },

    rewardWebinarHost: async (_, { webinarId, amount, message }, { user, pubsub }) => {
      requireAuth(user);
      if (amount < 1 || amount > 500) throw new GraphQLError('Amount must be 1–500 coins');
      const w = await getWebinar(webinarId);
      if (!w) throw new GraphQLError('Webinar not found');
      if (w.hostId === user.id) throw new GraphQLError('Cannot reward yourself');
      const id = uuid();
      await dbSendTip({ id, fromId: user.id, toId: w.hostId, groupId: w.groupId, amount, message: message || `⭐ Great webinar: ${w.title}` });
      await addWebinarReward(webinarId, amount);
      const notifId = uuid();
      await createNotification({ id: notifId, userId: w.hostId, type: 'TIP_RECEIVED', title: `⭐ ${user.name} rewarded you ${amount} coin${amount>1?'s':''}!`, message: message || `For hosting "${w.title}"`, actorId: user.id, groupId: w.groupId });
      if (pubsub) pubsub.publish(`NOTIFICATION_${w.hostId}`, { notificationReceived: { id: notifId, type: 'TIP_RECEIVED', title: `⭐ Reward received!`, message: `${user.name} gave you ${amount} coins`, isRead: false, createdAt: new Date().toISOString() } });
      return resolveWebinar(await getWebinar(webinarId), user.id);
    },

    updateProfile: async (_, args, { user }) => {
      requireAuth(user);
      const dbFields = { bio: args.bio, interests: args.interests, age: args.age, building: args.building, neighborhood: args.neighborhood, city: args.city, country: args.country, language: args.language, lat: args.lat, lng: args.lng };
      if (args.theme) dbFields.theme = args.theme;
      if (args.currency) dbFields.currency = args.currency;
      if (args.locale) dbFields.locale = args.locale;
      if (args.age) dbFields.age_group = ageToGroup(args.age);
      await updateUser(user.id, dbFields);
      return resolveUser(await getUser(user.id));
    },
  },

  Subscription: {
    messageSent: { subscribe: (_, { groupId }, { pubsub }) => pubsub.asyncIterableIterator(`MESSAGE_SENT_${groupId}`) },
    groupMemberChanged: { subscribe: (_, { groupId }, { pubsub }) => pubsub.asyncIterableIterator(`GROUP_MEMBER_CHANGED_${groupId}`) },
    notificationReceived: { subscribe: (_, __, { user, pubsub }) => { requireAuth(user); return pubsub.asyncIterableIterator(`NOTIFICATION_${user.id}`); } },
  },
};
