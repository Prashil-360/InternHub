# InternHub v2 — Production-Ready Intern Management SaaS

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure — edit ONLY this file
nano .env.local

# 3. Seed demo data (optional)
npx ts-node -r tsconfig-paths/register scripts/seed.ts
# Login: admin@coreco.com / admin123

# 4. Run
npm run dev
# → http://localhost:3000
```

## Architecture

- **Framework**: Next.js 14 App Router
- **Database**: MongoDB + Mongoose (with indexes + TTL)
- **Auth**: NextAuth.js v4 (JWT, 8h expiry, secure cookies)
- **Styling**: Custom CSS design system (no Tailwind component libraries)
- **Email**: Nodemailer v7 (SMTP)

## User Flows

| Role | Entry | Capabilities |
|------|-------|-------------|
| **Admin** | Register at `/register` | Create batches, add mentors/interns, view audit log |
| **Mentor** | Invite from admin | Create tasks, review submissions, evaluate interns |
| **Intern** | Invite from admin | View tasks, submit with proof, weekly reports |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Company + admin signup |
| POST | `/api/auth/set-password` | Invite token → set password |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Token → new password |
| GET/POST | `/api/batches` | List / create batches |
| GET/PATCH | `/api/batches/[id]` | Get / update batch |
| POST | `/api/batches/[id]/add-user` | Add mentor or intern |
| POST | `/api/batches/[id]/remove-user` | Remove from batch |
| GET/POST | `/api/tasks` | List (paginated) / create tasks |
| GET/PATCH | `/api/tasks/[id]` | Get / update task |
| GET/POST | `/api/submissions` | List / create submission |
| POST | `/api/submissions/[id]/review` | Approve or request rework |
| GET/POST | `/api/reports` | Weekly reports |
| PATCH | `/api/reports/[id]` | Mentor feedback |
| GET/POST | `/api/evaluations` | Performance evaluations |
| GET/PATCH | `/api/notifications` | In-app notifications |
| GET | `/api/dashboard` | Role-aware stats |
| GET | `/api/audit` | Admin audit log |
| GET | `/api/certificate` | HTML certificate download |
| GET | `/api/health` | Health check |
| GET | `/api/upload/sign` | Cloudinary signed upload |

## Security

- Rate limiting: login (10/15min), register (5/hr), password reset (3/hr)
- Input sanitization: HTML stripping via sanitize-html on all text inputs
- JWT: 8h expiry, secure+httpOnly cookies in production
- Timing-safe auth: dummy bcrypt hash prevents email enumeration
- CSRF: sameSite=lax cookies
- Security headers: X-Frame-Options, X-Content-Type-Options, etc.
