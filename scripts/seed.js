require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB = process.env.DB_NAME || 'aegisai';

// ── All seed data as plain JS objects (no encoding issues) ──────────
const PAGES = [
  { slug: 'home', title: 'Home', meta_description: 'AegisAI 2027 - International Conference on AI-Driven Secure and Intelligent Systems, 25-27 March 2027', nav_order: 1 },
  { slug: 'about', title: 'About', meta_description: 'About AegisAI 2027 - scope, goals, and themes of the conference.', nav_order: 2 },
  { slug: 'cfp', title: 'Call for Papers', meta_description: 'Submit your research to AegisAI 2027. Topics, dates, and submission guidelines.', nav_order: 3 },
  { slug: 'speakers', title: 'Speakers', meta_description: 'Keynote and invited speakers at AegisAI 2027.', nav_order: 4 },
  { slug: 'committee', title: 'Committee', meta_description: 'Organising and program committee of AegisAI 2027.', nav_order: 5 },
  { slug: 'venue', title: 'Venue', meta_description: 'Conference venue - Shiv Nadar University Chennai, Tamil Nadu, India.', nav_order: 6 },
  { slug: 'contact', title: 'Contact', meta_description: 'Get in touch with the AegisAI 2027 organising team.', nav_order: 7 },
];

// Sections: [slug, type, order, data]
const SECTIONS = [
  // HOME
  ['home', 'hero', 1, {
    conference_name: 'AegisAI 2027',
    tagline: 'International Conference on AI-Driven Secure and Intelligent Systems',
    dates: '25-27 March 2027',
    institution: 'Shiv Nadar University Chennai',
    location: 'Chennai, Tamil Nadu, India',
    badge: 'Call for Papers Open'
  }],
  ['home', 'key_dates', 2, {
    heading: 'Key Dates at a Glance',
    dates: [
      { label: 'Paper Submission Deadline', date: 'TBA' },
      { label: 'Notification of Acceptance', date: 'TBA' },
      { label: 'Camera-Ready Deadline', date: 'TBA' },
      { label: 'Conference Dates', date: '25-27 March 2027' }
    ]
  }],
  ['home', 'text_block', 3, {
    heading: 'About AegisAI 2027',
    body: 'AegisAI 2027 is a premier international forum bringing together researchers, practitioners, and industry leaders to explore the intersection of artificial intelligence and cybersecurity. The conference welcomes contributions across intelligent systems, adversarial machine learning, privacy-preserving AI, and secure computing paradigms. Held at Shiv Nadar University Chennai, AegisAI 2027 offers a platform for rigorous peer-reviewed research and meaningful scholarly exchange.'
  }],
  ['home', 'logo_bar', 4, {
    heading: 'Sponsors & Co-Organisers',
    logos: [
      { name: 'Sponsor A', placeholder: true },
      { name: 'Sponsor B', placeholder: true },
      { name: 'Sponsor C', placeholder: true }
    ]
  }],
  ['home', 'university_info', 5, {
    heading: 'About Our Host Institution',
    body: 'Shiv Nadar University Chennai is a multi-disciplinary research university committed to excellence in teaching, learning, and research. Established under the Shiv Nadar Foundation, the university fosters innovation, critical thinking, and global collaboration. With state-of-the-art infrastructure and world-class faculty, SNU Chennai is dedicated to shaping future leaders in technology, science, and the humanities.',
    logo_text: 'SHIV NADAR\nUNIVERSITY\nCHENNAI',
    location: 'Chennai, Tamil Nadu, India',
    website_url: 'https://snuchennai.edu.in'
  }],

  // ABOUT
  ['about', 'text_block', 1, {
    heading: 'About AegisAI',
    body: 'To be announced. This section will describe the full scope, goals, and themes of the AegisAI 2027 conference once the proposal is approved. Admins can update this content from the admin panel.'
  }],

  // CFP
  ['cfp', 'text_block', 1, {
    heading: 'Call for Papers',
    body: 'AegisAI 2027 invites original, unpublished research contributions in all areas related to artificial intelligence and secure intelligent systems. All submissions will undergo rigorous double-blind peer review. Accepted papers will be published in the conference proceedings.'
  }],
  ['cfp', 'topics_list', 2, {
    heading: 'Topics of Interest',
    intro: 'The conference welcomes submissions on topics including, but not limited to:',
    topics: [
      'Adversarial Machine Learning and Robustness',
      'AI for Intrusion Detection and Threat Intelligence',
      'Privacy-Preserving AI and Federated Learning',
      'Explainable and Trustworthy AI',
      'Secure Deep Learning and Neural Network Verification',
      'AI in Malware Analysis and Cyber Forensics',
      'Intelligent Access Control and Authentication',
      'Graph Neural Networks for Security Applications',
      'Large Language Models and Security',
      'AI Ethics, Fairness, and Accountability',
      'Autonomous Systems and Safety',
      'Secure Multi-party Computation'
    ]
  }],
  ['cfp', 'dates_table', 3, {
    heading: 'Important Dates',
    col1_heading: 'Event',
    col2_heading: 'Date',
    col3_heading: 'Note',
    rows: [
      { event: 'Paper Submission Deadline', date: 'TBA', note: 'Anywhere on Earth (AoE)' },
      { event: 'Notification of Acceptance', date: 'TBA', note: '' },
      { event: 'Camera-Ready Deadline', date: 'TBA', note: '' },
      { event: 'Conference', date: '25-27 March 2027', note: 'Chennai, India' }
    ]
  }],
  ['cfp', 'submit_button', 4, {
    heading: 'Submit Your Paper',
    note: 'Submissions are managed via our online portal. The submission link will be active once the call for papers officially opens.',
    label: 'Submit via Portal',
    url: '#'
  }],

  // SPEAKERS
  ['speakers', 'speaker_grid', 1, {
    heading: 'Keynote Speakers',
    speakers: [
      { name: 'To Be Announced', affiliation: 'TBA', photo_url: '', bio: 'Speaker details will be announced soon.' },
      { name: 'To Be Announced', affiliation: 'TBA', photo_url: '', bio: 'Speaker details will be announced soon.' },
      { name: 'To Be Announced', affiliation: 'TBA', photo_url: '', bio: 'Speaker details will be announced soon.' }
    ]
  }],

  // COMMITTEE
  ['committee', 'committee_group', 1, {
    groups: [
      { role: 'General Chair', members: [{ name: 'To Be Announced', affiliation: 'Shiv Nadar University Chennai', photo_url: '' }] },
      { role: 'Program Committee Chairs', members: [{ name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }, { name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }] },
      { role: 'Technical Program Committee', members: [{ name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }, { name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }, { name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }, { name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }] },
      { role: 'Advisory Board', members: [{ name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }, { name: 'To Be Announced', affiliation: 'TBA', photo_url: '' }] }
    ]
  }],

  // VENUE
  ['venue', 'text_block', 1, {
    heading: 'Conference Venue',
    body: 'AegisAI 2027 will be held at Shiv Nadar University Chennai, a world-class research institution situated in Chennai, Tamil Nadu, India. The campus offers modern conference facilities, dedicated research spaces, and excellent connectivity to the city.'
  }],
  ['venue', 'map_embed', 2, {
    address: 'Shiv Nadar University Chennai\nSholinganallur, Chennai\nTamil Nadu 600119, India',
    map_url: 'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d3891.4145937258795!2d80.19278134999999!3d12.7515658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sShiv%20Nadar%20University%20MINI%20AUDITORIUM%2C%20SRI%20SIVASUBRAMANIYA%20NADAR%20COLLEGE%20OF%20ENGINEERING%2C%20SH%2049A%2C%20Kalavakkam%2C%20Tamil%20Nadu%20603110%2C%20India!5e0!3m2!1sen!2sin!4v1779068819242!5m2!1sen!2sin',
    travel_info: 'Chennai is well connected by air, rail, and road. The nearest airport is Chennai International Airport (MAA), approximately 18 km from the venue. Metro and cab services are readily available.'
  }],

  // CONTACT
  ['contact', 'contact_info', 1, {
    email: 'aegisai2027@snuchennai.edu.in',
    phone: 'To Be Announced',
    address: 'Shiv Nadar University Chennai, Sholinganallur, Chennai, Tamil Nadu 600119',
    socials: [
      { platform: 'Twitter', url: '#', handle: '@AegisAI2027' },
      { platform: 'LinkedIn', url: '#', handle: 'AegisAI Conference' }
    ]
  }],
];

