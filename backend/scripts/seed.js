require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Session = require('../models/Session');
const GalleryItem = require('../models/GalleryItem');
const Testimonial = require('../models/Testimonial');
const TeamMember = require('../models/TeamMember');
const SiteSettings = require('../models/SiteSettings');

// NOTE: All content below is DEMO/SEED data for local development —
// not verified real-world facts about the actual club.

async function seed() {
  await connectDB();
  console.log('Seeding AOC database...');

  // Admin
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@aoc-mits.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password';
  await Admin.deleteMany({});
  await Admin.create({ name: 'AOC Admin', email: adminEmail, password: adminPassword });
  console.log(`  Admin created → ${adminEmail} / (password from .env)`);

  // Events (3 upcoming, using future dates relative to seed run)
  await Event.deleteMany({});
  const now = new Date();
  const inDays = (n) => new Date(now.getTime() + n * 86400000);
  const agoDays = (n) => new Date(now.getTime() - n * 86400000);

  await Event.create([
    {
      title: 'The Ignition Speech',
      description: 'Season opener — first-timers take the stage for a 3-minute impromptu speech in front of the full AOC house. Demo/seed event.',
      date: inDays(21),
      time: '5:00 PM',
      venue: 'Main Auditorium',
      category: 'Public Speaking',
      speaker: 'Open Mic — All Members',
      posterImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1000&auto=format&fit=crop',
      featured: true,
    },
    {
      title: 'Crossfire Nights',
      description: 'Parliamentary-style debate night. Motions announced 15 minutes before each round. Demo/seed event.',
      date: inDays(40),
      time: '6:30 PM',
      venue: 'Debate Hall',
      category: 'Debate',
      speaker: 'AOC Debate Council',
      posterImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Table Topics: Unscripted',
      description: 'Zero-prep improv speaking — pick a topic from the bowl, speak for 2 minutes, no notes allowed. Demo/seed event.',
      date: inDays(58),
      time: '5:30 PM',
      venue: 'Black Box Theatre',
      category: 'Table Topics',
      speaker: 'Hosted by AOC Core',
      posterImage: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1000&auto=format&fit=crop',
    },
  ]);
  console.log('  3 upcoming events created');

  // Sessions (previous / archive)
  await Session.deleteMany({});
  await Session.create([
    { title: 'Debate Masterclass', description: 'Breaking down structure, rebuttal, and delivery. Demo/seed session.', date: agoDays(20), speaker: 'AOC Alumni Panel', category: 'Debate', duration: '24 min', thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
    { title: 'Impromptu Speaking', description: 'Thinking on your feet — frameworks for structuring an answer in under 10 seconds. Demo/seed session.', date: agoDays(48), speaker: 'AOC Core Team', category: 'Public Speaking', duration: '18 min', thumbnail: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
    { title: 'Interview Confidence Lab', description: 'Mock interview drills with real-time feedback. Demo/seed session.', date: agoDays(70), speaker: 'Placement Cell x AOC', category: 'Interview Skills', duration: '31 min', thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
    { title: 'The Art of Networking', description: 'How to work a room without feeling fake about it. Demo/seed session.', date: agoDays(95), speaker: 'Guest Speaker', category: 'Networking', duration: '22 min', thumbnail: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
    { title: 'Leading From the Front', description: 'Leadership speeches from the outgoing AOC council. Demo/seed session.', date: agoDays(120), speaker: 'AOC Council 2025', category: 'Leadership', duration: '27 min', thumbnail: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
    { title: 'Table Topics Vol. 1', description: 'The first-ever unscripted speaking round. Demo/seed session.', date: agoDays(150), speaker: 'AOC Founders', category: 'Table Topics', duration: '19 min', thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop', videoUrl: '' },
  ]);
  console.log('  6 previous sessions created');

  // Gallery
  await GalleryItem.deleteMany({});
  await GalleryItem.create([
    { title: 'Season Opener', imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop', category: 'Events', featured: true },
    { title: 'Debate Finals', imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop', category: 'Debates' },
    { title: 'Backstage', imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=800&auto=format&fit=crop', category: 'Behind The Scenes' },
    { title: 'Workshop Day', imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop', category: 'Workshops' },
    { title: 'Crossfire Nights', imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4?q=80&w=800&auto=format&fit=crop', category: 'Events' },
    { title: 'Team Huddle', imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop', category: 'Team' },
    { title: 'Community Meetup', imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop', category: 'Community' },
    { title: 'Table Topics', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop', category: 'Events' },
  ]);
  console.log('  8 gallery images created');

  // Testimonials
  await Testimonial.deleteMany({});
  await Testimonial.create([
    { name: 'Ananya Rathore', role: 'B.Tech CSE, AI Cohort', quote: 'I joined to fix my fear of interviews. I left running the debate finals with a mic in my hand and no notes.', imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop', order: 1 },
    { name: 'Kabir Mehta', role: 'B.Tech ECE, Third Year', quote: "AOC didn't teach me to talk more. It taught me to say less, and mean every word of it.", imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', order: 2 },
    { name: 'Sana Iqbal', role: 'MBA, First Year', quote: 'The stage stopped feeling like a threat. Now it\'s the only place I feel fully in control.', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop', order: 3 },
    { name: 'Rohan Nair', role: 'B.Tech IT, Second Year', quote: 'Every session felt like a rehearsal for real life — placements, interviews, everything got easier after.', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', order: 4 },
  ]);
  console.log('  4 testimonials created');

  // Team
  await TeamMember.deleteMany({});
  await TeamMember.create([
    { name: 'Rhea Kapoor', role: 'President', quote: 'Silence is a choice. So is stopping it.', imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop', order: 1 },
    { name: 'Arjun Verma', role: 'Vice President', quote: 'Every speaker was a listener first.', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop', order: 2 },
    { name: 'Ishita Rao', role: 'Head of Debate', quote: 'Conviction is a skill, not a personality.', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop', order: 3 },
    { name: 'Dev Malhotra', role: 'Head of Events', quote: 'The stage is a promise we keep every week.', imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop', order: 4 },
  ]);
  console.log('  4 team members created');

  // Site settings
  await SiteSettings.deleteMany({});
  await SiteSettings.create({
    key: 'main',
    social: { instagram: 'https://instagram.com', linkedin: 'https://linkedin.com', youtube: '', email: 'aoc@mitsgwalior.in', website: '', mits: 'https://mitsgwalior.in' },
    stats: { voicesTrained: 3200, sessionsHeld: 140, yearsRunning: 8, eventsHosted: 52, membersCount: 210 },
    heroVideoUrl: '',
  });
  console.log('  Site settings created');

  console.log('\nSeed complete. You can now log in to /admin with the ADMIN_EMAIL / ADMIN_PASSWORD from your .env file.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
