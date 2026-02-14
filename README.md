# 🎮 Imposter Word Game

Multiplayer word guessing game built with Vue.js 3 where players must find the imposter who doesn't know the secret word!

## 🚀 Features

- **🎯 Strategic Gameplay**: Discuss and vote to find the imposter
- **🎤 Voice Chat**: Real-time WebRTC voice communication with push-to-talk
- **⚡ Real-time Updates**: Instant synchronization across all players using Supabase Realtime
- **🎨 Beautiful UI**: Stunning gradient design with smooth animations
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **🔐 Google OAuth**: Secure authentication via Google
- **🏆 Leaderboard**: Track top players and win rates

## 🛠️ Tech Stack

- **Frontend**: Vue 3 + Composition API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Real-time**: Supabase Realtime subscriptions
- **Voice Chat**: WebRTC with Simple-Peer
- **Deployment**: Vercel / Netlify

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Console project (for OAuth)

## 🔧 Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd ImposterGameCopilot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `database_Scheme.sql` in Supabase SQL Editor
3. Get your Supabase URL and Anon Key from Project Settings > API

### 4. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
6. Copy Client ID

### 5. Configure Supabase Auth

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Paste your Google Client ID and Client Secret
4. Save changes

### 6. Environment Variables

Create `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 8. Build for Production

```bash
npm run build
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Import project in Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

**Important**: After deployment, update the Google OAuth redirect URI with your production URL.

## 🎮 How to Play

1. **Sign in** with your Google account
2. **Create a room** or **join** an existing room with a 6-character code
3. Wait in the **lobby** for at least 4 players
4. Host starts the game
5. **Discussion Phase**: All players except the imposter see the secret word. Discuss to find the imposter!
6. **Voting Phase**: Vote for who you think is the imposter
7. **Results**: See if you found the imposter correctly
8. Play multiple rounds and climb the leaderboard!

## 📁 Project Structure

```
├── src/
│   ├── views/          # Page components
│   │   ├── Home.vue
│   │   ├── AuthCallback.vue
│   │   ├── CreateRoom.vue
│   │   ├── JoinRoom.vue
│   │   ├── Lobby.vue
│   │   ├── Game.vue
│   │   └── Leaderboard.vue
│   ├── router/         # Vue Router config
│   ├── lib/            # Utilities (Supabase client)
│   ├── App.vue         # Root component
│   ├── main.js         # Entry point
│   └── style.css       # Global styles
├── public/             # Static assets
├── database_Scheme.sql # Database schema
└── package.json        # Dependencies
```

## 🔐 Security Notes

- Never commit `.env.local` to Git
- Supabase Row Level Security (RLS) is enabled on all tables
- Google OAuth handles authentication securely

## 📝 License

MIT License - feel free to use this project for anything!

## 🤝 Contributing

Pull requests welcome! Feel free to improve the game.

## 🐛 Troubleshooting

- **Build errors**: Make sure all environment variables are set correctly
- **Auth not working**: Verify Google OAuth redirect URIs match your domain
- **Real-time not updating**: Check Supabase project status and API keys

---

Made with ❤️ using Vue.js and Supabase
