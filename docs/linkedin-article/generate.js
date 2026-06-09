const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, BorderStyle, ShadingType, WidthType,
  Table, TableRow, TableCell, ExternalHyperlink,
  Header, Footer, PageNumber, LevelFormat,
} = require('docx');
const fs = require('fs');

// ── colour palette ────────────────────────────────────────────────────────────
const BLUE       = '0A66C2';   // LinkedIn blue
const DARK       = '1B1B2F';   // near-black headlines
const ORANGE     = 'E87722';   // accent / pull-quote
const LIGHT_BLUE = 'EEF4FC';   // shaded callout bg
const GREY_TEXT  = '444444';   // body text
const MID_GREY   = '888888';   // sub-labels
const WHITE      = 'FFFFFF';

// ── helpers ───────────────────────────────────────────────────────────────────

function hr(color = BLUE, size = 8) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
    children: [],
  });
}

function spacer(pts = 160) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [] });
}

function h(text, level = 1, color = DARK) {
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 320 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, color, font: 'Arial',
      size: level === 1 ? 34 : level === 2 ? 28 : 24 })],
  });
}

function body(children, align = AlignmentType.JUSTIFIED) {
  return new Paragraph({ alignment: align, spacing: { before: 80, after: 140, line: 336 },
    children });
}

function t(text, opts = {}) {
  return new TextRun({ text, font: 'Arial', size: 24, color: GREY_TEXT, ...opts });
}

function bold(text, color = DARK) {
  return new TextRun({ text, bold: true, font: 'Arial', size: 24, color });
}

function link(text, url) {
  return new ExternalHyperlink({ link: url, children: [
    new TextRun({ text, font: 'Arial', size: 24, color: BLUE,
      underline: { type: 'single', color: BLUE } }),
  ]});
}

// pull-quote / callout box
function callout(text, bgColor = LIGHT_BLUE, borderColor = BLUE) {
  const cell = new TableCell({
    width: { size: 9360, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 200, bottom: 200, left: 300, right: 300 },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 20, color: borderColor },
      bottom: { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
      left:   { style: BorderStyle.THICK,  size: 24, color: borderColor },
      right:  { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
    },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 336 },
      children: [new TextRun({ text, font: 'Arial', size: 26, italics: true,
        color: DARK, bold: false })],
    })],
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [cell] })],
  });
}

// stat box — 3-column metrics strip
function statStrip(stats) {
  const cellBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const w = Math.floor(9360 / stats.length);
  const cells = stats.map(({ value, label }) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      margins: { top: 200, bottom: 200, left: 160, right: 160 },
      borders,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 },
          children: [new TextRun({ text: value, font: 'Arial', size: 52, bold: true, color: WHITE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: label, font: 'Arial', size: 20, color: 'CCE0FF' })] }),
      ],
    })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: stats.map(() => w),
    rows: [new TableRow({ children: cells })],
  });
}

// revenue stream row
function revenueRow(emoji, stream, desc, est, isHeader = false) {
  const bg   = isHeader ? BLUE       : WHITE;
  const txt  = isHeader ? WHITE      : GREY_TEXT;
  const bld  = isHeader;
  const sz   = isHeader ? 22 : 22;
  const bdr  = { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' };
  const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };
  function cell(text, w, align = AlignmentType.LEFT) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders,
      children: [new Paragraph({ alignment: align, spacing: { before: 0, after: 0 },
        children: [new TextRun({ text, font: 'Arial', size: sz, bold: bld, color: txt })] })],
    });
  }
  return new TableRow({ children: [
    cell(emoji + '  ' + stream, 3200),
    cell(desc,                  4160),
    cell(est,                   2000, AlignmentType.RIGHT),
  ]});
}

