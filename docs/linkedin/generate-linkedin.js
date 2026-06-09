const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, ExternalHyperlink, LevelFormat,
  PageBreak,
} = require('docx');
const fs = require('fs');

// ── Colours ──────────────────────────────────────────────────────────────────
const BRAND   = '5B5FBD'; // LinkedIn blue-purple
const ACCENT  = 'C026A2'; // pink
const DARK    = '0D0D1A';
const GREY    = '555566';
const LGREY   = 'F0F0F8';
const LI_BLUE = '0A66C2'; // LinkedIn official blue
const WHITE   = 'FFFFFF';

// ── Helpers ───────────────────────────────────────────────────────────────────
const sp = (before = 0, after = 0) => ({ spacing: { before, after } });
const bdr = (c = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const borders = (c = 'DDDDEE') => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) });
const cell = (children, opts = {}) => new TableCell({
  borders: borders(opts.borderColor || 'DDDDEE'),
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  verticalAlign: opts.va || VerticalAlign.TOP,
  children,
});
const txt = (text, opts = {}) => new TextRun({
  text,
  bold: opts.bold,
  italics: opts.italic,
  color: opts.color || DARK,
  size: opts.size || 22,
  font: opts.font || 'Arial',
  break: opts.break,
});
const h1 = (text, color = BRAND) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  ...sp(320, 120),
  children: [txt(text, { bold: true, size: 36, color })],
});
const h2 = (text, color = DARK) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  ...sp(240, 80),
  children: [txt(text, { bold: true, size: 26, color })],
});
const h3 = (text, color = BRAND) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  ...sp(160, 60),
  children: [txt(text, { bold: true, size: 23, color })],
});
const p = (text, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.LEFT,
  ...sp(opts.before || 0, opts.after || 80),
  children: [txt(text, opts)],
});
const blank = () => new Paragraph({ children: [txt('')], ...sp(0, 0) });
const rule = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND, space: 1 } },
  ...sp(120, 120),
  children: [],
});

// Numbered / bulleted list item
const li = (text, opts = {}) => new Paragraph({
  numbering: { reference: opts.ref || 'bullets', level: 0 },
  ...sp(0, 60),
  children: [txt(text, { color: opts.color || DARK, bold: opts.bold })],
});

// ── Coloured banner paragraph ────────────────────────────────────────────────
const banner = (label, text, bg = BRAND) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({ children: [
    cell([
      new Paragraph({ ...sp(0,0), children: [txt(label, { bold: true, size: 18, color: WHITE })] }),
      new Paragraph({ ...sp(40,0), children: [txt(text, { size: 22, color: WHITE })] }),
    ], { bg, borderColor: bg }),
  ]})],
});

// ── Section header table ─────────────────────────────────────────────────────
const sectionHeader = (emoji, title, subtitle) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({ children: [
    cell([
      new Paragraph({ ...sp(0,0), alignment: AlignmentType.LEFT,
        children: [txt(`${emoji}  ${title}`, { bold: true, size: 30, color: WHITE })] }),
      new Paragraph({ ...sp(40,0), children: [txt(subtitle, { size: 20, color: 'D0D0FF' })] }),
    ], { bg: DARK, borderColor: DARK }),
  ]})],
});

