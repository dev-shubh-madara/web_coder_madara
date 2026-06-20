<div align="center">

<!-- Animated 3D Title Banner -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=JEE%20MOCK%20TEST&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Next-Gen%20Exam%20Preparation%20Platform&descAlignY=58&descSize=18&animation=fadeIn" />

<br/>

<!-- Animated Logo / Badge -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=28&pause=1000&color=7C3AED&background=00000000&center=true&vCenter=true&multiline=true&width=600&height=80&lines=⚡+Built+for+IIT+Aspirants;🎯+Precision+Test+Engine;🚀+Real+Exam+Simulation" alt="Typing SVG" />

<br/><br/>

<!-- Status Badges Row -->
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

<!-- Animated Stats Snake -->
<img src="https://github-readme-activity-graph.vercel.app/graph?username=ragini19854-prog&theme=tokyo-night&bg_color=0d1117&color=7c3aed&line=7c3aed&point=ffffff&area=true&hide_border=true" width="90%" alt="Activity Graph"/>

</div>

---

<div align="center">

## 🌌 What is JEE Mock Test?

</div>

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   JEE Mock Test is a full-stack exam simulation platform        ║
║   built for IIT-JEE aspirants. Real questions, real timer,      ║
║   real leaderboard — the closest thing to the actual exam.      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

<br/>

---

## ✨ Feature Matrix

<div align="center">

| Feature | Status | Description |
|--------|--------|-------------|
| 🧪 **Mock Exams** | ✅ Live | Full-length JEE simulation with real timer |
| 📊 **Analytics & Insights** | ✅ Live | Deep performance breakdown by subject |
| 🏆 **Leaderboard** | ✅ Live | Compete globally with other aspirants |
| 🔐 **Auth System** | ✅ Live | Secure login with protected routes |
| 📱 **Responsive UI** | ✅ Live | Pixel-perfect on mobile & desktop |
| 🎯 **Result Analysis** | ✅ Live | Question-level review post-exam |
| 👑 **Admin Panel** | ✅ Live | Manage tests, questions, and users |
| 🌙 **Dark Mode** | ✅ Live | Eye-friendly exam environment |

</div>

---

## 🏗️ Architecture

```mermaid
graph TD
    A[🌐 Browser] -->|HTTPS| B[⚡ Vite Frontend]
    B --> C[📦 jee-mock / React 19]
    C --> D[🔌 API Client React]
    D -->|REST| E[🚀 Express API Server]
    E --> F[(🗄️ Database / Drizzle ORM)]
    
    style A fill:#7c3aed,color:#fff
    style B fill:#646cff,color:#fff
    style C fill:#61dafb,color:#000
    style D fill:#f59e0b,color:#000
    style E fill:#10b981,color:#fff
    style F fill:#ef4444,color:#fff
```

---

## 📂 Project Structure

```bash
web_coder_madara/
│
├── 📁 artifacts/
│   ├── 🎨 jee-mock/           # Main frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/         # Home, Dashboard, Exam, Result...
│   │   │   ├── components/    # Reusable UI + shadcn components
│   │   │   └── lib/           # Auth, utilities
│   │   └── vite.config.ts
│   │
│   ├── 🖥️ api-server/         # Express backend
│   │   └── src/               # Routes, middleware, controllers
│   │
│   └── 🔬 mockup-sandbox/     # Design playground
│
├── 📁 lib/
│   ├── api-client-react/      # Typed API hooks
│   ├── api-spec/              # Shared API contracts
│   ├── api-zod/               # Zod validation schemas
│   └── db/                    # Drizzle ORM schema + migrations
│
├── vercel.json                # Vercel deployment config
└── pnpm-workspace.yaml        # Monorepo workspace
```

---

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18
pnpm >= 9
```

### Installation

```bash
# Clone the repository
git clone https://github.com/ragini19854-prog/web_coder_madara.git
cd web_coder_madara

# Install all dependencies
pnpm install

# Start development (frontend)
cd artifacts/jee-mock
PORT=3000 BASE_PATH=/ pnpm dev
```

### Build for Production

```bash
cd artifacts/jee-mock
pnpm build
```

---

## 🌐 Deployment

### Deploy to Vercel (One Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ragini19854-prog/web_coder_madara)

The `vercel.json` at the root auto-configures:
- ✅ Build command pointing to `jee-mock`
- ✅ SPA rewrites for React Router
- ✅ pnpm install pipeline

---

## 🛠️ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,nodejs,express,pnpm,vercel&theme=dark" />

</div>

<br/>

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Styling** | Tailwind CSS v4, Framer Motion, shadcn/ui |
| **State** | TanStack Query v5 |
| **Routing** | Wouter |
| **Backend** | Express.js 5 |
| **Database** | Drizzle ORM |
| **Package Manager** | pnpm (monorepo) |
| **Deploy** | Vercel |

---

## 📸 Screenshots

> Coming soon — exam interface, dashboard analytics, and leaderboard views.

---

## 🤝 Contributing

```bash
# Fork → Clone → Branch → Code → PR

git checkout -b feat/your-feature
git commit -m "feat: add amazing feature"
git push origin feat/your-feature
```

PRs are welcome! Please follow the existing code style.

---

## 📜 License

MIT © [ragini19854-prog](https://github.com/ragini19854-prog)

---

<div align="center">

<!-- Footer Wave -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer&animation=fadeIn" />

<br/>

**Built with 💜 for every JEE aspirant chasing their IIT dream**

<br/>

![Visitor Count](https://komarev.com/ghpvc/?username=ragini19854-prog&color=7c3aed&style=for-the-badge&label=REPO+VIEWS)

</div>
