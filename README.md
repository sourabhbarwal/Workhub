# 🚀 FocusTrack – Full Stack Productivity & Team Management Platform

FocusTrack is a **production-ready, role-based task and productivity management platform** built using modern full-stack technologies.  
It supports **Admin & Member roles**, **team collaboration**, **focus mode**, **analytics**, and **secure authentication**, designed to mirror real-world SaaS applications.

---

## 🌐 Live Demo & Source Code

- **Frontend (Vercel)**  
  https://focus-track.vercel.app

- **Backend API (Render)**  
  https://focus-track-backend.onrender.com

- **GitHub Repository**  
  https://github.com/sourabhbarwal/Focus-Track

---

## 🧠 Why FocusTrack?

Most productivity tools:
- Lack **role-based permissions**
- Mix personal and team workflows
- Ignore **focus-oriented productivity**
- Provide limited performance insights

**FocusTrack solves this by combining** authentication, authorization, task lifecycle management, focus sessions, and analytics in one cohesive system.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Firebase Authentication (Email/Password)
- Backend user synchronization
- Role-based access control (**Admin / Member**)
- Secure session handling

### 👥 Admin Features
- View all registered users
- Create teams from existing users
- View **all teams across the system**
- Edit **only teams created by themselves**
- View team members, tasks & progress
- Delete teams with cascading cleanup

### 👤 Member Features
- Personal task management
- Team task participation
- Mark tasks as completed
- Focus Mode for deep work sessions

### 🧠 Productivity & Analytics
- Focus Mode with Pomodoro-style timer
- Due-date validation for tasks
- Completion score calculation
- Analytics dashboard:
  - Completed vs pending tasks
  - On-time vs late completion
  - Overdue task tracking
  - Average productivity score

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion
- Axios
- Firebase Authentication

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- REST APIs

### DevOps & Deployment
- Frontend: **Vercel**
- Backend: **Render**
- Database: **MongoDB Atlas**
- Authentication: **Firebase**
- Environment-based configuration

---
### Prequisites for Local Setup
- Firebase Project
- MongoDB Atlas Project/cluster
- Node.js
--- 
## ⚙️ Local Setup

  1️⃣ Clone the Repository

      git clone https://github.com/sourabhbarwal/Focus-Track.git
      cd Focus-Track

  2️⃣ Backend Setup

      cd backend
      npm install
      
      Create a .env file:
        Port:5000
        MONGODB_URI=your_mongodb_atlas_uri

      Start backend:
        node server.js

  3️⃣ Frontend Setup

      cd ../frontend
      npm install

      Create .env file:
        VITE_API_BASE_URL=http://localhost:5000 {Later your backend render url}
        VITE_FIREBASE_API_KEY=your_key
        VITE_FIREBASE_AUTH_DOMAIN=your_domain
        VITE_FIREBASE_PROJECT_ID=your_project_id

      Start frontend:
        npm run dev

---

### Now you are all set. Happy Coding...