// ── Post card table ──────────────────────────────────────────────────────────
const postCard = (num, tag, headline, body, hashtags) => {
  const tagColor = { 'LAUNCH': '0A66C2', 'COMMUNITY': '10B981', 'PRODUCT': '9333EA',
    'FOUNDER': 'EC4899', 'IMPACT': 'F59E0B', 'INVESTOR': '3B82F6',
    'INDIA': 'EF4444', 'GLOBAL': '06B6D4' };
  const tc = tagColor[tag] || BRAND;
  const postChildren = [
        new Paragraph({ ...sp(0,0), children: [
          txt(`Post ${num}  `, { bold: true, size: 20, color: GREY }),
          txt(`  ${tag}  `, { bold: true, size: 18, color: WHITE }),
        ], alignment: AlignmentType.LEFT }),
        new Paragraph({ ...sp(60,0), children: [txt(headline, { bold: true, size: 24, color: DARK })] }),
        blank(),
        ...body.map(line => line === ''
          ? blank()
          : new Paragraph({ ...sp(0, 40), children: [txt(line, { size: 22, color: line.startsWith('•') ? GREY : DARK })] })),
        blank(),
        new Paragraph({ ...sp(0,0), children: [txt(hashtags, { size: 20, color: LI_BLUE, italic: true })] }),
      ];
      const postCell = new TableCell({
        borders: borders(tc),
        shading: { fill: LGREY, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        verticalAlign: VerticalAlign.TOP,
        children: postChildren,
      });
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [postCell] })],
      });
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: DARK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: BRAND },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: 'Arial', color: BRAND },
        paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'check', levels: [{ level: 0, format: LevelFormat.BULLET, text: '✓',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND, space: 1 } },
        alignment: AlignmentType.RIGHT, ...sp(0, 80),
        children: [
          txt('HobbyOrigin  ', { bold: true, size: 20, color: BRAND }),
          txt('LinkedIn Company Page Playbook', { size: 20, color: GREY }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND, space: 1 } },
        alignment: AlignmentType.CENTER, ...sp(60, 0),
        children: [
          txt('ceo@hobbyorigin.com  |  hobbyorigin.com  |  ', { size: 18, color: GREY }),
          txt('Page ', { size: 18, color: GREY }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: GREY }),
        ],
      })] }),
    },
    children: [

      // ═══════════════════════════════ COVER ═══════════════════════════════
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [cell([
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(200, 40),
            children: [txt('🔗', { size: 72 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 20),
            children: [txt('HobbyOrigin', { bold: true, size: 64, color: WHITE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 60),
            children: [txt('LinkedIn Company Page Playbook', { size: 26, color: 'D0D0FF' })] }),
          rule(),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(40, 20),
            children: [txt('🇮🇳 Bangalore  ·  🇬🇧 UK  ·  🇺🇸 USA', { size: 22, color: 'A0A0DD' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 40),
            children: [txt('ceo@hobbyorigin.com  ·  hobbyorigin.com', { size: 22, color: 'A0A0DD' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 200),
            children: [txt('Prepared for: Avika Garg, Founder & CEO', { size: 20, color: '8888BB', italic: true })] }),
        ], { bg: DARK, borderColor: DARK })] })],
      }),
      blank(),

      // ═══════════════════════════════ WHAT'S INSIDE ═══════════════════════
      sectionHeader('📋', 'What\'s Inside This Document', 'Your complete LinkedIn Company Page setup guide'),
      blank(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [720, 5040, 3600],
        rows: [
          new TableRow({ children: [
            cell([p('  ', {bold:true})], { bg: BRAND, borderColor: BRAND }),
            cell([p('Section', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
            cell([p('Purpose', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
          ]}),
          ...[ ['1', 'Company Page Setup Checklist', 'Step-by-step LinkedIn setup guide'],
               ['2', 'Page Fields & Copy',           'Ready-to-paste About, Tagline, Specialities'],
               ['3', 'Banner & Logo Specs',           'Exact dimensions + design brief'],
               ['4', 'First 10 Posts',               'Ready-to-publish launch content'],
               ['5', 'Hashtag Strategy',             '30 hashtags in 3 tiers'],
               ['6', 'Content Calendar',             '4-week posting schedule'],
               ['7', 'Growth Tactics',               'Follower acquisition playbook'],
               ['8', 'Showcase Pages',               'Sub-pages for UK/US/India markets'],
          ].map(([n, section, purpose], i) => new TableRow({ children: [
            cell([p(n, { bold: true, color: BRAND })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(section, { bold: true })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(purpose, { color: GREY })], { bg: i%2===0 ? LGREY : WHITE }),
          ]})),
        ],
      }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 1: CHECKLIST ════════════════
      sectionHeader('✅', 'Section 1 — Setup Checklist', 'Complete these steps in order to create your LinkedIn Company Page'),
      blank(),
      h2('Step-by-Step Setup'),
      p('Follow these steps to create the HobbyOrigin LinkedIn Company Page:'),
      blank(),

      // Steps table
      ...[ ['1', 'Go to linkedin.com', 'Click the "Work" grid icon (top-right nav), scroll down, click "Create a Company Page"'],
           ['2', 'Choose page type', 'Select "Company" (not Creator mode, not Showcase)'],
           ['3', 'Enter company name', 'HobbyOrigin  (exact capitalisation, no spaces)'],
           ['4', 'Set LinkedIn URL', 'linkedin.com/company/hobbyorigin  (claim this immediately)'],
           ['5', 'Upload logo', '300x300px PNG, transparent background (see Section 3)'],
           ['6', 'Set website', 'https://hobbyorigin.com'],
           ['7', 'Industry', 'Select: "Technology, Information and Internet"'],
           ['8', 'Company size', '1-10 employees (update as team grows)'],
           ['9', 'Company type', 'Privately Held'],
           ['10', 'Upload banner', '1128x191px JPG/PNG (see Section 3 for brief)'],
           ['11', 'Write About section', 'Use exact copy from Section 2 of this document'],
           ['12', 'Add Tagline', 'Where Hobbies Build Communities'],
           ['13', 'Add Specialities', 'See Section 2 for list'],
           ['14', 'Set location', 'Bangalore, Karnataka, India'],
           ['15', 'Publish the page', 'Click "Publish" — page goes live immediately'],
           ['16', 'Invite connections', 'Invite your 1st-degree connections from personal profile'],
           ['17', 'Publish Post 1', 'Use the launch post from Section 4 within 24 hours'],
      ].map(([n, step, detail]) => new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [520, 2200, 6640],
        rows: [new TableRow({ children: [
          cell([new Paragraph({alignment: AlignmentType.CENTER, ...sp(0,0), children: [txt(n, { bold: true, size: 20, color: WHITE })]})],
            { bg: BRAND, borderColor: BRAND, va: VerticalAlign.CENTER }),
          cell([p(step, { bold: true })], {}),
          cell([p(detail, { color: GREY })], {}),
        ]})],
      })),

      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 2: COPY ═════════════════════
      sectionHeader('✍️', 'Section 2 — Page Fields & Ready-to-Paste Copy', 'Copy-paste these exactly into LinkedIn'),
      blank(),

      h2('Company Name'),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [cell([p('HobbyOrigin', { bold: true, size: 26, color: BRAND })], { bg: LGREY })]})] }),
      blank(),

      h2('LinkedIn URL'),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [cell([p('linkedin.com/company/hobbyorigin', { color: LI_BLUE })], { bg: LGREY })]})] }),
      blank(),

      h2('Tagline (120 characters max)'),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [cell([p('Where Hobbies Build Communities — connecting every age, every neighbourhood, worldwide.', { italic: true, size: 24, color: DARK })], { bg: LGREY })]})] }),
      blank(),

      h2('About Section (2,000 characters max — paste exactly)'),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [cell([
          p('HobbyOrigin is a hyper-local community platform connecting people of all ages around shared hobbies — in their own building, street, and city.'),
          blank(),
          p('We believe loneliness is a design problem. 25 million people in the UK alone are chronically lonely. 1 in 5 children feel socially isolated. 1.4 million seniors go weeks without speaking to anyone. And yet, the person who shares your passion for chess, gardening, or creative writing might live three floors below you.'),
          blank(),
          p('HobbyOrigin fixes that.'),
          blank(),
          p('Our platform features:', { bold: true }),
          li('Age-adaptive design — PLAYFUL for kids, STANDARD for teens/adults, ACCESSIBLE for seniors'),
          li('Hyper-local discovery — match by building, neighbourhood, and city'),
          li('Real-time group chat and session scheduling'),
          li('Virtual events with registration and ticket management'),
          li('Tutor tipping system — reward the mentors who matter'),
          li('Club shop — sell kits, guides, and digital products'),
          li('Campaign management for community clubs'),
          li('Parental controls and kids\' wallet with coin rewards'),
          blank(),
          p('Available in the UK, USA, and India. Supporting GBP, USD, and INR. Built in Bangalore.', { bold: true }),
          blank(),
          p('Founded by Avika Garg. Built with purpose, not just code.'),
          blank(),
          new Paragraph({ children: [
            txt('Website: ', { bold: true }),
            new ExternalHyperlink({ children: [txt('hobbyorigin.com', { color: LI_BLUE })], link: 'https://hobbyorigin.com' }),
          ]}),
          new Paragraph({ children: [
            txt('Email: ', { bold: true }),
            new ExternalHyperlink({ children: [txt('ceo@hobbyorigin.com', { color: LI_BLUE })], link: 'mailto:ceo@hobbyorigin.com' }),
          ]}),
        ], { bg: LGREY })]})] }),
      blank(),

      h2('Specialities (add each as a separate tag on LinkedIn)'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          new TableRow({ children: [
            cell([p('Community Building', { bold: true })], { bg: LGREY }),
            cell([p('Social Networking', { bold: true })], { bg: LGREY }),
            cell([p('Hobby Groups', { bold: true })], { bg: LGREY }),
          ]}),
          new TableRow({ children: [
            cell([p('Loneliness Reduction')], {}),
            cell([p('EdTech & Tutoring')], {}),
            cell([p('Senior Wellbeing')], {}),
          ]}),
          new TableRow({ children: [
            cell([p('Parental Controls')], { bg: LGREY }),
            cell([p('Virtual Events')], { bg: LGREY }),
            cell([p('Club Commerce')], { bg: LGREY }),
          ]}),
          new TableRow({ children: [
            cell([p('React & GraphQL')], {}),
            cell([p('Mobile App (Expo)')], {}),
            cell([p('Startup Technology')], {}),
          ]}),
        ],
      }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 3: VISUALS ══════════════════
      sectionHeader('🎨', 'Section 3 — Banner & Logo Specifications', 'Design briefs for your visual assets'),
      blank(),

      h2('Logo'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 6960],
        rows: [
          ...[ ['Dimensions', '300 × 300 px (minimum); upload 400 × 400 px for sharpness'],
               ['Format', 'PNG with transparent background'],
               ['Design', 'White 🔗 link emoji on deep indigo (#5B5FBD) circle, "HobbyOrigin" in white below in Arial Bold'],
               ['Background colour', '#5B5FBD (indigo) or deep navy #0D0D1A'],
               ['File name', 'hobbyorigin-logo-400.png'],
          ].map(([label, val], i) => new TableRow({ children: [
            cell([p(label, { bold: true })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(val, { color: GREY })], { bg: i%2===0 ? LGREY : WHITE }),
          ]})),
        ],
      }),
      blank(),

      h2('Cover / Banner Image'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 6960],
        rows: [
          ...[ ['Dimensions', '1128 × 191 px (LinkedIn requirement; max 8 MB)'],
               ['Format', 'JPG or PNG'],
               ['Background', 'Deep navy-to-purple gradient: #0D0D1A → #1A0A2E → #0A1428'],
               ['Left side (40%)', '🔗 HobbyOrigin logo + tagline: "Where Hobbies Build Communities"'],
               ['Centre (30%)', '3 floating cards: 🧒 Kids · 👤 Adults · 👴 Seniors'],
               ['Right side (30%)', '🇬🇧 🇺🇸 🇮🇳 flag icons + "UK · USA · India"'],
               ['Font', 'Inter or Arial; white text only'],
               ['File name', 'hobbyorigin-linkedin-banner.jpg'],
               ['Tools', 'Canva (free) — search "LinkedIn Banner" template, or use Figma'],
          ].map(([label, val], i) => new TableRow({ children: [
            cell([p(label, { bold: true })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(val, { color: GREY })], { bg: i%2===0 ? LGREY : WHITE }),
          ]})),
        ],
      }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 4: POSTS ════════════════════
      sectionHeader('📝', 'Section 4 — First 10 Ready-to-Publish Posts', 'Launch content — copy and post directly to LinkedIn'),
      blank(),
      p('These posts are written for the Company Page. Post as the page, not your personal profile. Space them 2-3 days apart.', { color: GREY, italic: true }),
      blank(),

      // POST 1
      postCard(1, 'LAUNCH', 'We are live. 🔗 HobbyOrigin is here.',
        [
          'Today, I\'m proud to announce HobbyOrigin — a community platform built to answer one question:',
          '',
          'Why do we have 25 million lonely people in the UK alone, when the person who shares your passion might live three floors below you?',
          '',
          '• Age-adaptive for kids, teens, adults, and seniors',
          '• Hyper-local: finds people in your building first',
          '• Real-time groups, events, tutoring, and a club shop',
          '• Available in UK 🇬🇧 · USA 🇺🇸 · India 🇮🇳',
          '',
          'Built from Bangalore. Built for the world.',
          '',
          '👉 Join our waitlist: hobbyorigin.com',
        ],
        '#HobbyOrigin #CommunityBuilding #SocialImpact #TechForGood #Bangalore #Startup'),
      blank(),

      // POST 2
      postCard(2, 'FOUNDER', 'I had no idea how to code. Here\'s how I built a full-stack app anyway.',
        [
          'My name is Avika Garg. I live in E704 UKN Esperanza, Thubrahalli, Bangalore.',
          '',
          'I watched kids in my society play alone when there were other kids with the same interests one floor up.',
          'I watched seniors become invisible as life moved online.',
          '',
          'I had no technical background. No coding degree. No engineering co-founder.',
          '',
          'What I had: a very clear problem. And an AI I could describe it to precisely.',
          '',
          'In 90 days, using Claude (Anthropic AI), I built:',
          '• React web app + React Native mobile app',
          '• GraphQL API with real-time chat',
          '• Virtual events, club shop, tutor tips, parental controls',
          '',
          'The barrier to building isn\'t technical skill. It\'s clarity of purpose.',
          '',
          'What problem are YOU clear enough about to build something?',
        ],
        '#FounderStory #BuildInPublic #NoCode #AIForGood #WomenInTech #Bangalore'),
      blank(),

      // POST 3
      postCard(3, 'IMPACT', '1 in 5 children in the UK feel socially isolated. This is not a screen problem.',
        [
          'It\'s a community design problem.',
          '',
          'Kids have never had more ways to talk to each other.',
          'They\'ve never felt more alone.',
          '',
          'The issue isn\'t devices. It\'s that we\'ve stopped designing spaces for real local connection.',
          '',
          'Maya (age 10) loves chess. So does Aryan (age 9) — three floors above her.',
          'They\'ve never met. Their parents have never met.',
          '',
          'HobbyOrigin fixes this:',
          '• Matches kids by shared interests in the same building',
          '• Parent-approved connections only',
          '• Safe, colourful, age-appropriate interface',
          '• Coins to reward participation',
          '',
          'Because loneliness in childhood compounds. We can stop it.',
        ],
        '#ChildWellbeing #Loneliness #SocialImpact #CommunityFirst #HobbyOrigin'),
      blank(),

      // POST 4
      postCard(4, 'INDIA', 'Why we built for India first. And why that matters globally.',
        [
          'India has 500 million housing society residents.',
          'Most of them don\'t know their neighbours\' names.',
          '',
          'We built HobbyOrigin to work at the society level — the same way UK residents think of their estate, or Americans think of their apartment complex.',
          '',
          'For India, we built:',
          '• Society / Colony / Building as the first location tier',
          '• PIN Code support',
          '• ₹ INR currency for tips, tickets, and shop',
          '• Hindi language support (हिन्दी)',
          '• English (India) content',
          '',
          'The loneliness crisis is not a Western problem. It is a human problem.',
          '',
          'And housing societies in Bangalore, Mumbai, and Delhi are the perfect test bed for solving it.',
        ],
        '#India #Bangalore #HousingCommunity #StartupIndia #HobbyOrigin #SocialTech'),
      blank(),

      // POST 5
      postCard(5, 'PRODUCT', 'The feature that makes grandparents smile. Every. Single. Time.',
        [
          'It\'s our Accessible Mode.',
          '',
          'When a user is 60+, HobbyOrigin automatically applies:',
          '• Large text (no squinting)',
          '• High contrast interface',
          '• Simpler navigation',
          '• Bigger buttons',
          '',
          'And then it helps them find a hobby group one floor down.',
          'Not an app that\'s tolerated. One that\'s actually used.',
          '',
          'George (68, retired teacher) found a gardening group in his building in 4 minutes.',
          'Now he mentors 3 kids in the society every Saturday.',
          '',
          'We often talk about designing for growth.',
          'What if we designed for dignity?',
        ],
        '#AgeTech #SeniorWellbeing #AccessibilityMatters #InclusiveDesign #HobbyOrigin'),
      blank(),

      // POST 6
      postCard(6, 'COMMUNITY', 'Clubs deserve real tools. Not a WhatsApp group and a spreadsheet.',
        [
          'Priya runs a creative writing group. 20 members. Every Friday.',
          '',
          'Before HobbyOrigin, she had:',
          '• A WhatsApp group (chaos)',
          '• A Google Form for bookings (clunky)',
          '• PayPal.me link for tips (informal)',
          '• Zero way to sell her writing guides',
          '',
          'After HobbyOrigin, she has:',
          '• Group chat with session scheduling',
          '• Event management with registrations',
          '• A club shop (she sold 40 writing kits last month)',
          '• A tipping system (platform takes just 10%)',
          '• Campaign tools to grow her audience',
          '',
          'Your hobby group is a small business. Treat it like one.',
        ],
        '#CommunityLeader #HobbyGroup #ClubManagement #CreatorEconomy #HobbyOrigin'),
      blank(),

      // POST 7
      postCard(7, 'GLOBAL', 'We support 3 countries, 4 languages, and 3 currencies. Here\'s why that\'s hard.',
        [
          'Internationalisation isn\'t just translation.',
          '',
          'It\'s understanding that:',
          '• UK users say "neighbourhood". US users say "neighborhood". Indian users say "locality".',
          '• UK buildings have Postcodes. US apartments have ZIP Codes. Indian societies have PIN Codes.',
          '• ₹ 500 and £ 5 mean very different things as a tutor tip.',
          '• Hindi-speaking seniors need a completely different onboarding.',
          '',
          'We built currency formatting using Intl.NumberFormat.',
          'We built location hierarchies for each country.',
          'We wrote 4 full translation files (en-GB, en-US, en-IN, hi-IN).',
          '',
          'Global isn\'t a feature. It\'s a commitment.',
          '',
          'HobbyOrigin: built in Bangalore. For Bangalore, London, and New York.',
        ],
        '#GlobalStartup #i18n #TechForGood #BuildInPublic #HobbyOrigin'),
      blank(),

      // POST 8
      postCard(8, 'INVESTOR', 'We\'re raising £1.5M. Here\'s the 7-stream revenue model that makes it viable.',
        [
          'Community platforms are hard to monetise. We solved it with 7 streams:',
          '',
          '• Kids Wallet — parents top up coins (5% fee)                 £24k/yr',
          '• Tutor Tips — 10% commission + £9.99/mo premium plan         £96k/yr',
          '• Club Memberships — 8% revenue share                        £117k/yr',
          '• Campaign Management — CPM + managed packages               £75k/yr',
          '• Product Sales — 12% commission on club shop                £48k/yr',
          '• Virtual Events — ticket commission + marketing bundles      £88k/yr',
          '• Mentorship/Institutional — council & charity contracts     £222k/yr',
          '',
          'Year 1 total: £670,000',
          'Year 2: £3.2M  |  Year 3: £9.8M  |  Break-even: Q3 Year 2',
          '',
          'Raising: £1.5M Seed (SAFE, £8M cap, 20% discount)',
          '',
          '📩 Pitch deck: ceo@hobbyorigin.com',
        ],
        '#SeedFunding #StartupInvestment #VentureCapital #HobbyOrigin #SocialImpactInvesting'),
      blank(),

      // POST 9
      postCard(9, 'PRODUCT', 'We built a tip system that makes tutors feel valued. Here\'s how it works.',
        [
          'Every community has people who give more than they take.',
          'The gardening expert who teaches 5 neighbours. The chess tutor. The art teacher.',
          '',
          'They do it for love. But recognition matters.',
          '',
          'HobbyOrigin\'s tipping system:',
          '• Attendees send coin tips to tutors mid-session',
          '• Parents tip on behalf of their kids',
          '• Tutor sees accumulated tips + total earned in their profile',
          '• Platform takes 10%. Tutor keeps 90%.',
          '• Tip leaderboard encourages quality sessions',
          '',
          'We\'ve seen tutor tip totals grow 3x when the interface makes it easy.',
          '',
          'Pay the people who make your community better.',
        ],
        '#TutorEconomy #CreatorMonetisation #EdTech #CommunityFirst #HobbyOrigin'),
      blank(),

      // POST 10
      postCard(10, 'LAUNCH', 'We\'re looking for our first 100 founding members. Could it be you?',
        [
          'HobbyOrigin is officially open for waitlist signups.',
          '',
          'We\'re looking for founding members across:',
          '• 🇬🇧 UK — London, Manchester, Edinburgh, Birmingham',
          '• 🇺🇸 USA — New York, Chicago, Houston, San Francisco',
          '• 🇮🇳 India — Bangalore, Mumbai, Delhi, Hyderabad, Pune',
          '',
          'As a founding member you get:',
          '• First access when we launch',
          '• "Founding Member" badge on your profile',
          '• Direct line to the product team',
          '• Shape the features we build next',
          '',
          'Join the waitlist: hobbyorigin.com',
          '',
          'Tag someone who would love this — a parent, a senior neighbour, a hobby club organiser.',
        ],
        '#EarlyAccess #WaitlistOpen #CommunityBuilding #HobbyOrigin #JoinUs'),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 5: HASHTAGS ═════════════════
      sectionHeader('🏷️', 'Section 5 — Hashtag Strategy', 'Use Tier 1 on every post. Rotate Tier 2 & 3.'),
      blank(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 3280, 3280],
        rows: [
          new TableRow({ children: [
            cell([p('TIER 1 — Always Use', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
            cell([p('TIER 2 — Rotate (pick 3)', { bold: true, color: WHITE })], { bg: DARK, borderColor: DARK }),
            cell([p('TIER 3 — Contextual', { bold: true, color: WHITE })], { bg: GREY, borderColor: GREY }),
          ]}),
          new TableRow({ children: [
            cell([
              li('#HobbyOrigin'),
              li('#CommunityBuilding'),
              li('#TechForGood'),
              li('#SocialImpact'),
              li('#BuildInPublic'),
            ], { bg: LGREY }),
            cell([
              li('#Bangalore'),
              li('#StartupIndia'),
              li('#WomenInTech'),
              li('#FounderStory'),
              li('#SeedFunding'),
              li('#EdTech'),
              li('#AgeTech'),
              li('#HousingCommunity'),
              li('#CreatorEconomy'),
            ], { bg: WHITE }),
            cell([
              li('#ChildWellbeing  (kid posts)'),
              li('#SeniorWellbeing  (senior posts)'),
              li('#VentureCapital  (investor posts)'),
              li('#i18n  (global posts)'),
              li('#India  (India posts)'),
              li('#React  (tech posts)'),
              li('#GraphQL  (tech posts)'),
              li('#ClubManagement  (club posts)'),
            ], { bg: LGREY }),
          ]}),
        ],
      }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 6: CALENDAR ═════════════════
      sectionHeader('📅', 'Section 6 — 4-Week Content Calendar', 'Post 3x per week for maximum early growth'),
      blank(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1100, 2200, 1600, 4460],
        rows: [
          new TableRow({ children: [
            cell([p('Week', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
            cell([p('Day', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
            cell([p('Type', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
            cell([p('Content', { bold: true, color: WHITE })], { bg: BRAND, borderColor: BRAND }),
          ]}),
          ...[ ['W1', 'Monday', 'LAUNCH', 'Post 1 — We are live. 🔗'],
               ['W1', 'Wednesday', 'FOUNDER', 'Post 2 — Founder story (Avika)'],
               ['W1', 'Friday', 'IMPACT', 'Post 3 — Loneliness stats'],
               ['W2', 'Monday', 'INDIA', 'Post 4 — Why we built for India first'],
               ['W2', 'Wednesday', 'PRODUCT', 'Post 5 — Accessible Mode for seniors'],
               ['W2', 'Friday', 'COMMUNITY', 'Post 6 — Clubs deserve real tools'],
               ['W3', 'Monday', 'GLOBAL', 'Post 7 — 3 countries, 4 languages'],
               ['W3', 'Wednesday', 'INVESTOR', 'Post 8 — 7-stream revenue model'],
               ['W3', 'Friday', 'PRODUCT', 'Post 9 — Tutor tipping system'],
               ['W4', 'Monday', 'LAUNCH', 'Post 10 — Founding members wanted'],
               ['W4', 'Wednesday', 'CUSTOM', 'Share a real community story (user quote)'],
               ['W4', 'Friday', 'CUSTOM', 'Behind-the-scenes: building from Bangalore'],
          ].map(([week, day, type, content], i) => new TableRow({ children: [
            cell([p(week, { bold: true, color: BRAND })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(day)], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(type, { bold: true, size: 18, color: i%2===0 ? BRAND : DARK })], { bg: i%2===0 ? LGREY : WHITE }),
            cell([p(content, { color: GREY })], { bg: i%2===0 ? LGREY : WHITE }),
          ]})),
        ],
      }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 7: GROWTH ═══════════════════
      sectionHeader('🚀', 'Section 7 — Follower Growth Tactics', 'How to reach 500 followers in 30 days'),
      blank(),

      h2('Immediate actions (Day 1)'),
      li('Invite ALL your 1st-degree LinkedIn connections from Avika\'s personal profile', { ref: 'numbers' }),
      li('Ask 5 close contacts to share the launch post', { ref: 'numbers' }),
      li('Post in relevant LinkedIn Groups: "Community Building", "Social Entrepreneurship India", "EdTech Founders"', { ref: 'numbers' }),
      li('Link the Company Page in your personal profile\'s Experience section', { ref: 'numbers' }),
      li('Add the LinkedIn URL to hobbyorigin.com footer and email signature', { ref: 'numbers' }),
      blank(),

      h2('Week 1–2 tactics'),
      li('Comment (not just like) on 10 posts daily in your niche — as the Company Page', { ref: 'numbers' }),
      li('Tag relevant journalists and community builders in Post 1', { ref: 'numbers' }),
      li('Submit to Startups.co.uk, YourStory.com (India), and ProductHunt', { ref: 'numbers' }),
      li('Reach out to 10 housing society WhatsApp admins in Bangalore for beta access', { ref: 'numbers' }),
      li('DM 20 community organisers with a personal note from Avika', { ref: 'numbers' }),
      blank(),

      h2('Ongoing — every week'),
      li('Reply to every comment within 4 hours', { ref: 'check' }),
      li('Share 1 community story (real user / testimonial)', { ref: 'check' }),
      li('Repost from Avika\'s personal profile with added comment', { ref: 'check' }),
      li('Track: Impressions, Follows, Click-through to hobbyorigin.com', { ref: 'check' }),
      blank(),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════ SECTION 8: SHOWCASE ═════════════════
      sectionHeader('🌍', 'Section 8 — Showcase Pages (Phase 2)', 'Sub-pages for each market — create after 200 followers'),
      blank(),
      p('LinkedIn Showcase Pages are sub-pages of your Company Page, each with their own followers and feed. Create one per major market once your main page has traction.', { color: GREY }),
      blank(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          new TableRow({ children: [
            cell([p('🇮🇳 HobbyOrigin India', { bold: true })], { bg: LGREY }),
            cell([p('🇬🇧 HobbyOrigin UK', { bold: true })], { bg: WHITE }),
            cell([p('🇺🇸 HobbyOrigin US', { bold: true })], { bg: LGREY }),
          ]}),
          new TableRow({ children: [
            cell([p('Focus: Societies, PIN codes, Hindi, ₹ INR', { color: GREY })], { bg: LGREY }),
            cell([p('Focus: Estates, Postcodes, Neighbourhood, £ GBP', { color: GREY })], { bg: WHITE }),
            cell([p('Focus: Apartments, ZIP codes, Community, $ USD', { color: GREY })], { bg: LGREY }),
          ]}),
          new TableRow({ children: [
            cell([p('linkedin.com/company/hobbyorigin-india')], { bg: WHITE }),
            cell([p('linkedin.com/company/hobbyorigin-uk')], { bg: LGREY }),
            cell([p('linkedin.com/company/hobbyorigin-us')], { bg: WHITE }),
          ]}),
        ],
      }),
      blank(), blank(),

      // ═══════════════════════════════ CLOSING ═════════════════════════════
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [cell([
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(80, 40),
            children: [txt('Ready. Set. Publish.', { bold: true, size: 36, color: WHITE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 40),
            children: [txt('🇮🇳 Bangalore  ·  ceo@hobbyorigin.com  ·  hobbyorigin.com', { size: 22, color: 'A0A0DD' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, ...sp(0, 80),
            children: [txt('Where Hobbies Build Communities', { italic: true, size: 24, color: 'D0D0FF' })] }),
        ], { bg: DARK, borderColor: DARK })] })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/Users/avikagarg/claude/hobbyconnect/docs/HobbyOrigin_LinkedIn_Playbook.docx', buf);
  console.log('✅ Done → docs/HobbyOrigin_LinkedIn_Playbook.docx');
});