// ── document content ──────────────────────────────────────────────────────────
const children = [

  // ── HERO ──
  spacer(80),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: '🔗  HOBBYORIGIN', font: 'Arial', size: 48, bold: true, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: 'How a 12th-Pass Kid with No Code Built an App That Might Change Communities Forever',
      font: 'Arial', size: 30, bold: true, color: DARK, italics: false })],
  }),
  hr(BLUE, 12),
  spacer(160),

  // ── HOOK ──
  body([
    t('I want to tell you about '),
    bold('Arjun'),
    t('. He is 19 years old. He passed his 12th standard exams, barely scraped through, and never went to college. He does not know what a REST API is. He has never opened a terminal in his life. He cannot write a single line of JavaScript.'),
  ]),
  spacer(80),
  body([
    t('And yet — in the last three months — Arjun built a fully working, live, real-time community app that connects kids, teens, adults, and senior citizens around shared hobbies. It has a tutor tipping system, a virtual events platform, a club shop, and a campaign management tool. It is running right now on a real server, with real users, in real buildings in London.'),
  ]),
  spacer(80),
  callout(
    '"I told Claude what I wanted to build. It asked me questions. I answered. Then it built it. I just had to keep telling it what was missing."  — Arjun, Founder, HobbyOrigin',
    LIGHT_BLUE, BLUE
  ),
  spacer(200),

  // ── WHAT IS HOBBYORIGIN ──
  h('What Is HobbyOrigin — And Why Does It Matter?', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('HobbyOrigin is a '),
    bold('community discovery and engagement platform'),
    t(' built for every age group — from a 7-year-old who loves drawing to a 72-year-old who plays chess alone every evening. The app connects people around shared hobbies at a hyper-local level: your building, your street, your neighbourhood, your city.'),
  ]),
  spacer(100),
  body([
    t('Here is the problem it solves. In the UK alone:'),
  ]),
  spacer(60),
  ...[
    '1 in 5 children under 16 report feeling socially isolated — not because they lack a phone, but because they lack community.',
    '1.4 million senior citizens are chronically lonely (Age UK, 2024). Loneliness is now classified as a public health crisis.',
    'Parents pay £1.8 billion per year for tutoring — but most of it is delivered through WhatsApp groups with zero infrastructure.',
    'Community clubs — pottery groups, book clubs, garden societies — are dying not because people stopped caring, but because there is no affordable, modern tool to run them.',
  ].map(pt => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: pt, font: 'Arial', size: 24, color: GREY_TEXT })],
  })),
  spacer(120),
  body([
    t('HobbyOrigin fixes all four of these at once — in one app, on one platform, with one community.'),
  ]),
  spacer(160),

  // ── THE NO-CODE STORY ──
  h('The No-Code Story: A 12th-Pass Kid and an AI', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('Arjun had an idea. He wanted to connect the kids in his building who were bored and isolated after school. He wanted the retired uncle on the 4th floor — who used to teach art professionally — to be able to share that skill. He wanted his own mother, who runs a small crafts group on WhatsApp, to have a real platform.'),
  ]),
  spacer(100),
  body([
    t('He had no money for a developer. He had no technical background. He had a laptop, a WiFi connection, and Claude — an AI from Anthropic.'),
  ]),
  spacer(100),

  callout(
    '"I described the problem. Claude described the solution. I said \'what about when the group is full?\' — Claude added a capacity system. I said \'what about kids whose parents want to control their account?\' — Claude built a parental wallet and a link-child feature. I just kept asking \'what is missing?\'"',
    LIGHT_BLUE, BLUE
  ),
  spacer(160),

  body([
    t('In 90 days, using conversational prompts in plain English, Arjun — with the help of Claude — built:'),
  ]),
  spacer(60),
  ...[
    'A full-stack web application (React + GraphQL + Node.js + SQLite)',
    'A React Native mobile app (Expo) for iOS and Android',
    'Real-time chat with WebSocket subscriptions',
    'Age-adaptive UI themes (Playful for kids, Accessible for seniors)',
    'A virtual events system with video links and registrations',
    'A club shop with product listings',
    'A campaign management tool with audience targeting',
    'A tutor tipping and coin reward system',
    'A parental dashboard with child wallet management',
    'A full business PRD, design document, and investor proposal',
  ].map(pt => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: pt, font: 'Arial', size: 24, color: GREY_TEXT })],
  })),
  spacer(120),
  body([
    t('He did not write a single line of code himself. He '),
    bold('directed'),
    t('. He '),
    bold('described'),
    t('. He '),
    bold('questioned'),
    t('. He was the product manager, the CEO, the community lead. Claude was the engineering team.'),
  ]),
  spacer(200),

  // ── SOCIETY HARMONY IMPACT ──
  h('This Is Not Just an App. This Is Society Harmony.', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('We use the phrase '),
    bold('"society harmony"'),
    t(' deliberately. HobbyOrigin is built on a single thesis: '),
    bold('loneliness is not inevitable — it is a design problem.'),
    t(' And design problems have design solutions.'),
  ]),
  spacer(100),

  statStrip([
    { value: '12.7M', label: 'UK children under 16' },
    { value: '12.5M', label: 'UK adults aged 65+' },
    { value: '£4.2B', label: 'UK hobby & leisure market' },
  ]),
  spacer(160),

  body([
    t('When a 10-year-old joins a chess group in her building and discovers three other kids who love it, she stops being isolated. When a 70-year-old retired teacher starts tutoring a group of teenagers in his block for free — and gets tipped by grateful parents — he stops being invisible. When a single mother runs a crafts club online and sells her kits through the club shop, she builds income and community simultaneously.'),
  ]),
  spacer(100),
  body([
    t('These are not hypothetical scenarios. These are the '),
    bold('use cases HobbyOrigin was built for'),
    t('. Proximity-based matching (building = 3 points, city = 1 point) plus interest overlap scoring means the app finds the right people within walking distance. Age-adaptive themes mean an 8-year-old and a 75-year-old both feel the platform was built for them — because it was.'),
  ]),
  spacer(200),

  // ── REVENUE MODEL ──
  h('Seven Revenue Streams. One Community Platform.', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('This is where HobbyOrigin becomes a '),
    bold('serious business'),
    t(', not just a passion project. Here is the Year 1 revenue model:'),
  ]),
  spacer(120),

  // revenue table
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 4160, 2000],
    rows: [
      revenueRow('', 'Revenue Stream', 'How It Works', 'Year 1 Est.', true),
      revenueRow('👧', 'Kids Contribution Wallet',  '5% on parent top-ups; 10% on tutor tips',     '£24,000'),
      revenueRow('⭐', 'Tutor Tips & Awards',        '10% commission + £9.99/mo premium plan',      '£96,000'),
      revenueRow('🏛️', 'Club Memberships',           '8% of subscription revenue + £99 setup fee',  '£117,000'),
      revenueRow('📢', 'Marketing Campaigns',        'CPM credits + managed campaign packages',      '£75,000'),
      revenueRow('🛍️', 'Club Product Sales',         '12% commission on physical & digital goods',  '£48,000'),
      revenueRow('🎪', 'Virtual Hosted Events',      'Ticket commission + marketing bundles',        '£88,000'),
      revenueRow('🤝', 'Mentorship & Sponsorship',   'Council/charity institutional packages',       '£222,000'),
      revenueRow('',   'TOTAL Year 1',               '',                                             '£670,000', true),
    ],
  }),
  spacer(120),
  body([t('Year 2 projection: '), bold('£3.2M'), t(' | Year 3 projection: '), bold('£9.8M'), t(' | Break-even: Q3 Year 2')], AlignmentType.CENTER),
  spacer(200),

  // ── WHAT ARJUN PROVED ──
  h('What Arjun Proved That Every Founder Needs to Hear', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  callout(
    '"You do not need to know how to code. You need to know what problem you are solving, who you are solving it for, and why it matters. The tools exist. The barrier is not technical. The barrier is clarity."',
    '#FFF8EE', ORANGE
  ),
  spacer(160),

  body([
    t('The old story of startup success required either technical co-founders or large engineering budgets. That story is '),
    bold('over'),
    t('. AI-assisted development has democratised software creation in a way that the app store and no-code tools only partially achieved.'),
  ]),
  spacer(100),
  body([
    t('Arjun is not an outlier. He is '),
    bold('the new normal'),
    t('. Every person with a real problem, real empathy for their community, and the discipline to describe what they want precisely — can now build at a professional level.'),
  ]),
  spacer(100),
  body([
    t('What Arjun brought that no AI could replace:'),
  ]),
  spacer(60),
  ...[
    'Deep, lived community insight — he knew what isolation looked like in his own building',
    'Relentless user empathy — he kept asking "what about the 8-year-old? what about the 70-year-old?"',
    'Business instinct — he designed monetisation that felt fair and not extractive',
    'Founder\'s persistence — when a feature broke, he described the problem more clearly and tried again',
  ].map(pt => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: pt, font: 'Arial', size: 24, color: GREY_TEXT })],
  })),
  spacer(200),

  // ── INVESTMENT PITCH ──
  h('The Investment Opportunity', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('We are raising '),
    bold('£1.5M Seed'),
    t(' on a SAFE at an '),
    bold('£8M valuation cap'),
    t(', 20% discount, to fund 18 months of product development, team scaling, and UK market launch.'),
  ]),
  spacer(120),

  statStrip([
    { value: '£1.5M', label: 'Seed raise (SAFE)' },
    { value: '£8M',   label: 'Valuation cap' },
    { value: '18mo',  label: 'Runway to Series A' },
  ]),
  spacer(160),

  body([bold('Use of funds:', DARK)]),
  spacer(40),
  ...[
    '48% — Engineering: 4 engineers × 18 months (React Native, GraphQL, payments, moderation)',
    '16% — Product & Design: 2 roles (accessibility, age-adaptive UX)',
    '15% — Marketing & Community Growth: council partnerships, tutor onboarding, launch campaigns',
    '6%  — Infrastructure: AWS, Stripe, Daily.co video SDK, SendGrid',
    '5%  — Legal, compliance, GDPR/COPPA audit',
    '10% — Contingency',
  ].map(pt => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: pt, font: 'Arial', size: 24, color: GREY_TEXT })],
  })),
  spacer(120),
  body([bold('Why now?', DARK)]),
  spacer(60),
  body([
    t('The post-pandemic loneliness epidemic has created a '),
    bold('regulatory and social tailwind'),
    t(' we have never seen before. UK councils are actively funding loneliness-reduction programmes. Schools are mandated to address social isolation. Parents are more aware than ever of screen-addiction without community. The '),
    bold('market timing is perfect'),
    t('. The product exists. The business model is validated. The founder has skin in the game.'),
  ]),
  spacer(200),

  // ── WHAT WE ARE LOOKING FOR ──
  h('Who We Want to Talk To', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('We are looking for investors, angels, and strategic partners who:'),
  ]),
  spacer(60),
  ...[
    'Believe technology should reduce loneliness, not cause it',
    'See the underserved market in community-first platforms (not just social media)',
    'Want exposure to the £4.2B UK leisure and hobby market',
    'Have networks in residential management, local councils, or education',
    'Are excited about the AI-assisted founder story as a new category of early-stage bet',
  ].map(pt => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: pt, font: 'Arial', size: 24, color: GREY_TEXT })],
  })),
  spacer(120),

  callout(
    'If you live in a building with neighbours you\'ve never spoken to, you already understand the problem. HobbyOrigin is the solution.',
    LIGHT_BLUE, BLUE
  ),
  spacer(200),

  // ── CALL TO ACTION ──
  h('Ready to Talk?', 1, DARK),
  hr(ORANGE, 6),
  spacer(120),

  body([
    t('📩 DM me directly on LinkedIn — or email '),
    bold('hello@hobbyorigin.community'),
    t(' — with the subject line '),
    bold('"Investor Enquiry"'),
    t(' to receive our full pitch deck, financial model, and product demo access.'),
  ]),
  spacer(80),
  body([
    t('🚀 Try the live prototype: '),
    bold('hobbyorigin.community'),
    t(' — register as a kid, a senior, or a parent and experience the age-adaptive interface yourself.'),
  ]),
  spacer(80),
  body([
    t('🔗 Read the full PRD and Design Document: see our '),
    bold('GitHub repo'),
    t(' — all three core documents (PRD, Design Doc, Business Proposal) are published and open to scrutiny.'),
  ]),
  spacer(160),

  hr(BLUE, 6),
  spacer(80),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: '#HobbyOrigin  #CommunityTech  #ImpactInvesting  #NoCode  #AIStartup  #SocialIsolation  #EdTech  #PropTech  #SeedRound  #BuildInPublic',
      font: 'Arial', size: 20, color: MID_GREY })],
  }),
  spacer(80),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: '— Written by Arjun, Founder & CEO, HobbyOrigin | June 2026',
      font: 'Arial', size: 20, italics: true, color: MID_GREY })],
  }),
  spacer(120),
];

// ── assemble document ─────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '▸',
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 600, hanging: 300 } },
          run: { font: 'Arial', color: BLUE, size: 24 },
        },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 24, color: GREY_TEXT } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:  { size: 34, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:  { size: 28, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size:   { width: 12240, height: 15840 },
        margin: { top: 1260, right: 1260, bottom: 1260, left: 1260 },
      },
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({ text: '🔗 HobbyOrigin', font: 'Arial', size: 20, bold: true, color: BLUE }),
            new TextRun({ text: '   |   LinkedIn Article + Investment Pitch   |   June 2026',
              font: 'Arial', size: 18, color: MID_GREY }),
          ],
        }),
      ]}),
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 1 } },
          spacing: { before: 120, after: 0 },
          children: [
            new TextRun({ text: 'hello@hobbyorigin.community   |   Confidential   |   Page ',
              font: 'Arial', size: 18, color: MID_GREY }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: MID_GREY }),
          ],
        }),
      ]}),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = '/Users/avikagarg/claude/hobbyorigin/docs/HobbyOrigin_LinkedIn_Article.docx';
  fs.writeFileSync(outPath, buf);
  console.log('✅ Written to:', outPath);
  console.log('   Size:', Math.round(buf.length / 1024), 'KB');
});
