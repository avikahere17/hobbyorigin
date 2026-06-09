#!/usr/bin/env node
/**
 * cleanup-test-users.js
 * Finds all E2E test accounts (email matching *@hobbytest.dev) and deletes them.
 * Requires a valid ADMIN token passed via ADMIN_EMAIL + ADMIN_PASSWORD env vars.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass \
 *   SERVER_URL=https://hobbyorigin-server.onrender.com/graphql \
 *   node cleanup-test-users.js
 */

const SERVER_URL = process.env.SERVER_URL || 'https://hobbyorigin-server.onrender.com/graphql';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function gql(query, vars = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(SERVER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: vars }),
  });
  return res.json();
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
  process.exit(1);
}

// Step 1: login as admin
const loginRes = await gql(`mutation Login($email:String!,$password:String!) {
  login(email:$email,password:$password) { token user { id role } }
}`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

if (loginRes.errors?.length || !loginRes.data?.login?.token) {
  console.error('Login failed:', JSON.stringify(loginRes.errors || loginRes));
  process.exit(1);
}

const { token, user } = loginRes.data.login;
if (user.role !== 'ADMIN') {
  console.error(`User role is ${user.role} — must be ADMIN`);
  process.exit(1);
}
console.log(`✅ Logged in as ADMIN (${ADMIN_EMAIL})`);

// Step 2: find all test accounts
const usersRes = await gql(`{ adminUsers(search:"hobbytest.dev") { id name email role } }`, {}, token);
const testUsers = usersRes.data?.adminUsers || [];

if (testUsers.length === 0) {
  console.log('✅ No test accounts found — nothing to clean up');
  process.exit(0);
}

console.log(`\nFound ${testUsers.length} test account(s):`);
testUsers.forEach(u => console.log(`  • ${u.name} <${u.email}> [${u.role}]`));

// Step 3: delete each one using admin setUserRole trick + deleteMyAccount won't work
// Use the admin-level deleteUser if available, otherwise use setUserRole + deleteMyAccount
// Since we only have deleteMyAccount, we need each user's own token.
// Strategy: reset each test user's password (not available) OR use a direct DB delete.
// Best available: for each test user, login as them (we know the password is Test1234!)
// and call deleteMyAccount.

const TEST_PASSWORD = 'Test1234!';
let deleted = 0;
let failed = 0;

for (const u of testUsers) {
  process.stdout.write(`  Deleting ${u.name} <${u.email}>... `);
  try {
    // Login as the test user
    const tRes = await gql(`mutation { login(email:"${u.email}",password:"${TEST_PASSWORD}") { token } }`);
    if (!tRes.data?.login?.token) {
      console.log('⚠️  Cannot login (password unknown — skipping)');
      failed++;
      continue;
    }
    const userToken = tRes.data.login.token;
    const delRes = await gql(`mutation { deleteMyAccount(password:"${TEST_PASSWORD}") }`, {}, userToken);
    if (delRes.errors?.length) {
      console.log(`❌ ${delRes.errors[0].message}`);
      failed++;
    } else {
      console.log('✅ deleted');
      deleted++;
    }
  } catch (e) {
    console.log(`❌ ${e.message}`);
    failed++;
  }
}

console.log(`\n🏁 Done: ${deleted} deleted, ${failed} skipped/failed`);
