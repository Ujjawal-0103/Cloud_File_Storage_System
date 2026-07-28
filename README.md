# ☁️ Cloud File Storage System

A secure, scalable, and modern cloud-based file storage platform built with **Next.js**, **NestJS**, **PostgreSQL**, **Prisma**, and **Cloudinary**.

The system allows users to securely upload, organize, share, and manage files with JWT-based authentication, folder hierarchy, activity tracking, and cloud storage.

---

# 🚀 Features

### Authentication
- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Password Hashing using bcrypt

### File Management
- Upload Files
- Download Files
- Delete Files
- Rename Files
- Move Files
- File Metadata

### Folder Management
- Create Folder
- Rename Folder
- Delete Folder
- Nested Folder Structure

### Sharing
- Share Files
- Share Folders
- View Permissions
- Edit Permissions

### Dashboard
- Storage Usage
- Recent Files
- Activity History
- User Statistics

### Activity Logs
- Upload History
- Download History
- Delete History
- Share History
- Login History

---

# 🏗️ Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios
- React Hook Form
- Zod

---

## Backend

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt
- Multer
- Cloudinary
- Swagger
- Class Validator

---

# 📂 Project Structure

```text
Cloud_File_Storage_System
│
├── backend
│   ├── src
│   ├── prisma
│   ├── uploads (optional)
│   ├── README.md
│   └── package.json
│
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   ├── public
│   ├── README.md
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

# ⚙️ Prerequisites

Before running the project, make sure the following are installed:

- Git
- Node.js (v20 or later)
- npm
- PostgreSQL

Verify installation:

```bash
node -v
npm -v
git --version
psql --version
```

---

# 📥 Clone Repository

```bash
git clone https://github.com/<your-username>/Cloud_File_Storage_System.git
```

Navigate to the project:

```bash
cd Cloud_File_Storage_System
```

---

# 📦 Setup Guide

The project consists of two independent applications:

```text
Cloud_File_Storage_System
│
├── backend
└── frontend
```

### 1. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Follow the setup instructions in:

```text
backend/README.md
```

This includes:

- Installing dependencies
- Configuring environment variables
- PostgreSQL setup
- Prisma setup
- Running database migrations
- Starting the backend server

---

### 2. Frontend Setup

Open a new terminal.

Navigate to the frontend:

```bash
cd frontend
```

Follow the setup instructions in:

```text
frontend/README.md
```

This includes:

- Installing dependencies
- Configuring environment variables
- Running the development server

---

# ▶️ Running the Application

Start the backend first.

```bash
cd backend

npm install

npm run start:dev
```

Then start the frontend.

```bash
cd frontend

npm install

npm run dev
```

---

# 🌐 Default URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger API Docs | http://localhost:3001/api |

---

# 📚 API Documentation

Swagger documentation is available after starting the backend:

```text
http://localhost:3001/api
```

Swagger provides:

- Request/Response examples
- DTO validation
- Authentication testing
- API documentation

---

# 🛠️ Development Workflow

1. Clone the repository.
2. Complete the backend setup.
3. Complete the frontend setup.
4. Start PostgreSQL.
5. Run backend.
6. Run frontend.
7. Open the application in your browser.

---

# 🌿 Git Workflow

### Pull latest changes

```bash
git pull origin main
```

### Create a new branch

```bash
git checkout -b feature/your-feature-name
```

### Commit changes

```bash
git add .

git commit -m "Add feature"
```

### Push branch

```bash
git push origin feature/your-feature-name
```

### Create a Pull Request

Open a Pull Request into the `main` branch for review.

---

# 📅 Project Roadmap

## ✅ Sprint 0
- Project Setup
- Backend Foundation
- Frontend Foundation

## ✅ Sprint 1
- User Authentication
- JWT Authentication
- Swagger
- Validation

## 🚧 Sprint 2
- Folder Management
- Nested Folder Structure

## 🚧 Sprint 3
- File Upload
- Cloudinary Integration
- File Metadata

## 🚧 Sprint 4
- File Sharing
- Permission Management

## 🚧 Sprint 5
- Activity Logs
- Dashboard
- Storage Analytics

---

# 👥 Team

| Role | Responsibility |
|------|----------------|
| Frontend Developers | UI, State Management, API Integration |
| Backend Developers | APIs, Authentication, Database, Cloud Storage |
| Database | PostgreSQL, Prisma ORM |
| DevOps | Deployment, Environment Configuration |

---

# 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

Please ensure:

- Code follows project conventions.
- New APIs are documented in Swagger.
- Code is tested before submitting.
- Do not commit `.env` files or secrets.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# ⭐ Acknowledgements

Built using:

- NestJS
- Next.js
- Prisma ORM
- PostgreSQL
- Cloudinary
- Tailwind CSS
- React
- TypeScript
- Swagger