import { User, Purchase, Redemption, LoyaltyCard, UserStampCard, Branch, AppNotification, Reward, Coupon, SystemSettings, Promotion } from '../types';

const KEYS = {
  USERS: 'users',
  PURCHASES: 'purchases',
  REDEMPTIONS: 'redemptions',
  USER_STAMPS: 'userStamps',
  BRANCHES: 'branches',
  NOTIFICATIONS: 'notifications',
  COUPONS: 'coupons',
  SESSION: 'currentUser',
  SETTINGS: 'systemSettings',
  REWARDS: 'rewardsCatalogue',
  LOYALTY_CARDS_DEF: 'loyaltyCardsDef',
  PROMOTIONS: 'promotions',
};

// --- Mock Data ---

const MOCK_USERS: User[] = [
  // Existing Core Users
  { id: 1, email: 'usuario@demo.com', password: 'demo123', name: 'Juan Pérez', role: 'user', points: 1250, tier: 'gold' },
  { id: 2, email: 'admin@demo.com', password: 'admin123', name: 'María García', role: 'admin', points: 0, tier: null, branchId: 1 },
  { id: 3, email: 'super@demo.com', password: 'super123', name: 'Carlos Rodríguez', role: 'superadmin', points: 0, tier: null },
];

const MOCK_PURCHASES: Purchase[] = [
  { id: 1, userId: 1, branchId: 1, date: '2026-02-01', amount: 150000, points: 150, description: 'Compra en tienda física', status: 'pending' },
];

const DEFAULT_SETTINGS: SystemSettings = {
  amountPerPoint: 1000, // $1000 = 1 point
  amountPerStamp: 50000, // $50000 = 1 stamp
  pointsExpirationDays: 365
};

const DEFAULT_REWARDS: Reward[] = [
  { id: 1, name: 'Descuento 10%', points: 500, description: 'Descuento del 10% en tu próxima compra', icon: '🎁' },
  { id: 2, name: 'Producto gratis', points: 1000, description: 'Producto de hasta $50.000 gratis', icon: '🎉' },
  { id: 3, name: 'Envío gratis', points: 300, description: 'Envío gratis en tu próximo pedido', icon: '🚚' },
];

const DEFAULT_LOYALTY_CARDS: LoyaltyCard[] = [
  { 
      id: 1, name: 'Café Gratis', description: 'Colecciona 10 sellos y recibe un café gratis',
      totalStamps: 10, reward: 'Café Americano Gratis', icon: '☕', category: 'Cafetería'
  },
  { 
      id: 2, name: 'Descuento VIP', description: 'Colecciona 5 sellos y recibe 20% de descuento',
      totalStamps: 5, reward: '20% de Descuento', icon: '⭐', category: 'Descuentos'
  },
];

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    title: '¡Doble Puntos!',
    description: 'Gana el doble de puntos en todas tus compras durante este fin de semana.',
    type: 'multiplier',
    value: 2,
    startDate: '2023-01-01', // Always active for demo
    endDate: '2026-12-31',
    status: 'active',
    bgColor: 'from-purple-600 to-indigo-600'
  },
  {
    id: 2,
    title: 'Bono de Bienvenida',
    description: 'Recibe 50 puntos extra en tu primera compra del mes.',
    type: 'bonus',
    value: 50,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    bgColor: 'from-pink-500 to-rose-500'
  }
];

const MOCK_BRANCHES: Branch[] = [
  { 
      id: 1, name: 'Sede Centro', address: 'Calle 10 #5-20', city: 'Bogotá',
      phone: '+57 311 123 4567', manager: 'Ana Martínez', status: 'active', createdDate: '2025-01-15'
  },
  { 
      id: 2, name: 'Sede Norte', address: 'Carrera 15 #85-30', city: 'Bogotá',
      phone: '+57 312 234 5678', manager: 'Pedro López', status: 'active', createdDate: '2025-02-01'
  },
];

