import 'dotenv/config';
import { initDb, queryOne, execute, saveDb } from './db.js';
import { hashPassword } from './auth.js';

async function seed() {
  await initDb();
  const existing = queryOne('SELECT COUNT(*) as count FROM users');
  if (existing && existing.count > 1) {
    console.log('Database already seeded');
    return;
  }

  execute('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    ['admin@theforge.dev', hashPassword('admin123'), 'Admin User', 'admin']);
  execute('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    ['employer@theforge.dev', hashPassword('employer123'), 'TechCorp HR', 'employer']);
  execute('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    ['participant@theforge.dev', hashPassword('participant123'), 'Alex Rivera', 'participant']);

  execute(`INSERT INTO simulations (title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'Mobile App Performance Crisis',
    'Your startup\'s mobile app is getting 1-star reviews due to slow load times. Users are abandoning the app after 3 seconds. You have 72 hours to diagnose and fix the core issues.',
    'Technology', 'intermediate', 72,
    `Our fitness tracking app "FitPulse" launched 3 months ago and had 50,000 downloads. In the last week, reviews have tanked from 4.2 to 2.1 stars. Users complain the app is "unbearably slow" and "crashes during workouts."

Your task: Diagnose the root cause, propose a fix, and implement a plan to recover our app store rating.

Context:
- React Native app with Node.js backend
- PostgreSQL database with 500K+ user records
- Image-heavy workout feed
- Real-time workout tracking via WebSocket
- Third-party APIs: Google Fit, Apple Health, Stripe

The CEO wants a full technical analysis and recovery plan within 72 hours.`,
    JSON.stringify(['Root cause identified', 'Fix proposed with timeline', 'Rating recovery strategy', 'Technical implementation plan']),
    JSON.stringify(['requirements_change', 'teammate_conflict', 'resource_constraint', 'client_complaint']),
    1, 1
  ]);

  execute(`INSERT INTO simulations (title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'Data Pipeline Migration',
    'A fintech company needs to migrate their real-time transaction processing pipeline from legacy infrastructure to a modern cloud-native solution. Zero downtime required.',
    'Data Engineering', 'advanced', 48,
    `FinFlow Inc. processes $2M in daily transactions. Their current pipeline was built 5 years ago and is failing under load. Transaction processing time has increased from 200ms to 4 seconds.

Your task: Design a new data pipeline architecture that scales to handle 10x current volume with <100ms latency.

Current stack:
- Monolithic Java application
- Oracle database (on-premise)
- Custom message queue (built in-house, unreliable)
- Manual deployment process

Target stack (your choice):
- Kafka or similar for streaming
- Cloud-native (AWS/GCP/Azure)
- Real-time analytics capability
- Automated CI/CD

The CTO has approved a $500K budget but needs a working prototype in 48 hours.`,
    JSON.stringify(['Architecture diagram', 'Tech stack justification', 'Migration strategy', 'Cost breakdown']),
    JSON.stringify(['requirements_change', 'resource_constraint', 'client_complaint']),
    1, 1
  ]);

  execute(`INSERT INTO simulations (title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'Product Launch Go-to-Market',
    'A SaaS startup is launching a new AI-powered project management tool. They have 30 days to launch but no clear GTM strategy. Build the launch plan.',
    'Product Management', 'beginner', 72,
    `TeamFlow AI is launching in 30 days. It's an AI-powered project management tool that automatically assigns tasks, predicts bottlenecks, and generates status reports.

Current state:
- Product is 90% feature complete
- 0 customers (pre-launch)
- Marketing budget: $50K
- Team: 3 engineers, 1 designer, 1 PM (you)

Your task: Create a comprehensive go-to-market plan that gets us 1,000 signups in the first month.

Challenges:
- Direct competitors: Asana, Monday.com, Jira (all have AI features)
- No existing brand awareness
- Enterprise sales cycle is 3-6 months (too slow)
- Self-serve freemium model is the only option for launch`,
    JSON.stringify(['GTM strategy document', 'Pricing model', 'Launch timeline', 'Customer acquisition strategy']),
    JSON.stringify(['teammate_conflict', 'resource_constraint', 'client_complaint']),
    1, 1
  ]);

  execute(`INSERT INTO simulations (title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'AI Ethics & Compliance Review',
    'A healthcare AI startup is preparing for FDA review of their diagnostic tool. The lead data scientist has raised ethical concerns about bias in the training data.',
    'AI/ML', 'advanced', 48,
    `MedScan AI has developed a deep learning model that detects early-stage lung cancer from chest X-rays with 94% accuracy. Before FDA submission, your data science lead discovered the training data is 78% from male patients over 50.

Your task: Create an ethical AI framework, identify and mitigate bias, and prepare a compliance strategy.

Issues to address:
- Demographic bias in training data
- FDA regulatory requirements for AI/ML in healthcare
- Patient privacy (HIPAA compliance)
- Model explainability requirements
- Retraining strategy with balanced data

The CEO wants to submit to FDA in 6 weeks.`,
    JSON.stringify(['Bias audit report', 'Mitigation strategy', 'FDA readiness assessment', 'Ethical AI framework']),
    JSON.stringify(['requirements_change', 'teammate_conflict', 'client_complaint']),
    1, 1
  ]);

  saveDb();
  console.log('Database seeded successfully');
  console.log('Admin: admin@theforge.dev / admin123');
  console.log('Employer: employer@theforge.dev / employer123');
  console.log('Participant: participant@theforge.dev / participant123');
}

seed();
