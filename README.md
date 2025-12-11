# 🚀 DailyDash

**DailyDash** is a modern, productivity-focused task management application designed to help you build momentum and maintain streaks through daily task completion. With a beautiful dark-themed interface and powerful features, DailyDash transforms how you organize your day and track your progress.

![DailyDash](https://img.shields.io/badge/version-0.0.0-blue) ![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)

---

## ✨ What is DailyDash?

DailyDash is a **personal productivity dashboard** that combines task management with gamification elements like streaks and daily scores. It's built for individuals who want to:

- Stay organized with daily task planning
- Track progress on both short-term and longer-term goals
- Build consistent habits through streak tracking
- Visualize productivity momentum over time
- Manage tasks across multiple devices with real-time sync

Whether you're a student, professional, or anyone looking to boost productivity, DailyDash provides an intuitive interface to plan your day, track your progress, and celebrate your wins.

---

## 🎯 Features

### Core Features

- **📋 Task Management** - Create tasks with custom categories, colors, progress tracking, estimated hours, and deadlines
- **⏱️ Built-in Timer** - Pomodoro-style timer with custom durations (15/25/45/60 min) and pause/resume functionality
- **📅 Date Navigation** - Calendar view with productivity indicators and quick date switching
- **🔥 Streak Tracking** - Daily consistency counter with automatic updates and visual indicators
- **📊 Daily Score & Momentum** - Automatic score calculation (0-100%) with weekly momentum visualization
- **📝 Longer Tasks** - Multi-day project tracking with daily task linking and progress visualization
- **📱 Responsive Design** - Mobile-optimized with bottom navigation and desktop three-column layout
- **🔐 Authentication** - Supabase auth with row-level security and user profiles
- **🔄 Real-time Sync** - Live updates across devices with offline-ready state management

### 🌟 What Makes DailyDash Unique

- **Momentum-Based Tracking** - Visual weekly charts show productivity trends at a glance
- **Timer-Task Integration** - Start timers directly from tasks with automatic progress updates
- **Gamified Streaks** - Daily consistency tracking integrated into your workflow
- **Smart Daily Score** - Auto-calculated based on completion, progress, and estimated hours
- **Long-Term Project Bridge** - Link daily tasks to broader goals without losing focus
- **Premium Dark UI** - Vibrant accent colors, smooth animations, and glassmorphism effects

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 19.2.1 with TypeScript
- **Build Tool:** Vite 6.2.0
- **State Management:** Zustand 5.0.9
- **Backend/Database:** Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS (via CDN)
- **UI Components:** Custom components with Material Symbols icons
- **Date Handling:** date-fns 4.1.0
- **Notifications:** react-hot-toast 2.6.0
- **Fonts:** Spline Sans (Google Fonts)

---

## 📸 Screenshots

<video src="‎DailyDash Demo (1).mp4" width="600" controls></video>

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A **Supabase account** (free tier works perfectly)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/DailyDashApp.git
cd DailyDashApp
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Execute the SQL to create all necessary tables, indexes, and RLS policies

3. **Get your Supabase credentials:**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon/public` API key

### Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase credentials.

### Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

---

## 🚀 Usage

### Getting Started

1. **Sign Up / Login**
   - Create a new account with your email and password
   - Or log in if you already have an account

2. **Create Your First Task**
   - Click the "+" button in the task column
   - Enter task details:
     - Title (required)
     - Category (custom or predefined)
     - Estimated hours
     - Deadline (optional)
     - Initial progress
   - Click "Create Task"

3. **Track Your Progress**
   - Use the progress slider to update task completion
   - Click the checkmark to mark tasks as complete
   - Start a timer to track time spent on tasks

4. **Build Your Streak**
   - Complete at least one task daily to maintain your streak
   - Watch your daily score update automatically
   - View your weekly momentum in the stats column

5. **Manage Longer Projects**
   - Click "Add Longer Task" in the stats column
   - Create project milestones
   - Link daily tasks to longer projects
   - Track overall project progress

### Key Workflows

#### Daily Planning
1. Navigate to today's date (default view)
2. Review existing tasks or create new ones
3. Set priorities using categories and deadlines
4. Estimate time for each task

#### Focused Work Session
1. Select a task
2. Click the timer icon
3. Choose duration (or set custom time)
4. Work until timer completes
5. Update task progress

#### Weekly Review
1. Use date navigation to review past days
2. Check weekly momentum chart
3. Review streak consistency
4. Plan improvements for next week

---

## 📱 Mobile Usage

DailyDash automatically adapts to mobile devices with:
- **Bottom navigation** for easy thumb access
- **Swipeable date selector** for quick navigation
- **Compact task cards** optimized for small screens
- **Mobile-friendly modals** for task creation/editing
- **Touch-optimized timer controls**

---

## 🏗️ Project Structure

```
DailyDashApp/
├── components/           # Desktop UI components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── TaskColumn.tsx
│   ├── StatsColumn.tsx
│   └── Mobile*.tsx       # Mobile-specific components
├── src/
│   ├── api/             # Supabase API calls
│   ├── components/      # Shared components (modals, auth, etc.)
│   ├── contexts/        # React contexts (Auth)
│   ├── stores/          # Zustand state stores
│   └── utils/           # Utility functions
├── migrations/          # Database migrations
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── index.html          # HTML template
└── supabase-schema.sql # Database schema
```

---

## 🔧 Configuration

### Customizing Colors

Edit the Tailwind config in `index.html`:

```javascript
colors: {
  primary: "#2bee79",           // Main accent color
  "primary-dark": "#23c563",    // Darker accent
  "background-dark": "#111814",  // Main background
  "surface-dark": "#1A2520",    // Card backgrounds
  "surface-border": "#28392f",  // Border color
}
```

### Adding Custom Categories

Categories are user-defined. Available colors are defined in `types.ts`:
- `indigo`
- `primary` (green)
- `emerald`
- `purple`
- `pink`

---

## 🧪 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📄 License

This project is licensed under the **MIT License**.

### MIT License

```
MIT License

Copyright (c) 2025 Akshat

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🐛 Known Issues & Roadmap

### Known Issues
- Timer may not persist across page refreshes (planned fix)
- Mobile date selector requires swipe calibration on some devices

### Roadmap
- [ ] Task templates for recurring tasks
- [ ] Export data to CSV/JSON
- [ ] Dark/Light theme toggle
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Collaborative tasks and sharing
- [ ] Mobile app (React Native)
- [ ] AI-powered task suggestions

---

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the Supabase documentation for backend-related questions

---

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **React** team for the incredible UI library
- **Vite** for the lightning-fast build tool
- **Material Symbols** for the beautiful icon set
- **Google Fonts** for Spline Sans typography

---

## ⭐ Star History

If you find DailyDash useful, please consider giving it a star on GitHub! It helps others discover the project.

---

**Built with ❤️ and ☕ by Akshat**

*Stay productive, build momentum, and crush your goals with DailyDash!* 🚀
