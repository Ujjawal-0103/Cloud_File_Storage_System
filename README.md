# CloudRage — Cloud File Storage System

[![Frontend Deployment](https://img.shields.io/badge/Render-Frontend_Live-46E3B7?style=flat&logo=render&logoColor=white)](https://cloudrage.onrender.com)
[![Backend Deployment](https://img.shields.io/badge/Render-Backend_Live-46E3B7?style=flat&logo=render&logoColor=white)](https://cloudrage-backend.onrender.com)
[![Swagger API Docs](https://img.shields.io/badge/Swagger-API_Docs-85EA2D?style=flat&logo=swagger&logoColor=black)](https://cloudrage-backend.onrender.com/api/docs)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**CloudRage** is a modern, production-grade cloud file storage and digital asset management platform. It provides a secure, intuitive environment for users to upload, organize, search, share, and track files and hierarchical folders in real time.

Designed with a decoupled full-stack architecture, CloudRage combines a high-performance Next.js 16 frontend with an enterprise-ready NestJS 11 backend, backed by PostgreSQL through Prisma 7 ORM, Cloudinary cloud storage, and Resend transactional email services. Both services are independently deployed and running live on **Render**.

---

## Live Demo & Important Links

| Resource | URL | Description |
|---|---|---|
| **Live Application (Frontend)** | [https://cloudrage.onrender.com](https://cloudrage.onrender.com) | User-facing web application on Render |
| **Backend API** | [https://cloudrage-backend.onrender.com](https://cloudrage-backend.onrender.com) | REST API service and health checks on Render |
| **API Documentation (Swagger)** | [https://cloudrage-backend.onrender.com/api/docs](https://cloudrage-backend.onrender.com/api/docs) | Interactive OpenAPI / Swagger UI |
| **Source Code** | [https://github.com/Ujjawal-0103/CloudRage](https://github.com/Ujjawal-0103/CloudRage) | GitHub project repository |

---

## Key Features

### 🔐 Authentication & Access Control
- **Email & Password Authentication**: Secure account registration and login with bcrypt password hashing.
- **JWT Authorization**: Dual-token architecture utilizing short-lived access tokens and refresh token rotation with HTTP-only cookie support.
- **Google OAuth 2.0**: One-click social sign-in with automatic account association.
- **Password Recovery**: Secure, time-limited reset tokens delivered via the Resend email service.

### 📁 File & Folder Management
- **Cloud File Uploads**: Direct buffer streaming to Cloudinary with automated rollback cleanup if database persistence fails.
- **Hierarchical Folders**: Infinite-depth nested folder trees with complete parent-child relationship tracking.
- **File Operations**: Rename, move between folders, download, and copy files with metadata persistence (MIME type, size, URL).
- **Search & Quick Filters**: Full-text instant search across files and folders.
- **Favorites & Bookmarks**: Fast one-click starring of critical assets.
- **Trash & Soft Deletion**: Two-stage deletion lifecycle supporting restoration or permanent purge.

### 👥 Sharing & Collaboration
- **Internal User Sharing**: Share files and folders with registered users via granular permissions (`VIEW` or `EDIT`).
- **Public Share Links**: Generate unique, tokenized public sharing links with optional expiration timestamps.
- **Shared Workspace Views**: Dedicated views for items shared with you and items you have shared with others.

### 📊 Dashboard & Analytics
- **Storage Metrics**: Dynamic calculation of total space used, quota tracking, and file breakdown by type.
- **Audit Activity Trail**: Real-time logging of user actions (`UPLOAD`, `DOWNLOAD`, `DELETE`, `SHARE`, `CREATE_FOLDER`, `RENAME_FILE`, etc.).
- **In-App Notifications**: Real-time notifications for incoming shares, permission updates, and system events.

### 🛡️ Security & Performance
- **Reverse Proxy Architecture**: Next.js server-side rewrites proxy API traffic to the backend, preventing CORS exposure.
- **Defense in Depth**: Helmet HTTP security headers, CORS origin whitelisting, and `@nestjs/throttler` rate limiting.
- **Sanitized Global Diagnostics**: Centralized exception filtering with production-safe error masking and server-side log sanitization.

---

## Screenshots

> *UI previews and feature captures will be added here as new visual assets are published.*

```text
Optional screenshot locations:
- Dashboard: /frontend/public/screenshots/dashboard.png
- File Explorer: /frontend/public/screenshots/explorer.png
- Share Modal: /frontend/public/screenshots/share-dialog.png
```

---

## Technology Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components & Icons**: [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Form Management & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Data Fetching**: Native Fetch API via Next.js `/api/backend/*` proxy rewrites

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js application framework)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma 7 ORM](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-pg`)
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/) Node SDK & Multer memory storage
- **Email Service**: [Resend](https://resend.com/)
- **Authentication**: [Passport](http://www.passportjs.org/), `@nestjs/jwt`, `passport-jwt`, `bcrypt`
- **Security & Utilities**: `helmet`, `cors`, `compression`, `@nestjs/throttler`
- **API Documentation**: `@nestjs/swagger` with `swagger-ui-express`
- **Validation**: `class-validator` and `class-transformer`

### Infrastructure
- **Hosting Platform**: [Render](https://render.com/) (Two independent Web Services for Frontend and Backend)
- **Database**: PostgreSQL
- **Version Control**: GitHub (`Ujjawal-0103/CloudRage`)

---

## Architecture

CloudRage uses a secure, decoupled architecture where the Next.js frontend handles SSR and client interactions, proxying backend requests through a server-side rewrite route (`/api/backend/*`) to the NestJS API on Render.

```mermaid
flowchart TD
    User["User Browser"] -->|HTTPS| Frontend["CloudRage Frontend<br/>https://cloudrage.onrender.com"]
    Frontend -->|Internal Proxy<br/>/api/backend/*| Backend["CloudRage Backend<br/>https://cloudrage-backend.onrender.com"]

    Backend -->|Prisma 7 ORM| DB[("PostgreSQL Database")]
    Backend -->|Buffer Stream Upload| Cloudinary[("Cloudinary Cloud Storage")]
    Backend -->|Transactional Emails| Resend["Resend Email API"]
    Backend -->|OAuth 2.0 Verification| Google["Google Identity Services"]
```

---

## Project Directory Structure

```text
CloudRage/
├── frontend/                     # Next.js 16 Web Application
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (login, register, forgot-password, reset-password)
│   │   ├── (dashboard)/          # Authenticated app views (dashboard, files, favorites, shared, trash, settings)
│   │   ├── auth/callback/        # OAuth callback receiver
│   │   ├── public/share/[token]/ # Public file access route
│   │   └── globals.css           # Global Tailwind CSS styles
│   ├── components/               # Reusable UI components & layouts
│   ├── lib/                      # API client modules, helpers, and utilities
│   ├── public/                   # Static assets (logo, icons)
│   ├── next.config.ts            # Next.js configuration & /api/backend rewrite proxy
│   ├── package.json              # Frontend dependencies and scripts
│   └── .env.example              # Frontend environment variables template
│
├── backend/                      # NestJS 11 REST API Service
│   ├── src/
│   │   ├── auth/                 # JWT & Google OAuth authentication, mailers
│   │   ├── users/                # User accounts & profile management
│   │   ├── files/                # File upload, download, metadata, and storage APIs
│   │   ├── folders/              # Folder hierarchy and organization
│   │   ├── sharing/              # Internal sharing & public token links
│   │   ├── favorites/            # Favorites bookmarking system
│   │   ├── trash/                # Soft deletion & permanent purge
│   │   ├── dashboard/            # Storage metrics & user analytics
│   │   ├── notifications/        # In-app notifications
│   │   ├── search/               # Full-text search across resources
│   │   ├── cloudinary/           # Cloudinary storage provider integration
│   │   ├── prisma/               # Prisma service and database connectivity
│   │   ├── common/               # Filters, interceptors, guards, decorators
│   │   └── main.ts               # Application entry point, Swagger, and middleware
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma data schema & relations
│   │   └── migrations/           # Database migration history
│   ├── test/                     # End-to-end (E2E) test suites
│   ├── package.json              # Backend dependencies and scripts
│   └── .env.example              # Backend environment variables template
│
└── README.md                     # Root project documentation
```

---

## Prerequisites

Ensure the following tools are installed on your machine before running the project locally:

- **Node.js**: `v20.x` or later (verify with `node -v`)
- **npm**: `v10.x` or later (verify with `npm -v`)
- **Git**: (verify with `git --version`)
- **PostgreSQL**: `v14.x` or later running locally or accessible remotely
- **Cloudinary Account**: Cloud name, API key, and API secret
- **Resend Account** *(optional for local testing)*: API key for email recovery

---

## Local Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ujjawal-0103/CloudRage.git
cd CloudRage
```

---

### 2. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your local PostgreSQL and Cloudinary credentials

# Generate Prisma Client
npx prisma generate

# Apply existing database migrations
npx prisma migrate dev

# Start NestJS development server
npm run start:dev
```

The backend server will start on `http://localhost:3001`.

---

### 3. Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Set BACKEND_URL=http://localhost:3001

# Start Next.js development server
npm run dev
```

The frontend application will be accessible at `http://localhost:3000`.

---

### Local Development Endpoints

| Service | Local URL |
|---|---|
| **Frontend Application** | `http://localhost:3000` |
| **Backend API** | `http://localhost:3001` |
| **Backend Health Check** | `http://localhost:3001/` |
| **Swagger Documentation** | `http://localhost:3001/api/docs` |

---

## Environment Variables

### Frontend Variables (`frontend/.env.local`)

| Variable | Description | Local Value | Production Value (Render) |
|---|---|---|---|
| `BACKEND_URL` | Target backend URL for Next.js API proxy | `http://localhost:3001` | `https://cloudrage-backend.onrender.com` |

> [!IMPORTANT]
> The Next.js frontend proxies all `/api/backend/*` requests directly to `BACKEND_URL`. Never configure `BACKEND_URL` to point to `localhost` in production.

---

### Backend Variables (`backend/.env`)

| Variable | Description | Example / Required Format |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/dbname?sslmode=require` |
| `PORT` | API server listening port | `3001` *(Render automatically assigns this in production)* |
| `NODE_ENV` | Application environment | `development` or `production` |
| `FRONTEND_URL` | Origin URL for CORS and OAuth redirects | `http://localhost:3000` (Local) / `https://cloudrage.onrender.com` (Render) |
| `JWT_SECRET` | Secret key for signing access tokens | Strong 64-character random string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Strong 64-character random string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | Alphanumeric identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Numeric identifier |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Alphanumeric secret |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | Google Cloud secret |
| `GOOGLE_CALLBACK_URL` | Authorized OAuth redirect URI | `https://cloudrage-backend.onrender.com/api/auth/google/callback` |
| `RESEND_API_KEY` | Resend API key for sending emails | `re_...` |
| `RESEND_FROM_EMAIL` | Sender address for transactional emails | `CloudRage <onboarding@resend.dev>` or verified domain |

> [!CAUTION]
> Never commit `.env` or `.env.local` files to version control. Always maintain secrets securely in Render Web Service environment settings.

---

## API Documentation

Interactive Swagger API documentation is available live at:

**[https://cloudrage-backend.onrender.com/api/docs](https://cloudrage-backend.onrender.com/api/docs)**

### API Resource Groups

- **Auth** (`/api/auth`): User registration, credential login, Google OAuth, token refresh, logout, password recovery.
- **Users** (`/api/users`): Profile management, user info, password updates.
- **Files** (`/api/files`): Upload (`multipart/form-data`), list, download, rename, move, delete, storage metrics.
- **Folders** (`/api/folders`): Create, list, rename, delete, restore folder hierarchies.
- **Sharing** (`/api/sharing`): Share files and folders with users, create public share tokens, retrieve received/sent shares.
- **Favorites** (`/api/favorites`): Toggle and list favorited files and folders.
- **Trash** (`/api/trash`): Soft-deleted items, restoration, permanent deletion.
- **Dashboard** (`/api/dashboard`): Aggregate storage statistics and chronological activity history.
- **Notifications** (`/api/notifications`): Unread counts, list notifications, mark items as read.
- **Search** (`/api/search`): Query files and folders with text search filters.

---

## Production Deployment on Render

Both the frontend and backend are hosted on **Render** as separate Web Services connected to the GitHub repository:

### 1. Frontend Web Service
- **Service Type**: Web Service
- **Environment**: Node
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Production URL**: `https://cloudrage.onrender.com`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `BACKEND_URL`: `https://cloudrage-backend.onrender.com`

---

### 2. Backend Web Service
- **Service Type**: Web Service
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Health Check Path**: `/`
- **Production URL**: `https://cloudrage-backend.onrender.com`
- **Database Migrations**: Apply migrations prior to or during backend deployment:
  ```bash
  npx prisma migrate deploy
  ```
- **Environment Variables**: Populate all required backend variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `GOOGLE_*`, `RESEND_*`, `FRONTEND_URL=https://cloudrage.onrender.com`).

---

## Authentication & Integrations

### Google OAuth 2.0 Setup
1. In the **Google Cloud Console**, navigate to **APIs & Services > Credentials**.
2. Configure an **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` *(Local development)*
   - `https://cloudrage.onrender.com` *(Render production frontend)*
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3001/api/auth/google/callback` *(Local development)*
   - `https://cloudrage-backend.onrender.com/api/auth/google/callback` *(Render production backend)*
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in the backend service. When authentication succeeds, the backend redirects the user to `${FRONTEND_URL}/auth/callback?token=...`.

### Password Recovery via Resend
1. Generate an API key in your **Resend** dashboard.
2. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the backend environment.
3. Password reset links are formatted dynamically using `FRONTEND_URL`:
   `${FRONTEND_URL}/reset-password?token=<reset_token>`

---

## Testing

CloudRage includes unit, service, controller, and integration tests across both applications.

### Backend Tests

Run all unit tests:

```bash
cd backend
npm test
```

Run test suite with coverage report:

```bash
cd backend
npm run test:cov
```

Run end-to-end (E2E) tests:

```bash
cd backend
npm run test:e2e
```

### Frontend Checks

Run ESLint and TypeScript compilation checks:

```bash
cd frontend
npm run lint
npm run build
```

---

## Security Notes

- **Password Encryption**: All passwords are salted and hashed with `bcrypt` prior to storage.
- **Sanitized Logging**: The backend exception filter automatically masks sensitive tokens, passwords, and API keys from production logs.
- **Security Headers**: Standard security headers (Content Security Policy, X-XSS-Protection, HSTS) are applied via `helmet`.
- **Rate Limiting**: Critical endpoints (such as authentication and password reset) are throttled via `@nestjs/throttler` to prevent brute-force attacks.
- **SQL Injection Prevention**: All database interactions are executed via Prisma 7 parameterized queries.
- **Cloud Asset Rollback**: If a database write fails during file upload, the uploaded Cloudinary asset is automatically purged to prevent orphaned resources.

---

## Known Limitations

- **File Upload Size**: Multer is currently configured with a 50 MB maximum per-file payload limit.
- **Storage Provider**: File storage is currently integrated with Cloudinary; multi-provider fallbacks are not yet enabled.

---

## Contributing & License

### Contributing
1. Fork the repository.
2. Create a descriptive feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes with clear messages (`git commit -m 'feat: add folder color tags'`).
4. Push to your branch (`git push origin feature/new-feature`).
5. Open a Pull Request for review.

### License
This project is currently unlicensed / proprietary. All rights are reserved by the repository owner ([@Ujjawal-0103](https://github.com/Ujjawal-0103)).

---

## Acknowledgments

- [Next.js](https://nextjs.org/) by Vercel
- [NestJS](https://nestjs.com/) by Kamil Myśliwiec
- [Prisma](https://www.prisma.io/)
- [Cloudinary](https://cloudinary.com/)
- [Resend](https://resend.com/)
- [Render](https://render.com/)