const SETTINGS = {
  site_name: 'AegisAI 2027',
  site_tagline: 'International Conference on AI-Driven Secure and Intelligent Systems',
  conference_year: '2027',
  conference_dates: '25-27 March 2027',
  host_institution: 'Shiv Nadar University Chennai',
  contact_email: 'aegisai2027@snuchennai.edu.in',
  footer_note: 'c 2027 AegisAI Conference. All rights reserved.',
  cfp_submission_url: '#'
};

// ── Main seed function ───────────────────────────────────────────────
async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aegisai',
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  console.log('Connected to MySQL');

  // Drop and recreate database for a clean slate
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\``);
  console.log(`Created database '${DB}'`);
  await conn.query(`USE \`${DB}\``);

  const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('Schema applied (tables created)');

  // Switch to the new database
  await conn.query(`USE \`${DB}\``);

  // Insert pages and collect their IDs
  const slugToId = {};

  for (const p of PAGES) {
    const [r] = await conn.query(
      'INSERT INTO pages (slug, title, meta_description, nav_order) VALUES (?, ?, ?, ?)',
      [p.slug, p.title, p.meta_description, p.nav_order]
    );

    slugToId[p.slug] = r.insertId;
  }

  console.log('Pages inserted');

  // Insert sections
  for (const [slug, type, order, data] of SECTIONS) {
    await conn.query(
      'INSERT INTO sections (page_id, type, section_order, data) VALUES (?, ?, ?, ?)',
      [slugToId[slug], type, order, JSON.stringify(data)]
    );
  }

  console.log('Sections inserted');

  // Insert settings
  for (const [k, v] of Object.entries(SETTINGS)) {
    await conn.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
      [k, v]
    );
  }

  console.log('Settings inserted');

  // Create admin
  const hash = await bcrypt.hash('Admin@1234', 12);

  await conn.query(
    'INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)',
    ['admin@aegisai.org', hash, 'Site Admin']
  );

  console.log('Admin created -> admin@aegisai.org / Admin@1234');
  console.log('\nSetup complete. Run: npm run dev');

  await conn.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
