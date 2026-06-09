// ── PostgreSQL database layer ─────────────────────────────────────────────────
// Uses the `pg` package. Set DATABASE_URL in Railway / .env
// Supabase, Railway Postgres, or any standard Postgres connection string works.
//
// LOCAL DEV: copy .env.example → .env and fill DATABASE_URL, then run:
//   node scripts/migrate.js     ← creates all tables once
// ─────────────────────────────────────────────────────────────────────────────

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false }, // required for Railway / Supabase SSL
});

// Convenience: run a query and return rows
const query = (text, params) => pool.query(text, params);

// Run all CREATE TABLE IF NOT EXISTS statements on startup
export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT DEFAULT '',
      interests TEXT DEFAULT '[]',
      avatar_color TEXT NOT NULL DEFAULT '#6366f1',
      age INTEGER DEFAULT NULL,
      age_group TEXT DEFAULT 'ADULTS',
      theme TEXT DEFAULT 'STANDARD',
      role TEXT DEFAULT 'USER',
      building TEXT DEFAULT '',
      neighborhood TEXT DEFAULT '',
      city TEXT DEFAULT '',
      country TEXT DEFAULT '',
      lat REAL DEFAULT NULL,
      lng REAL DEFAULT NULL,
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
      creator_id TEXT NOT NULL REFERENCES users(id),
      age_groups TEXT DEFAULT '["KIDS","TEENS","ADULTS","SENIORS"]',
      building TEXT DEFAULT '',
      neighborhood TEXT DEFAULT '',
      city TEXT DEFAULT '',
      country TEXT DEFAULT '',
      schedule_day TEXT DEFAULT '',
      schedule_time TEXT DEFAULT '',
      schedule_frequency TEXT DEFAULT '',
      schedule_duration INTEGER DEFAULT 60,
      is_seeded BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      discount_pct INTEGER NOT NULL DEFAULT 10,
      max_uses INTEGER NOT NULL DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      group_id TEXT DEFAULT NULL,
      seller_id TEXT NOT NULL REFERENCES users(id),
      expires_at TEXT DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      joined_at TEXT NOT NULL,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'TEXT',
      video_url TEXT DEFAULT '',
      sender_id TEXT NOT NULL REFERENCES users(id),
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      group_id TEXT DEFAULT NULL,
      actor_id TEXT DEFAULT NULL,
      scheduled_for TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buddy_requests (
      id TEXT PRIMARY KEY,
      from_id TEXT NOT NULL REFERENCES users(id),
      to_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      from_id TEXT NOT NULL REFERENCES users(id),
      to_id TEXT NOT NULL REFERENCES users(id),
      group_id TEXT,
      amount INTEGER NOT NULL DEFAULT 1,
      message TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      starts_at TEXT NOT NULL,
      duration_mins INTEGER DEFAULT 60,
      capacity INTEGER DEFAULT 50,
      ticket_price INTEGER DEFAULT 0,
      status TEXT DEFAULT 'UPCOMING',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      registered_at TEXT NOT NULL,
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL DEFAULT 0,
      product_type TEXT DEFAULT 'PHYSICAL',
      image_emoji TEXT DEFAULT '📦',
      stock INTEGER DEFAULT -1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      goal TEXT DEFAULT 'AWARENESS',
      description TEXT DEFAULT '',
      target_age_groups TEXT DEFAULT '[]',
      target_city TEXT DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      coins INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS parent_child (
      parent_id TEXT NOT NULL REFERENCES users(id),
      child_id TEXT NOT NULL REFERENCES users(id),
      approved BOOLEAN DEFAULT TRUE,
      PRIMARY KEY (parent_id, child_id)
    );

    CREATE TABLE IF NOT EXISTS experts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      headline TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      skills TEXT DEFAULT '[]',
      service_type TEXT DEFAULT 'BOTH',
      hourly_rate INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'GBP',
      languages TEXT DEFAULT '["en"]',
      countries TEXT DEFAULT '[]',
      is_elder_support BOOLEAN DEFAULT FALSE,
      rating_sum INTEGER DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      availability TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expert_bookings (
      id TEXT PRIMARY KEY,
      expert_id TEXT NOT NULL REFERENCES experts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      skill TEXT NOT NULL,
      service_type TEXT DEFAULT 'PAID',
      scheduled_at TEXT NOT NULL,
      duration_mins INTEGER DEFAULT 60,
      amount INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'GBP',
      status TEXT DEFAULT 'PENDING',
      notes TEXT DEFAULT '',
      meeting_url TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expert_reviews (
      id TEXT PRIMARY KEY,
      expert_id TEXT NOT NULL REFERENCES experts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      booking_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  console.log('✅ PostgreSQL tables ready');
}

// ── USER ──────────────────────────────────────────────────────────────────────

export async function getUser(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ? fmt.user(rows[0]) : null;
}
export async function getUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}
export async function createUser(data) {
  const { id, name, email, password, avatarColor, age, ageGroup, theme, currency, locale, lat, lng, createdAt } = data;
  await query(
    'INSERT INTO users (id,name,email,password,avatar_color,age,age_group,theme,currency,locale,lat,lng,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [id, name, email, password, avatarColor, age, ageGroup, theme, currency||'GBP', locale||'en-GB', lat||null, lng||null, createdAt]
  );
  return getUser(id);
}
export async function setUserRole(id, role) {
  await query('UPDATE users SET role=$1 WHERE id=$2', [role, id]);
  return getUser(id);
}
export async function getAdminStats() {
  const [users, groups, messages, experts, bookings, coupons] = await Promise.all([
    query('SELECT COUNT(*) as c FROM users'),
    query('SELECT COUNT(*) as c FROM groups'),
    query('SELECT COUNT(*) as c FROM messages'),
    query('SELECT COUNT(*) as c FROM experts'),
    query('SELECT COUNT(*) as c FROM expert_bookings'),
    query('SELECT COUNT(*) as c FROM coupons'),
  ]);
  const { rows: recentUsers } = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
  const { rows: recentGroups } = await query('SELECT * FROM groups ORDER BY created_at DESC LIMIT 10');
  return {
    totalUsers: parseInt(users.rows[0].c),
    totalGroups: parseInt(groups.rows[0].c),
    totalMessages: parseInt(messages.rows[0].c),
    totalExperts: parseInt(experts.rows[0].c),
    totalBookings: parseInt(bookings.rows[0].c),
    totalCoupons: parseInt(coupons.rows[0].c),
    recentUsers: recentUsers.map(fmt.user),
    recentGroups: recentGroups.map(fmt.group),
  };
}
export async function getAdminUsers({ search, role } = {}) {
  let q = 'SELECT * FROM users WHERE 1=1';
  const p = []; let idx = 1;
  if (search) { q += ` AND (name ILIKE $${idx} OR email ILIKE $${idx++})`; p.push(`%${search}%`); }
  if (role) { q += ` AND role=$${idx++}`; p.push(role); }
  q += ' ORDER BY created_at DESC LIMIT 100';
  const { rows } = await query(q, p);
  return rows.map(fmt.user);
}
export async function updateUser(id, fields) {
  const allowed = ['bio','interests','age','age_group','theme','role','building','neighborhood','city','country','lat','lng','language','currency','locale','notification_prefs'];
  const map = { interests: v => JSON.stringify(v), notification_prefs: v => JSON.stringify(v) };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k) || v === undefined) continue;
    const val = map[k] ? map[k](v) : v;
    await query(`UPDATE users SET ${k} = $1 WHERE id = $2`, [val, id]);
  }
  return getUser(id);
}
export async function findFolks({ interests = [], city, building, excludeId, ageGroup }) {
  const { rows } = await query('SELECT * FROM users WHERE id != $1', [excludeId || '']);
  let list = rows;
  if (city) list = list.filter(u => u.city?.toLowerCase() === city.toLowerCase());
  if (building) list = list.filter(u => u.building?.toLowerCase() === building.toLowerCase());
  if (ageGroup) list = list.filter(u => u.age_group === ageGroup);
  return list.map(u => {
    const uInterests = JSON.parse(u.interests || '[]');
    const overlap = interests.filter(i => uInterests.includes(i)).length;
    let proximity = 0;
    if (building && u.building?.toLowerCase() === building.toLowerCase()) proximity = 3;
    else if (city && u.city?.toLowerCase() === city.toLowerCase()) proximity = 1;
    return { ...fmt.user(u), _score: overlap * 2 + proximity };
  }).filter(u => u._score > 0).sort((a, b) => b._score - a._score).slice(0, 30);
}

