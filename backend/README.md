# Cloud File Storage System - Backend

Backend API built with **NestJS**, **PostgreSQL**, **Prisma ORM**, and **JWT Authentication**.

---

## Tech Stack

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt
- Cloudinary
- Multer
- Swagger
- Class Validator

---

# Prerequisites

Install the following before starting:

- Node.js (v20 or later)
- PostgreSQL
- Git

Verify installation

```bash
node -v
npm -v
psql --version
```

---

# Clone Repository

```bash
git clone <repository-url>
```

Navigate to backend

```bash
cd backend
```

---

# Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=3001

DATABASE_URL="postgresql://postgres:password@localhost:5432/cloud_storage_db"

JWT_SECRET=your_super_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

# Database Setup

Create a PostgreSQL database.

Example:

```sql
CREATE DATABASE cloud_storage_db;
```

---

# Prisma

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

(Optional)

Open Prisma Studio

```bash
npx prisma studio
```

---

# Run Backend

Development

```bash
npm run start:dev
```

Production

```bash
npm run build

npm run start:prod
```

---

# Swagger

Once the backend is running

```
http://localhost:3001/api
```

---

# Folder Structure

```
src
│
├── auth
├── users
├── prisma
├── folders
├── files
├── shared
├── activity
└── common
```

---

# Features

- User Registration
- User Login
- JWT Authentication
- Prisma ORM
- Swagger Documentation
- Validation
- Cloudinary Integration
- Folder Management
- File Upload
- File Sharing

---

# Useful Commands

Install dependencies

```bash
npm install
```

Generate Prisma Client

```bash
npx prisma generate
```

Create Migration

```bash
npx prisma migrate dev --name migration_name
```

Run Development Server

```bash
npm run start:dev
```

Open Prisma Studio

```bash
npx prisma studio
```

---