# Cloud File Storage System - Frontend

Frontend built using **Next.js**, **React**, **Tailwind CSS**, and **TypeScript**.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- shadcn/ui

---

# Prerequisites

Install

- Node.js
- npm
- Git

Verify

```bash
node -v
npm -v
```

---

# Clone Repository

```bash
git clone <repository-url>
```

Navigate to frontend

```bash
cd frontend
```

---

# Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create `.env.local` inside the frontend directory:

```env
# Backend API URL for Next.js proxy rewrite (/api/backend/*)
# Local development:
BACKEND_URL=http://localhost:3001

# Production (Render Web Service):
# BACKEND_URL=https://cloudrage-backend.onrender.com
```

---

# Run Frontend

Development:

```bash
npm run dev
```

Production build & start:

```bash
npm run build
npm run start
```

---

# URLs

| Environment | URL |
|---|---|
| Local Development | http://localhost:3000 |
| Production (Render) | https://cloudrage.onrender.com |

---

# Folder Structure

```
app
components
lib
hooks
types
services
utils
```

---

# Features

- Authentication
- Dashboard
- Folder Management
- File Upload
- File Preview
- Sharing
- Search
- Responsive UI

---

# Useful Commands

Install Packages

```bash
npm install
```

Development

```bash
npm run dev
```

Production Build

```bash
npm run build
```

Start Production

```bash
npm run start
```

---