// ── GROUP ─────────────────────────────────────────────────────────────────────

export async function getGroup(id) {
  const { rows } = await query('SELECT * FROM groups WHERE id = $1', [id]);
  return rows[0] ? fmt.group(rows[0]) : null;
}
export async function getGroups({ category, search, city, building, ageGroup } = {}) {
  let q = 'SELECT * FROM groups WHERE 1=1';
  const p = [];
  let idx = 1;
  if (category && category !== 'All') { q += ` AND category = $${idx++}`; p.push(category); }
  if (search) { q += ` AND (name ILIKE $${idx} OR description ILIKE $${idx++})`; p.push(`%${search}%`); }
  if (city) { q += ` AND (city = $${idx++} OR city = '')`; p.push(city); }
  if (building) { q += ` AND (building = $${idx++} OR building = '')`; p.push(building); }
  q += ' ORDER BY created_at DESC';
  const { rows } = await query(q, p);
  let list = rows.map(fmt.group);
  if (ageGroup) list = list.filter(g => g.ageGroups.includes(ageGroup) || g.ageGroups.length === 0);
  return list;
}
export async function createGroup(data) {
  const { id, name, description, category, tags, maxMembers, creatorId, ageGroups, building, neighborhood, city, country, scheduleDay, scheduleTime, scheduleFrequency, scheduleDuration, createdAt } = data;
  await query(
    'INSERT INTO groups (id,name,description,category,tags,max_members,creator_id,age_groups,building,neighborhood,city,country,schedule_day,schedule_time,schedule_frequency,schedule_duration,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
    [id, name, description, category, JSON.stringify(tags), maxMembers, creatorId, JSON.stringify(ageGroups), building||'', neighborhood||'', city||'', country||'', scheduleDay||'', scheduleTime||'', scheduleFrequency||'', scheduleDuration||60, createdAt]
  );
  await query('INSERT INTO group_members (group_id,user_id,joined_at) VALUES ($1,$2,$3)', [id, creatorId, createdAt]);
  return getGroup(id);
}
export async function getGroupMembers(groupId) {
  const { rows } = await query('SELECT u.* FROM users u JOIN group_members gm ON u.id=gm.user_id WHERE gm.group_id=$1 ORDER BY gm.joined_at', [groupId]);
  return rows.map(fmt.user);
}
export async function getMemberCount(groupId) {
  const { rows } = await query('SELECT COUNT(*) as c FROM group_members WHERE group_id=$1', [groupId]);
  return parseInt(rows[0].c);
}
export async function isMember(groupId, userId) {
  const { rows } = await query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, userId]);
  return rows.length > 0;
}
export async function joinGroup(groupId, userId) {
  await query('INSERT INTO group_members (group_id,user_id,joined_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [groupId, userId, new Date().toISOString()]);
  return getGroup(groupId);
}
export async function leaveGroup(groupId, userId) {
  await query('DELETE FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, userId]);
  return getGroup(groupId);
}
export async function getUserGroups(userId) {
  const { rows } = await query('SELECT g.* FROM groups g JOIN group_members gm ON g.id=gm.group_id WHERE gm.user_id=$1 ORDER BY gm.joined_at DESC', [userId]);
  return rows.map(fmt.group);
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export async function getGroupMessages(groupId, limit = 80) {
  const { rows } = await query('SELECT * FROM messages WHERE group_id=$1 ORDER BY created_at ASC LIMIT $2', [groupId, limit]);
  return rows.map(fmt.message);
}
export async function createMessage({ id, content, messageType, videoUrl, senderId, groupId, createdAt }) {
  await query('INSERT INTO messages (id,content,message_type,video_url,sender_id,group_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, content, messageType||'TEXT', videoUrl||'', senderId, groupId, createdAt]);
  const { rows } = await query('SELECT * FROM messages WHERE id=$1', [id]);
  return fmt.message(rows[0]);
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export async function createNotification({ id, userId, type, title, message, groupId, actorId, scheduledFor }) {
  const now = new Date().toISOString();
  await query(
    'INSERT INTO notifications (id,user_id,type,title,message,group_id,actor_id,scheduled_for,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, userId, type, title, message, groupId||null, actorId||null, scheduledFor||null, now]
  );
}
export async function getUserNotifications(userId) {
  const { rows } = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [userId]);
  return rows.map(fmt.notification);
}
export async function markNotificationsRead(userId) {
  await query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [userId]);
}
export async function getUnreadCount(userId) {
  const { rows } = await query('SELECT COUNT(*) as c FROM notifications WHERE user_id=$1 AND is_read=FALSE', [userId]);
  return parseInt(rows[0].c);
}

// ── BUDDIES ───────────────────────────────────────────────────────────────────

export async function sendBuddyRequest({ id, fromId, toId, createdAt }) {
  await query('INSERT INTO buddy_requests (id,from_id,to_id,status,created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [id, fromId, toId, 'pending', createdAt]);
}
export async function getBuddyStatus(fromId, toId) {
  const { rows } = await query('SELECT status FROM buddy_requests WHERE (from_id=$1 AND to_id=$2) OR (from_id=$2 AND to_id=$1)', [fromId, toId]);
  return rows[0]?.status || null;
}

// ── TIPS ──────────────────────────────────────────────────────────────────────

export async function sendTip({ id, fromId, toId, groupId, amount, message }) {
  await query('INSERT INTO tips (id,from_id,to_id,group_id,amount,message,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, fromId, toId, groupId||null, amount, message||'', new Date().toISOString()]);
}
export async function getTipsForUser(userId) {
  const { rows } = await query('SELECT * FROM tips WHERE to_id=$1 ORDER BY created_at DESC LIMIT 50', [userId]);
  return rows;
}
export async function getTipsTotal(userId) {
  const { rows } = await query('SELECT COALESCE(SUM(amount),0) as total FROM tips WHERE to_id=$1', [userId]);
  return parseInt(rows[0].total);
}

// ── EVENTS ────────────────────────────────────────────────────────────────────

export async function createEvent({ id, groupId, creatorId, title, description, videoUrl, startsAt, durationMins, capacity, ticketPrice }) {
  await query(
    'INSERT INTO events (id,group_id,creator_id,title,description,video_url,starts_at,duration_mins,capacity,ticket_price,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [id, groupId, creatorId, title, description||'', videoUrl||'', startsAt, durationMins||60, capacity||50, ticketPrice||0, new Date().toISOString()]
  );
  return getEvent(id);
}
export async function getEvent(id) {
  const { rows } = await query('SELECT * FROM events WHERE id=$1', [id]);
  return rows[0] ? fmt.event(rows[0]) : null;
}
export async function getGroupEvents(groupId) {
  const { rows } = await query('SELECT * FROM events WHERE group_id=$1 ORDER BY starts_at ASC', [groupId]);
  return rows.map(fmt.event);
}
export async function registerForEvent(eventId, userId) {
  await query('INSERT INTO event_registrations (event_id,user_id,registered_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [eventId, userId, new Date().toISOString()]);
}
export async function unregisterFromEvent(eventId, userId) {
  await query('DELETE FROM event_registrations WHERE event_id=$1 AND user_id=$2', [eventId, userId]);
}
export async function getEventRegistrationCount(eventId) {
  const { rows } = await query('SELECT COUNT(*) as c FROM event_registrations WHERE event_id=$1', [eventId]);
  return parseInt(rows[0].c);
}
export async function isRegisteredForEvent(eventId, userId) {
  const { rows } = await query('SELECT 1 FROM event_registrations WHERE event_id=$1 AND user_id=$2', [eventId, userId]);
  return rows.length > 0;
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export async function createProduct({ id, groupId, creatorId, name, description, price, productType, imageEmoji, stock }) {
  await query(
    'INSERT INTO products (id,group_id,creator_id,name,description,price,product_type,image_emoji,stock,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [id, groupId, creatorId, name, description||'', price||0, productType||'PHYSICAL', imageEmoji||'📦', stock||-1, new Date().toISOString()]
  );
  return getProduct(id);
}
export async function getProduct(id) {
  const { rows } = await query('SELECT * FROM products WHERE id=$1', [id]);
  return rows[0] ? fmt.product(rows[0]) : null;
}
export async function getGroupProducts(groupId) {
  const { rows } = await query('SELECT * FROM products WHERE group_id=$1 ORDER BY created_at DESC', [groupId]);
  return rows.map(fmt.product);
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────────

export async function createCampaign({ id, groupId, creatorId, title, goal, description, targetAgeGroups, targetCity, startDate, endDate }) {
  await query(
    'INSERT INTO campaigns (id,group_id,creator_id,title,goal,description,target_age_groups,target_city,start_date,end_date,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [id, groupId, creatorId, title, goal||'AWARENESS', description||'', JSON.stringify(targetAgeGroups||[]), targetCity||'', startDate, endDate, new Date().toISOString()]
  );
  return getCampaign(id);
}
export async function getCampaign(id) {
  const { rows } = await query('SELECT * FROM campaigns WHERE id=$1', [id]);
  return rows[0] ? fmt.campaign(rows[0]) : null;
}
export async function getGroupCampaigns(groupId) {
  const { rows } = await query('SELECT * FROM campaigns WHERE group_id=$1 ORDER BY created_at DESC', [groupId]);
  return rows.map(fmt.campaign);
}

// ── EXPERTS ───────────────────────────────────────────────────────────────────

export async function registerExpert({ id, userId, headline, bio, skills, serviceType, hourlyRate, currency, languages, countries, isElderSupport, availability }) {
  const now = new Date().toISOString();
  await query(
    'INSERT INTO experts (id,user_id,headline,bio,skills,service_type,hourly_rate,currency,languages,countries,is_elder_support,availability,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [id, userId, headline||'', bio||'', JSON.stringify(skills||[]), serviceType||'BOTH', hourlyRate||0, currency||'GBP', JSON.stringify(languages||['en']), JSON.stringify(countries||[]), isElderSupport||false, availability||'', now]
  );
  return getExpert(id);
}
export async function getExpert(id) {
  const { rows } = await query('SELECT * FROM experts WHERE id=$1', [id]);
  return rows[0] ? fmt.expert(rows[0]) : null;
}
export async function getExpertByUser(userId) {
  const { rows } = await query('SELECT * FROM experts WHERE user_id=$1', [userId]);
  return rows[0] ? fmt.expert(rows[0]) : null;
}
export async function updateExpert(id, fields) {
  const allowed = ['headline','bio','skills','service_type','hourly_rate','currency','languages','countries','is_elder_support','availability','is_verified'];
  const map = { skills: v => JSON.stringify(v), languages: v => JSON.stringify(v), countries: v => JSON.stringify(v) };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k) || v === undefined) continue;
    const val = map[k] ? map[k](v) : v;
    await query(`UPDATE experts SET ${k} = $1 WHERE id = $2`, [val, id]);
  }
  return getExpert(id);
}
export async function searchExperts({ skill, isElderSupport, country, serviceType, limit = 50 } = {}) {
  const { rows } = await query('SELECT * FROM experts', []);
  let list = rows;
  if (skill) list = list.filter(e => JSON.parse(e.skills||'[]').some(s => s.toLowerCase().includes(skill.toLowerCase())));
  if (isElderSupport) list = list.filter(e => e.is_elder_support);
  if (country) list = list.filter(e => { const c = JSON.parse(e.countries||'[]'); return c.length === 0 || c.includes(country); });
  if (serviceType && serviceType !== 'BOTH') list = list.filter(e => e.service_type === serviceType || e.service_type === 'BOTH');
  return list.slice(0, limit).map(fmt.expert);
}
export async function createBooking({ id, expertId, userId, skill, serviceType, scheduledAt, durationMins, amount, currency, notes }) {
  await query(
    'INSERT INTO expert_bookings (id,expert_id,user_id,skill,service_type,scheduled_at,duration_mins,amount,currency,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [id, expertId, userId, skill, serviceType||'PAID', scheduledAt, durationMins||60, amount||0, currency||'GBP', notes||'', new Date().toISOString()]
  );
  return getBooking(id);
}
export async function getBooking(id) {
  const { rows } = await query('SELECT * FROM expert_bookings WHERE id=$1', [id]);
  return rows[0] ? fmt.booking(rows[0]) : null;
}
export async function getUserBookings(userId) {
  const { rows } = await query('SELECT * FROM expert_bookings WHERE user_id=$1 ORDER BY scheduled_at ASC', [userId]);
  return rows.map(fmt.booking);
}
export async function getExpertBookings(expertId) {
  const { rows } = await query('SELECT * FROM expert_bookings WHERE expert_id=$1 ORDER BY scheduled_at ASC', [expertId]);
  return rows.map(fmt.booking);
}
export async function updateBookingStatus(id, status, meetingUrl) {
  await query('UPDATE expert_bookings SET status=$1, meeting_url=$2 WHERE id=$3', [status, meetingUrl||'', id]);
  return getBooking(id);
}
export async function createReview({ id, expertId, userId, bookingId, rating, comment }) {
  await query('INSERT INTO expert_reviews (id,expert_id,user_id,booking_id,rating,comment,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, expertId, userId, bookingId, rating, comment||'', new Date().toISOString()]);
  await query('UPDATE experts SET rating_sum=rating_sum+$1, rating_count=rating_count+1, total_sessions=total_sessions+1 WHERE id=$2', [rating, expertId]);
  return getExpert(expertId);
}
export async function getExpertReviews(expertId) {
  const { rows } = await query('SELECT * FROM expert_reviews WHERE expert_id=$1 ORDER BY created_at DESC LIMIT 20', [expertId]);
  return rows;
}

// ── COUPONS ───────────────────────────────────────────────────────────────────

export async function createCoupon({ id, code, description, discountPct, maxUses, groupId, sellerId, expiresAt }) {
  const now = new Date().toISOString();
  await query(
    'INSERT INTO coupons (id,code,description,discount_pct,max_uses,group_id,seller_id,expires_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, code.toUpperCase(), description||'', discountPct||10, maxUses||100, groupId||null, sellerId, expiresAt||null, now]
  );
  return getCoupon(id);
}
export async function getCoupon(id) {
  const { rows } = await query('SELECT * FROM coupons WHERE id=$1', [id]);
  return rows[0] ? fmt.coupon(rows[0]) : null;
}
export async function getCouponByCode(code) {
  const { rows } = await query('SELECT * FROM coupons WHERE code=$1 AND is_active=TRUE', [code.toUpperCase()]);
  return rows[0] ? fmt.coupon(rows[0]) : null;
}
export async function getSellerCoupons(sellerId) {
  const { rows } = await query('SELECT * FROM coupons WHERE seller_id=$1 ORDER BY created_at DESC', [sellerId]);
  return rows.map(fmt.coupon);
}
export async function deleteCoupon(id) {
  await query('UPDATE coupons SET is_active=FALSE WHERE id=$1', [id]);
}
export async function useCoupon(code) {
  await query('UPDATE coupons SET used_count=used_count+1 WHERE code=$1', [code.toUpperCase()]);
}

// ── SEED GROUPS ───────────────────────────────────────────────────────────────

const SEED_GROUPS = [
  { name:'🎸 Global Guitar Circle', description:'Acoustic and electric guitar players from all levels. Share tabs, tips, and jam sessions.', category:'Music', tags:['Guitar','Music','Acoustic','Electric'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'♟️ International Chess Club', description:'Weekly chess matches, strategy discussions, and puzzles. All ELO ratings welcome.', category:'Gaming', tags:['Chess','Strategy','Tournaments'], ageGroups:['KIDS','TEENS','ADULTS','SENIORS'] },
  { name:'🎨 Watercolour Artists Network', description:'Share your watercolour works, get feedback, learn techniques from fellow artists worldwide.', category:'Art & Design', tags:['Watercolour','Painting','Art'], ageGroups:['KIDS','TEENS','ADULTS','SENIORS'] },
  { name:'🌱 Community Gardeners', description:'Urban gardening, balcony plants, composting, and growing your own food. All climates welcome.', category:'Gardening', tags:['Gardening','Urban','Vegetables','Sustainability'], ageGroups:['ADULTS','SENIORS'] },
  { name:'📚 Book Lovers Worldwide', description:'Monthly book picks, discussion threads, and reading challenges for fiction and non-fiction lovers.', category:'Reading', tags:['Books','Fiction','Non-fiction','Discussion'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'💻 Young Coders Club', description:'Kids and teens learning to code. Scratch, Python, web development — learn together and build cool things.', category:'Programming', tags:['Coding','Python','Scratch','Web'], ageGroups:['KIDS','TEENS'] },
  { name:'🧘 Morning Yoga & Wellness', description:'Daily yoga, breathwork, and mindfulness sessions. Beginners to advanced, all bodies welcome.', category:'Sports', tags:['Yoga','Wellness','Mindfulness','Fitness'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'🍳 Home Chefs & Foodies', description:'Share recipes, cooking tips, food photography, and host virtual cook-alongs with cooks worldwide.', category:'Cooking', tags:['Cooking','Recipes','Food','Baking'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'📸 Photography Collective', description:'Share your shots, discuss gear, run photo challenges, and give constructive feedback on compositions.', category:'Photography', tags:['Photography','Camera','Editing','Portraits'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'✍️ Creative Writers Circle', description:'Fiction, poetry, screenplays — share your work, get feedback, and find writing accountability partners.', category:'Writing', tags:['Writing','Fiction','Poetry','Creative'], ageGroups:['TEENS','ADULTS','SENIORS'] },
  { name:'🎭 Drama & Theatre Kids', description:'Script reading, improv games, and performance skills for young actors aged 8–16.', category:'Other', tags:['Drama','Theatre','Acting','Improv'], ageGroups:['KIDS','TEENS'] },
  { name:'🏃 Running & Fitness Crew', description:'Training plans, race prep, and motivation for runners of all paces. Couch to 5K welcome!', category:'Sports', tags:['Running','Fitness','5K','Marathon'], ageGroups:['TEENS','ADULTS'] },
  { name:'🎵 Seniors Music & Memory', description:'Music appreciation, singing, and gentle music-making for older adults. A warm, supportive community.', category:'Music', tags:['Music','Seniors','Singing','Memory'], ageGroups:['SENIORS'] },
  { name:'🔬 Science Explorers (Kids)', description:'Fun science experiments, nature exploration, and curiosity-driven learning for 6–12 year olds.', category:'Science', tags:['Science','Experiments','Nature','Kids'], ageGroups:['KIDS'] },
  { name:'💃 Dance Enthusiasts Global', description:'Ballet, contemporary, Bollywood, hip-hop — share videos, find virtual classes, and celebrate movement.', category:'Dance', tags:['Dance','Ballet','Bollywood','HipHop'], ageGroups:['KIDS','TEENS','ADULTS','SENIORS'] },
];

export async function seedGroups(systemUserId) {
  const { rows: existing } = await query('SELECT COUNT(*) as c FROM groups WHERE is_seeded=TRUE');
  if (parseInt(existing[0].c) > 0) return false; // already seeded
  const now = new Date().toISOString();
  for (const g of SEED_GROUPS) {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await query(
      'INSERT INTO groups (id,name,description,category,tags,max_members,creator_id,age_groups,building,neighborhood,city,country,is_seeded,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id, g.name, g.description, g.category, JSON.stringify(g.tags), 500, systemUserId, JSON.stringify(g.ageGroups), '', '', '', '', true, now]
    );
  }
  return true;
}

// ── WALLET ────────────────────────────────────────────────────────────────────

export async function getWallet(userId) {
  let { rows } = await query('SELECT * FROM wallet WHERE user_id=$1', [userId]);
  if (!rows[0]) {
    await query('INSERT INTO wallet (user_id, coins) VALUES ($1,0) ON CONFLICT DO NOTHING', [userId]);
    rows = [{ user_id: userId, coins: 0 }];
  }
  return { userId: rows[0].user_id, coins: parseInt(rows[0].coins) };
}
export async function addCoins(userId, amount) {
  await query('INSERT INTO wallet (user_id, coins) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET coins=wallet.coins+$2', [userId, amount]);
  return getWallet(userId);
}

// ── PARENT / CHILD ────────────────────────────────────────────────────────────

export async function linkParentChild(parentId, childId) {
  await query('INSERT INTO parent_child (parent_id, child_id, approved) VALUES ($1,$2,TRUE) ON CONFLICT DO NOTHING', [parentId, childId]);
}
export async function getChildren(parentId) {
  const { rows } = await query('SELECT u.* FROM users u JOIN parent_child pc ON u.id=pc.child_id WHERE pc.parent_id=$1 AND pc.approved=TRUE', [parentId]);
  return rows.map(fmt.user);
}

// ── FORMATTERS ────────────────────────────────────────────────────────────────

const fmt = {
  user: u => ({
    ...u,
    interests: JSON.parse(u.interests || '[]'),
    avatarColor: u.avatar_color,
    ageGroup: u.age_group,
    role: u.role || 'USER',
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
    isSeeded: !!g.is_seeded,
    createdAt: g.created_at,
  }),
  message: m => ({ ...m, senderId: m.sender_id, groupId: m.group_id, messageType: m.message_type || 'TEXT', videoUrl: m.video_url || '', createdAt: m.created_at }),
  coupon: c => ({
    ...c,
    discountPct: c.discount_pct,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    groupId: c.group_id,
    sellerId: c.seller_id,
    expiresAt: c.expires_at,
    isActive: !!c.is_active,
    createdAt: c.created_at,
  }),
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

export default pool;
