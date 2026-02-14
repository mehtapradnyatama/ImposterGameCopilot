export const TOPICS = {
  PARFUM: 'Parfum/Fragrance',
  GAME_ONLINE: 'Game Online',
  FORMULA_1: 'Formula 1',
  UMUM: 'Umum (General)'
} as const;

export const WORDS: Record<string, string[]> = {
  [TOPICS.PARFUM]: [
    'Oud', 'Vanilla', 'Musk', 'Citrus', 'Rose', 'Amber', 'Bergamot', 
    'Sandalwood', 'Patchouli', 'Lavender', 'Jasmine', 'Cedar', 'Vetiver', 
    'Tonka Bean', 'Ylang-Ylang', 'Neroli', 'Iris', 'Leather', 'Tobacco', 'Aquatic'
  ],
  [TOPICS.GAME_ONLINE]: [
    'Valorant', 'Mobile Legends', 'PUBG', 'Free Fire', 'Genshin Impact', 
    'Dota 2', 'League of Legends', 'Overwatch', 'Apex Legends', 'Fortnite', 
    'CS:GO', 'Minecraft', 'Roblox', 'Call of Duty', 'Among Us', 'Fall Guys', 
    'Rocket League', 'FIFA', 'Clash Royale', 'Brawl Stars'
  ],
  [TOPICS.FORMULA_1]: [
    'Max Verstappen', 'Lewis Hamilton', 'Ferrari', 'Mercedes', 'Red Bull', 
    'McLaren', 'Silverstone', 'Monza', 'Monaco', 'Spa', 'DRS', 'Pit Stop', 
    'Pole Position', 'Safety Car', 'Podium', 'Championship', 'Sprint Race', 
    'Qualifying', 'Tire Strategy', 'Undercut'
  ],
  [TOPICS.UMUM]: [
    'Meja', 'Kursi', 'Laptop', 'Handphone', 'Kopi', 'Nasi', 'Mobil', 
    'Motor', 'Sepatu', 'Tas', 'Buku', 'Pensil', 'Kulkas', 'Televisi', 
    'Lampu', 'Pintu', 'Jendela', 'Kasur', 'Bantal', 'Piring'
  ]
};

export const TIMER_OPTIONS = [60, 90, 120, 180, 300]; // seconds
export const MIN_PLAYER_OPTIONS = [4, 6, 8];
export const MAX_PLAYER_OPTIONS = [6, 8, 10];
