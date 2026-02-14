-- Users table (synced with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id),
  topic TEXT NOT NULL,
  min_players INTEGER DEFAULT 4,
  max_players INTEGER DEFAULT 10,
  round_timer INTEGER DEFAULT 120,
  status TEXT DEFAULT 'WAITING', -- WAITING, IN_PROGRESS, FINISHED
  created_at TIMESTAMP DEFAULT NOW()
);

-- Room participants
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  is_imposter BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  voted_for_id UUID REFERENCES users(id),
  round_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, voter_id, round_number)
);

-- Game rounds
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INTEGER,
  word TEXT, -- the actual word for this round
  imposter_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'DISCUSSION', -- DISCUSSION, VOTING, FINISHED
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

---

### UI/UX Requirements

#### Homepage
- Title: "Imposter Word Game"
- Two big buttons: "Create Room" | "Join Room"
- Show global leaderboard (top 10)
- Google Sign-In button if not logged in

#### Create Room Page
- Form with:
  - Topic dropdown (Parfum, Game Online, F1, Umum)
  - Min players (4-6-8)
  - Max players (6-8-10)
  - Round timer (60s, 90s, 120s, 180s, 300s)
- "Create Room" button → generates code, redirects to lobby

#### Join Room Page
- Input field for 6-character code
- "Join Room" button
- Shows error if code invalid

#### Lobby Page
- Display room code prominently (with copy button)
- Show room settings
- List all joined players (avatar + name)
- Real-time updates as players join
- Host sees "Start Game" button (disabled until min players)
- Other players see "Waiting for host..."

#### Game Page
**Layout:**
- Top: Timer (big countdown)
- Left sidebar: Player list with speaking indicators
- Center: Your word card (big, centered)
  - If normal player: "Your word is: VANILLA"
  - If imposter: "You are the IMPOSTER!"
- Right sidebar: Text chat
- Bottom: Push-to-Talk button (visual feedback when held)

**Voting Phase:**
- Replace center area with voting grid
- Show player cards (clickable)
- Selected player highlighted
- Submit button

**Results Phase:**
- Show voting results table
- Highlight imposter
- Show score changes
- "Next Round" button (host only)

#### Leaderboard Page
- Tabs: Global | Current Room
- Table: Rank, Avatar, Name, Points

---

### Vercel Deployment Requirements

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ELEVENLABS_API_KEY= (optional, for sound)