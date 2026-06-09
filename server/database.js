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
    currency TEXT DEFAULT 'GBP',
    locale TEXT DEFAULT 'en-GB',
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

  CREATE TABLE IF NOT EXISTS experts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    headline TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    service_type TEXT DEFAULT 'BOTH',
    hourly_rate INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    languages TEXT DEFAULT '["en"]',
    countries TEXT DEFAULT '[]',
    is_elder_support INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    availability TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expert_bookings (
    id TEXT PRIMARY KEY,
    expert_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    service_type TEXT DEFAULT 'PAID',
    scheduled_at TEXT NOT NULL,
    duration_mins INTEGER DEFAULT 60,
    amount INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    status TEXT DEFAULT 'PENDING',
    notes TEXT DEFAULT '',
    meeting_url TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (expert_id) REFERENCES experts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expert_reviews (
    id TEXT PRIMARY KEY,
    expert_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    booking_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (expert_id) REFERENCES experts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── Migrations — add columns that may not exist in older DBs ─────────────────
const runMigration = (sql) => { try { db.exec(sql); } catch (_) {} };
runMigration(`ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'GBP'`);
runMigration(`ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en-GB'`);
runMigration(`ALTER TABLE experts ADD COLUMN is_elder_support INTEGER DEFAULT 0`);
runMigration(`ALTER TABLE experts ADD COLUMN languages TEXT DEFAULT '["en"]'`);
runMigration(`ALTER TABLE experts ADD COLUMN countries TEXT DEFAULT '[]'`);

// ── USER ──────────────────────────────────────────────────────────────────────

export function getUser(id) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return u ? fmt.user(u) : null;
}
export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}
export function createUser(data) {
  const { id, name, email, password, avatarColor, age, ageGroup, theme, currency, locale, createdAt } = data;
  db.prepare(
    'INSERT INTO users (id,name,email,password,avatar_color,age,age_group,theme,currency,locale,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(id, name, email, password, avatarColor, age, ageGroup, theme, currency||'GBP', locale||'en-GB', createdAt);
  return getUser(id);
}
export function updateUser(id, fields) {
  const allowed = ['bio', 'interests', 'age', 'age_group', 'theme', 'building', 'neighborhood', 'city', 'country', 'language', 'currency', 'locale', 'notification_prefs'];
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

// ── EXPERTS ───────────────────────────────────────────────────────────────────

export function registerExpert({ id, userId, headline, bio, skills, serviceType, hourlyRate, currency, languages, countries, isElderSupport, availability }) {
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO experts (id,user_id,headline,bio,skills,service_type,hourly_rate,currency,languages,countries,is_elder_support,availability,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(id, userId, headline||'', bio||'', JSON.stringify(skills||[]), serviceType||'BOTH', hourlyRate||0, currency||'GBP', JSON.stringify(languages||['en']), JSON.stringify(countries||[]), isElderSupport?1:0, availability||'', now);
  return getExpert(id);
}
export function getExpert(id) {
  const e = db.prepare('SELECT * FROM experts WHERE id=?').get(id);
  return e ? fmt.expert(e) : null;
}
export function getExpertByUser(userId) {
  const e = db.prepare('SELECT * FROM experts WHERE user_id=?').get(userId);
  return e ? fmt.expert(e) : null;
}
export function updateExpert(id, fields) {
  const allowed = ['headline','bio','skills','service_type','hourly_rate','currency','languages','countries','is_elder_support','availability','is_verified'];
  const map = { skills: v => JSON.stringify(v), languages: v => JSON.stringify(v), countries: v => JSON.stringify(v) };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k) || v === undefined) continue;
    const val = map[k] ? map[k](v) : v;
    db.prepare(`UPDATE experts SET ${k} = ? WHERE id = ?`).run(val, id);
  }
  return getExpert(id);
}
export function searchExperts({ skill, isElderSupport, country, serviceType, limit = 50 } = {}) {
  let rows = db.prepare('SELECT * FROM experts').all();
  if (skill) rows = rows.filter(e => {
    const skills = JSON.parse(e.skills || '[]');
    return skills.some(s => s.toLowerCase().includes(skill.toLowerCase()));
  });
  if (isElderSupport) rows = rows.filter(e => e.is_elder_support === 1);
  if (country) rows = rows.filter(e => {
    const countries = JSON.parse(e.countries || '[]');
    return countries.length === 0 || countries.includes(country);
  });
  if (serviceType && serviceType !== 'BOTH') rows = rows.filter(e => e.service_type === serviceType || e.service_type === 'BOTH');
  return rows.slice(0, limit).map(fmt.expert);
}

export function createBooking({ id, expertId, userId, skill, serviceType, scheduledAt, durationMins, amount, currency, notes }) {
  db.prepare(
    'INSERT INTO expert_bookings (id,expert_id,user_id,skill,service_type,scheduled_at,duration_mins,amount,currency,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(id, expertId, userId, skill, serviceType||'PAID', scheduledAt, durationMins||60, amount||0, currency||'GBP', notes||'', new Date().toISOString());
  return getBooking(id);
}
export function getBooking(id) {
  const b = db.prepare('SELECT * FROM expert_bookings WHERE id=?').get(id);
  return b ? fmt.booking(b) : null;
}
export function getUserBookings(userId) {
  return db.prepare('SELECT * FROM expert_bookings WHERE user_id=? ORDER BY scheduled_at ASC').all(userId).map(fmt.booking);
}
export function getExpertBookings(expertId) {
  return db.prepare('SELECT * FROM expert_bookings WHERE expert_id=? ORDER BY scheduled_at ASC').all(expertId).map(fmt.booking);
}
export function updateBookingStatus(id, status, meetingUrl) {
  db.prepare('UPDATE expert_bookings SET status=?, meeting_url=? WHERE id=?').run(status, meetingUrl||'', id);
  return getBooking(id);
}

export function createReview({ id, expertId, userId, bookingId, rating, comment }) {
  db.prepare('INSERT INTO expert_reviews (id,expert_id,user_id,booking_id,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)').run(id, expertId, userId, bookingId, rating, comment||'', new Date().toISOString());
  db.prepare('UPDATE experts SET rating_sum=rating_sum+?, rating_count=rating_count+1, total_sessions=total_sessions+1 WHERE id=?').run(rating, expertId);
  return getExpert(expertId);
}
export function getExpertReviews(expertId) {
  return db.prepare('SELECT * FROM expert_reviews WHERE expert_id=? ORDER BY created_at DESC LIMIT 20').all(expertId);
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
    currency: u.currency || 'GBP',
    locale: u.locale || 'en-GB',
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
  expert: e => ({
    ...e,
    userId: e.user_id,
    skills: JSON.parse(e.skills || '[]'),
    serviceType: e.service_type,
    hourlyRate: e.hourly_rate,
    languages: JSON.parse(e.languages || '["en"]'),
    countries: JSON.parse(e.countries || '[]'),
    isElderSupport: !!e.is_elder_support,
    isVerified: !!e.is_verified,
    ratingAvg: e.rating_count > 0 ? Math.round((e.rating_sum / e.rating_count) * 10) / 10 : null,
    ratingCount: e.rating_count,
    totalSessions: e.total_sessions,
    createdAt: e.created_at,
  }),
  booking: b => ({
    ...b,
    expertId: b.expert_id,
    userId: b.user_id,
    serviceType: b.service_type,
    scheduledAt: b.scheduled_at,
    durationMins: b.duration_mins,
    meetingUrl: b.meeting_url,
    createdAt: b.created_at,
  }),
};

export default db;
