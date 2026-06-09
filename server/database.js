import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'hobbyorigin.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT DEFAULT '',
    interests TEXT DEFAULT '[]',
    avatar_color TEXT NOT NULL DEFAULT '#6366f1',
    age INTEGER DEFAULT NULL,
    age_group TEXT DEFAULT 'ADULTS',   -- KIDS | TEENS | ADULTS | SENIORS
    theme TEXT DEFAULT 'STANDARD',     -- PLAYFUL | STANDARD | ACCESSIBLE
    building TEXT DEFAULT '',
    neighborhood TEXT DEFAULT '',
    city TEXT DEFAULT '',
    country TEXT DEFAULT '',
    language TEXT DEFAULT 'en',
    notification_prefs TEXT DEFAULT '{"session_reminder":true,"new_member":true,"new_buddy":true}',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    max_members INTEGER NOT NULL DEFAULT 10,
    creator_id TEXT NOT NULL,
    age_groups TEXT DEFAULT '["KIDS","TEENS","ADULTS","SENIORS"]',
    building TEXT DEFAULT '',
    neighborhood TEXT DEFAULT '',
    city TEXT DEFAULT '',
    country TEXT DEFAULT '',
    schedule_day TEXT DEFAULT '',
    schedule_time TEXT DEFAULT '',
    schedule_frequency TEXT DEFAULT '',
    schedule_duration INTEGER DEFAULT 60,
    created_at TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    group_id TEXT DEFAULT NULL,
    actor_id TEXT DEFAULT NULL,
    scheduled_for TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS buddy_requests (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    group_id TEXT,
    amount INTEGER NOT NULL DEFAULT 1,
    message TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    starts_at TEXT NOT NULL,
    duration_mins INTEGER DEFAULT 60,
    capacity INTEGER DEFAULT 50,
    ticket_price INTEGER DEFAULT 0,
    status TEXT DEFAULT 'UPCOMING',
    created_at TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    registered_at TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0,
    product_type TEXT DEFAULT 'PHYSICAL',
    image_emoji TEXT DEFAULT '📦',
    stock INTEGER DEFAULT -1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    goal TEXT DEFAULT 'AWARENESS',
    description TEXT DEFAULT '',
    target_age_groups TEXT DEFAULT '[]',
    target_city TEXT DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wallet (
    user_id TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS parent_child (
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    approved INTEGER DEFAULT 0,
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (child_id) REFERENCES users(id)
  );
`);

// ── USER ──────────────────────────────────────────────────────────────────────

export function getUser(id) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return u ? fmt.user(u) : null;
}
export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}
export function createUser(data) {
  const { id, name, email, password, avatarColor, age, ageGroup, theme, createdAt } = data;
  db.prepare(
    'INSERT INTO users (id,name,email,password,avatar_color,age,age_group,theme,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(id, name, email, password, avatarColor, age, ageGroup, theme, createdAt);
  return getUser(id);
}
export function updateUser(id, fields) {
  const allowed = ['bio', 'interests', 'age', 'age_group', 'theme', 'building', 'neighborhood', 'city', 'country', 'language', 'notification_prefs'];
  const map = { interests: v => JSON.stringify(v), notification_prefs: v => JSON.stringify(v) };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k) || v === undefined) continue;
    const val = map[k] ? map[k](v) : v;
    db.prepare(`UPDATE users SET ${k} = ? WHERE id = ?`).run(val, id);
  }
  return getUser(id);
}
export function findFolks({ interests = [], city, building, excludeId, ageGroup }) {
  // Never filter by neighborhood automatically — only explicit filter via `building` or `city`
  let rows = db.prepare('SELECT * FROM users WHERE id != ?').all(excludeId || '');
  if (city) rows = rows.filter(u => u.city && u.city.toLowerCase() === city.toLowerCase());
  if (building) rows = rows.filter(u => u.building && u.building.toLowerCase() === building.toLowerCase());
  if (ageGroup) rows = rows.filter(u => u.age_group === ageGroup);

  return rows.map(u => {
    const uInterests = JSON.parse(u.interests || '[]');
    const overlap = interests.filter(i => uInterests.includes(i)).length;
    let proximity = 0;
    if (building && u.building && u.building.toLowerCase() === building.toLowerCase()) proximity = 3;
    else if (city && u.city && u.city.toLowerCase() === city.toLowerCase()) proximity = 1;
    return { ...fmt.user(u), _score: overlap * 2 + proximity };
  }).filter(u => u._score > 0).sort((a, b) => b._score - a._score).slice(0, 30);
}

// ── GROUP ─────────────────────────────────────────────────────────────────────

export function getGroup(id) {
  const g = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  return g ? fmt.group(g) : null;
}
export function getGroups({ category, search, city, building, ageGroup } = {}) {
  let q = 'SELECT * FROM groups WHERE 1=1';
  const p = [];
  if (category && category !== 'All') { q += ' AND category = ?'; p.push(category); }
  if (search) { q += ' AND (name LIKE ? OR description LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  if (city) { q += ' AND (city = ? OR city = "")'; p.push(city); }
  if (building) { q += ' AND (building = ? OR building = "")'; p.push(building); }
  q += ' ORDER BY created_at DESC';
  let rows = db.prepare(q).all(...p).map(fmt.group);
  if (ageGroup) rows = rows.filter(g => g.ageGroups.includes(ageGroup) || g.ageGroups.length === 0);
  return rows;
}
export function createGroup(data) {
  const { id, name, description, category, tags, maxMembers, creatorId, ageGroups, building, neighborhood, city, country, scheduleDay, scheduleTime, scheduleFrequency, scheduleDuration, createdAt } = data;
  db.prepare(
    'INSERT INTO groups (id,name,description,category,tags,max_members,creator_id,age_groups,building,neighborhood,city,country,schedule_day,schedule_time,schedule_frequency,schedule_duration,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(id, name, description, category, JSON.stringify(tags), maxMembers, creatorId, JSON.stringify(ageGroups), building||'', neighborhood||'', city||'', country||'', scheduleDay||'', scheduleTime||'', scheduleFrequency||'', scheduleDuration||60, createdAt);
  db.prepare('INSERT INTO group_members (group_id,user_id,joined_at) VALUES (?,?,?)').run(id, creatorId, createdAt);
  return getGroup(id);
}
export function getGroupMembers(groupId) {
  return db.prepare('SELECT u.* FROM users u JOIN group_members gm ON u.id=gm.user_id WHERE gm.group_id=? ORDER BY gm.joined_at').all(groupId).map(fmt.user);
}
export function getMemberCount(groupId) {
  return db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id=?').get(groupId).c;
}
export function isMember(groupId, userId) {
  return !!db.prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?').get(groupId, userId);
}
export function joinGroup(groupId, userId) {
  db.prepare('INSERT OR IGNORE INTO group_members (group_id,user_id,joined_at) VALUES (?,?,?)').run(groupId, userId, new Date().toISOString());
  return getGroup(groupId);
}
export function leaveGroup(groupId, userId) {
  db.prepare('DELETE FROM group_members WHERE group_id=? AND user_id=?').run(groupId, userId);
  return getGroup(groupId);
}
export function getUserGroups(userId) {
  return db.prepare('SELECT g.* FROM groups g JOIN group_members gm ON g.id=gm.group_id WHERE gm.user_id=? ORDER BY gm.joined_at DESC').all(userId).map(fmt.group);
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export function getGroupMessages(groupId, limit = 80) {
  return db.prepare('SELECT * FROM messages WHERE group_id=? ORDER BY created_at ASC LIMIT ?').all(groupId, limit).map(fmt.message);
}
export function createMessage({ id, content, senderId, groupId, createdAt }) {
  db.prepare('INSERT INTO messages (id,content,sender_id,group_id,created_at) VALUES (?,?,?,?,?)').run(id, content, senderId, groupId, createdAt);
  return fmt.message(db.prepare('SELECT * FROM messages WHERE id=?').get(id));
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export function createNotification({ id, userId, type, title, message, groupId, actorId, scheduledFor }) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO notifications (id,user_id,type,title,message,group_id,actor_id,scheduled_for,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, userId, type, title, message, groupId||null, actorId||null, scheduledFor||null, now);
}
export function getUserNotifications(userId) {
  return db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(userId).map(fmt.notification);
}
export function markNotificationsRead(userId) {
  db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(userId);
}
export function getUnreadCount(userId) {
  return db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0').get(userId).c;
}

// ── BUDDIES ───────────────────────────────────────────────────────────────────

export function sendBuddyRequest({ id, fromId, toId, createdAt }) {
  db.prepare('INSERT OR IGNORE INTO buddy_requests (id,from_id,to_id,status,created_at) VALUES (?,?,?,?,?)').run(id, fromId, toId, 'pending', createdAt);
}
export function getBuddyStatus(fromId, toId) {
  const r = db.prepare('SELECT status FROM buddy_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)').get(fromId, toId, toId, fromId);
  return r?.status || null;
}

// ── TIPS ──────────────────────────────────────────────────────────────────────

export function sendTip({ id, fromId, toId, groupId, amount, message }) {
  db.prepare('INSERT INTO tips (id,from_id,to_id,group_id,amount,message,created_at) VALUES (?,?,?,?,?,?,?)').run(id, fromId, toId, groupId||null, amount, message||'', new Date().toISOString());
}
export function getTipsForUser(userId) {
  return db.prepare('SELECT * FROM tips WHERE to_id=? ORDER BY created_at DESC LIMIT 50').all(userId);
}
export function getTipsTotal(userId) {
  return db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM tips WHERE to_id=?').get(userId).total;
}

// ── EVENTS ────────────────────────────────────────────────────────────────────

export function createEvent({ id, groupId, creatorId, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice }) {
  db.prepare('INSERT INTO events (id,group_id,creator_id,title,description,video_url,starts_at,duration_mins,capacity,ticket_price,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, groupId, creatorId, title, description||'', videoUrl||'', startsAt, durationMins||60, capacity||50, ticketPrice||0, new Date().toISOString());
  return getEvent(id);
}
export function getEvent(id) {
  const e = db.prepare('SELECT * FROM events WHERE id=?').get(id);
  return e ? fmt.event(e) : null;
}
export function getGroupEvents(groupId) {
  return db.prepare('SELECT * FROM events WHERE group_id=? ORDER BY starts_at ASC').all(groupId).map(fmt.event);
}
export function registerForEvent(eventId, userId) {
  db.prepare('INSERT OR IGNORE INTO event_registrations (event_id,user_id,registered_at) VALUES (?,?,?)').run(eventId, userId, new Date().toISOString());
}
export function unregisterFromEvent(eventId, userId) {
  db.prepare('DELETE FROM event_registrations WHERE event_id=? AND user_id=?').run(eventId, userId);
}
export function getEventRegistrationCount(eventId) {
  return db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?').get(eventId).c;
}
export function isRegisteredForEvent(eventId, userId) {
  return !!db.prepare('SELECT 1 FROM event_registrations WHERE event_id=? AND user_id=?').get(eventId, userId);
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export function createProduct({ id, groupId, creatorId, name, description, price, productType, imageEmoji, stock }) {
  db.prepare('INSERT INTO products (id,group_id,creator_id,name,description,price,product_type,image_emoji,stock,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, groupId, creatorId, name, description||'', price||0, productType||'PHYSICAL', imageEmoji||'📦', stock||-1, new Date().toISOString());
  return getProduct(id);
}
export function getProduct(id) {
  const p = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  return p ? fmt.product(p) : null;
}
export function getGroupProducts(groupId) {
  return db.prepare('SELECT * FROM products WHERE group_id=? ORDER BY created_at DESC').all(groupId).map(fmt.product);
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────────

export function createCampaign({ id, groupId, creatorId, title, goal, description, targetAgeGroups, targetCity, startDate, endDate }) {
  db.prepare('INSERT INTO campaigns (id,group_id,creator_id,title,goal,description,target_age_groups,target_city,start_date,end_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, groupId, creatorId, title, goal||'AWARENESS', description||'', JSON.stringify(targetAgeGroups||[]), targetCity||'', startDate, endDate, new Date().toISOString());
  return getCampaign(id);
}
export function getCampaign(id) {
  const c = db.prepare('SELECT * FROM campaigns WHERE id=?').get(id);
  return c ? fmt.campaign(c) : null;
}
export function getGroupCampaigns(groupId) {
  return db.prepare('SELECT * FROM campaigns WHERE group_id=? ORDER BY created_at DESC').all(groupId).map(fmt.campaign);
}

// ── WALLET ────────────────────────────────────────────────────────────────────

export function getWallet(userId) {
  let w = db.prepare('SELECT * FROM wallet WHERE user_id=?').get(userId);
  if (!w) { db.prepare('INSERT OR IGNORE INTO wallet (user_id, coins) VALUES (?,0)').run(userId); w = { user_id: userId, coins: 0 }; }
  return { userId: w.user_id, coins: w.coins };
}
export function addCoins(userId, amount) {
  db.prepare('INSERT INTO wallet (user_id, coins) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET coins=coins+?').run(userId, amount, amount);
  return getWallet(userId);
}

// ── PARENT / CHILD ────────────────────────────────────────────────────────────

export function linkParentChild(parentId, childId) {
  db.prepare('INSERT OR IGNORE INTO parent_child (parent_id, child_id, approved) VALUES (?,?,1)').run(parentId, childId);
}
export function getChildren(parentId) {
  return db.prepare('SELECT u.* FROM users u JOIN parent_child pc ON u.id=pc.child_id WHERE pc.parent_id=? AND pc.approved=1').all(parentId).map(fmt.user);
}

// ── FORMATTERS ────────────────────────────────────────────────────────────────

const fmt = {
  user: u => ({
    ...u,
    interests: JSON.parse(u.interests || '[]'),
    avatarColor: u.avatar_color,
    ageGroup: u.age_group,
    notificationPrefs: JSON.parse(u.notification_prefs || '{}'),
    createdAt: u.created_at,
  }),
  group: g => ({
    ...g,
    tags: JSON.parse(g.tags || '[]'),
    ageGroups: JSON.parse(g.age_groups || '["KIDS","TEENS","ADULTS","SENIORS"]'),
    maxMembers: g.max_members,
    creatorId: g.creator_id,
    scheduleDay: g.schedule_day,
    scheduleTime: g.schedule_time,
    scheduleFrequency: g.schedule_frequency,
    scheduleDuration: g.schedule_duration,
    createdAt: g.created_at,
  }),
  message: m => ({ ...m, senderId: m.sender_id, groupId: m.group_id, createdAt: m.created_at }),
  notification: n => ({ ...n, userId: n.user_id, groupId: n.group_id, actorId: n.actor_id, isRead: !!n.is_read, scheduledFor: n.scheduled_for, createdAt: n.created_at }),
  event: e => ({ ...e, groupId: e.group_id, creatorId: e.creator_id, videoUrl: e.video_url, startsAt: e.starts_at, durationMins: e.duration_mins, ticketPrice: e.ticket_price, createdAt: e.created_at }),
  product: p => ({ ...p, groupId: p.group_id, creatorId: p.creator_id, productType: p.product_type, imageEmoji: p.image_emoji, createdAt: p.created_at }),
  campaign: c => ({ ...c, groupId: c.group_id, creatorId: c.creator_id, targetAgeGroups: JSON.parse(c.target_age_groups || '[]'), targetCity: c.target_city, startDate: c.start_date, endDate: c.end_date, createdAt: c.created_at }),
};

export default db;