export const StorageService = {
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    if (!localStorage.getItem(KEYS.PURCHASES)) localStorage.setItem(KEYS.PURCHASES, JSON.stringify(MOCK_PURCHASES));
    if (!localStorage.getItem(KEYS.BRANCHES)) localStorage.setItem(KEYS.BRANCHES, JSON.stringify(MOCK_BRANCHES));
    if (!localStorage.getItem(KEYS.REDEMPTIONS)) localStorage.setItem(KEYS.REDEMPTIONS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.USER_STAMPS)) localStorage.setItem(KEYS.USER_STAMPS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.COUPONS)) localStorage.setItem(KEYS.COUPONS, JSON.stringify([]));
    
    // Dynamic Settings Initialization
    if (!localStorage.getItem(KEYS.SETTINGS)) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    if (!localStorage.getItem(KEYS.REWARDS)) localStorage.setItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS));
    if (!localStorage.getItem(KEYS.LOYALTY_CARDS_DEF)) localStorage.setItem(KEYS.LOYALTY_CARDS_DEF, JSON.stringify(DEFAULT_LOYALTY_CARDS));
    if (!localStorage.getItem(KEYS.PROMOTIONS)) localStorage.setItem(KEYS.PROMOTIONS, JSON.stringify(DEFAULT_PROMOTIONS));
  },

  getItem: <T>(key: string): T => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  },

  setItem: <T>(key: string, data: T) => localStorage.setItem(key, JSON.stringify(data)),

  getUsers: (): User[] => StorageService.getItem(KEYS.USERS),
  setUsers: (users: User[]) => StorageService.setItem(KEYS.USERS, users),

  getPurchases: (): Purchase[] => StorageService.getItem(KEYS.PURCHASES),
  setPurchases: (data: Purchase[]) => StorageService.setItem(KEYS.PURCHASES, data),

  getRedemptions: (): Redemption[] => StorageService.getItem(KEYS.REDEMPTIONS),
  setRedemptions: (data: Redemption[]) => StorageService.setItem(KEYS.REDEMPTIONS, data),

  getUserStamps: (): UserStampCard[] => StorageService.getItem(KEYS.USER_STAMPS),
  setUserStamps: (data: UserStampCard[]) => StorageService.setItem(KEYS.USER_STAMPS, data),

  getCoupons: (): Coupon[] => StorageService.getItem(KEYS.COUPONS),
  setCoupons: (data: Coupon[]) => StorageService.setItem(KEYS.COUPONS, data),

  getBranches: (): Branch[] => StorageService.getItem(KEYS.BRANCHES),
  setBranches: (data: Branch[]) => StorageService.setItem(KEYS.BRANCHES, data),

  getNotifications: (): AppNotification[] => StorageService.getItem(KEYS.NOTIFICATIONS),
  setNotifications: (data: AppNotification[]) => StorageService.setItem(KEYS.NOTIFICATIONS, data),

  // Dynamic Settings Getters/Setters
  getSettings: (): SystemSettings => {
    const s = localStorage.getItem(KEYS.SETTINGS);
    return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  },
  setSettings: (data: SystemSettings) => StorageService.setItem(KEYS.SETTINGS, data),

  getRewards: (): Reward[] => StorageService.getItem(KEYS.REWARDS),
  setRewards: (data: Reward[]) => StorageService.setItem(KEYS.REWARDS, data),

  getLoyaltyCards: (): LoyaltyCard[] => StorageService.getItem(KEYS.LOYALTY_CARDS_DEF),
  setLoyaltyCards: (data: LoyaltyCard[]) => StorageService.setItem(KEYS.LOYALTY_CARDS_DEF, data),

  getPromotions: (): Promotion[] => StorageService.getItem(KEYS.PROMOTIONS),
  setPromotions: (data: Promotion[]) => StorageService.setItem(KEYS.PROMOTIONS, data),

  // Session
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(KEYS.SESSION);
    return user ? JSON.parse(user) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    else localStorage.removeItem(KEYS.SESSION);
  },
  
  // Helpers
  getReadNotifications: (userId: number): number[] => {
      const key = `readNotifications_${userId}`;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
  },
  setReadNotifications: (userId: number, ids: number[]) => {
      localStorage.setItem(`readNotifications_${userId}`, JSON.stringify(ids));
  }
};
export const LOYALTY_CARDS_FALLBACK = DEFAULT_LOYALTY_CARDS; 
export const MOCK_REWARDS_FALLBACK = DEFAULT_REWARDS;