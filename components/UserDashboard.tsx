import React, { useState, useEffect } from 'react';
import { User, Purchase, Redemption, Reward, LoyaltyCard, UserStampCard, AppNotification, Coupon, Branch, Promotion, SystemSettings } from '../types';
import { StorageService } from '../services/storage';
import { 
  BarChart2, Bell, Grid, Gift, History, LogOut, CheckCircle, 
  ArrowUpRight, ArrowDownLeft, ShoppingBag, CreditCard, QrCode, Sparkles, ChevronRight, Check, Ticket,
  PlusCircle, Camera, Upload, Smile, Star, Calendar, Copy, Megaphone, Tag, ChevronLeft
} from 'lucide-react';
import ChatBot from './ChatBot';

interface Props {
  user: User;
  logout: () => void;
  purchases: Purchase[];
  redemptions: Redemption[];
  rewards: Reward[];
  loyaltyCards: LoyaltyCard[];
  userStamps: UserStampCard[];
  userNotifications: AppNotification[];
  userCoupons?: Coupon[];
  branches: Branch[];
  promotions: Promotion[];
  settings: SystemSettings;
  onRedeem: (rewardId: number) => void;
  onRedeemCard: (cardId: number) => void;
  onRegisterPurchase: (data: { amount: number; description: string; branchId: number; receipt?: string }) => void;
}

const UserDashboard: React.FC<Props> = ({ 
  user, logout, purchases, redemptions, rewards, loyaltyCards, userStamps, userNotifications, userCoupons = [], branches, promotions, settings,
  onRedeem, onRedeemCard, onRegisterPurchase
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'stamps' | 'rewards' | 'history' | 'purchases' | 'promotions'>('overview');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number[]>(StorageService.getReadNotifications(user.id));
  
  // Purchases View State
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // History View State
  const [historyView, setHistoryView] = useState<'transactions' | 'coupons'>('transactions');
  
  // Notification Toast State
  const [newNotificationToast, setNewNotificationToast] = useState(false);
  const prevNotifCount = React.useRef(userNotifications.length);

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({ amount: '', description: '', branchId: '', receipt: '' });
  const [formErrors, setFormErrors] = useState<{amount?: string, description?: string, branchId?: string}>({});
  const [previewPoints, setPreviewPoints] = useState<{base: number, bonus: number, multiplier: number, total: number}>({base: 0, bonus: 0, multiplier: 1, total: 0});

  useEffect(() => {
    // Recalculate points preview when amount changes
    if (showPurchaseModal) {
      const amount = parseFloat(purchaseForm.amount) || 0;
      if (amount > 0) {
        const base = Math.floor(amount / settings.amountPerPoint);
        const now = new Date();
        
        const activePromos = promotions.filter(p => 
            p.status === 'active' && 
            new Date(p.startDate) <= now && 
            new Date(p.endDate) >= now
        );

        let multiplier = 1;
        let bonus = 0;

        activePromos.forEach(p => {
            if (p.type === 'multiplier') multiplier = Math.max(multiplier, p.value);
            if (p.type === 'bonus') bonus += p.value;
        });

        const total = Math.floor(base * multiplier) + bonus;
        setPreviewPoints({ base, bonus, multiplier, total });
      } else {
        setPreviewPoints({ base: 0, bonus: 0, multiplier: 1, total: 0 });
      }
    }
  }, [purchaseForm.amount, showPurchaseModal, settings, promotions]);

  // Effect to notify user of new notifications while looking at dashboard
  useEffect(() => {
    if (userNotifications.length > prevNotifCount.current) {
        setNewNotificationToast(true);
        setTimeout(() => setNewNotificationToast(false), 4000);
    }
    prevNotifCount.current = userNotifications.length;
  }, [userNotifications]);

  const markAsRead = (notificationId: number) => {
    if (!unreadNotifications.includes(notificationId)) {
      const updated = [...unreadNotifications, notificationId];
      setUnreadNotifications(updated);
      StorageService.setReadNotifications(user.id, updated);
    }
  };

  const unreadCount = userNotifications.filter(n => !unreadNotifications.includes(n.id)).length;

  const handleRedeem = () => {
    if (selectedReward) {
      onRedeem(selectedReward.id);
      setShowRedeemModal(false);
      setSelectedReward(null);
    }
  };

  const validatePurchaseForm = () => {
      const errors: any = {};
      if (!purchaseForm.amount) errors.amount = 'El monto es obligatorio';
      else if (parseFloat(purchaseForm.amount) <= 0) errors.amount = 'El monto debe ser mayor a 0';
      
      if (!purchaseForm.description) errors.description = 'La descripción es obligatoria';
      else if (purchaseForm.description.length < 5) errors.description = 'La descripción es muy corta';
      
      if (!purchaseForm.branchId) errors.branchId = 'Debes seleccionar una sede';
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const handleSubmitPurchase = () => {
      if (!validatePurchaseForm()) return;
      
      onRegisterPurchase({
          amount: parseFloat(purchaseForm.amount),
          description: purchaseForm.description,
          branchId: parseInt(purchaseForm.branchId),
          receipt: purchaseForm.receipt
      });
      
      setPurchaseForm({ amount: '', description: '', branchId: '', receipt: '' });
      setFormErrors({});
      setShowPurchaseModal(false);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Could add a toast here ideally
  };

  const filteredPurchases = purchases.filter(p => {
      if (purchaseFilter === 'all') return true;
      return p.status === purchaseFilter;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center transform -rotate-3 shadow-md">
                <Star size={20} className="text-white fill-current" />
             </div>
             <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">Fidelia App</span>
          </div>
          
          <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                  {user.name.charAt(0)}
               </div>
               <div>
                  <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500 font-medium">{user.email}</div>
               </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
               <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                  {user.tier || 'Estándar'}
               </span>
               <span className="text-xs text-gray-400">Nivel Actual</span>
            </div>
          </div>

          <nav className="space-y-1">
             {[
               { id: 'overview', icon: <BarChart2 size={20} />, label: 'Dashboard' },
               { id: 'purchases', icon: <ShoppingBag size={20} />, label: 'Mis Compras' },
               { id: 'promotions', icon: <Megaphone size={20} />, label: 'Promociones' },
               { id: 'stamps', icon: <Grid size={20} />, label: 'Mis Sellos' },
               { id: 'rewards', icon: <Gift size={20} />, label: 'Premios' },
               { id: 'notifications', icon: <Bell size={20} />, label: 'Mensajes', badge: unreadCount },
               { id: 'history', icon: <History size={20} />, label: 'Actividad' },
             ].map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as any)}
                 className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-medium ${
                   activeTab === item.id 
                     ? 'bg-blue-50 text-blue-700 font-bold' 
                     : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   {item.icon}
                   <span>{item.label}</span>
                 </div>
                 {item.badge ? (
                   <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                     {item.badge}
                   </span>
                 ) : null}
               </button>
             ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition font-medium"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 p-6 md:p-8 lg:p-12 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8">
           {activeTab === 'overview' ? (
             <>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
                     {user.name.charAt(0)}
                  </div>
                  <div>
                     <div className="text-xs text-gray-500">Hola,</div>
                     <div className="font-bold text-gray-900">{user.name.split(' ')[0]}</div>
                  </div>
               </div>
               <button className="relative p-2 bg-white rounded-full shadow-sm" onClick={() => setActiveTab('notifications')}>
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
               </button>
             </>
           ) : (
             <div className="flex items-center gap-4 w-full">
               <button 
                 onClick={() => setActiveTab('overview')}
                 className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition hover:bg-gray-50"
               >
                 <ChevronLeft size={24} />
               </button>
               <h2 className="text-xl font-bold text-gray-900">
                 {activeTab === 'purchases' && 'Mis Compras'}
                 {activeTab === 'promotions' && 'Promociones'}
                 {activeTab === 'stamps' && 'Mis Sellos'}
                 {activeTab === 'rewards' && 'Premios'}
                 {activeTab === 'notifications' && 'Mensajes'}
                 {activeTab === 'history' && 'Actividad'}
               </h2>
             </div>
           )}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Balance Card Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Wallet Card - BRANDED */}
                 <div className="lg:col-span-2 relative h-64 rounded-[2rem] bg-gradient-to-br from-blue-800 via-blue-700 to-yellow-500 p-8 text-white shadow-xl shadow-blue-200 overflow-hidden">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                    
                    <div className="relative h-full flex flex-col justify-between z-10">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-blue-100 font-medium mb-1">Tu Saldo Fidelia</p>
                             <h2 className="text-5xl font-bold tracking-tight">{user.points.toLocaleString()} <span className="text-2xl font-normal opacity-80">pts</span></h2>
                          </div>
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                             <Sparkles className="text-yellow-300" />
                          </div>
                       </div>
                       
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-blue-100 text-sm mb-1">Nivel de Usuario</p>
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-lg capitalize">{user.tier || 'Bronce'}</span>
                                {user.tier === 'gold' && <span className="text-yellow-300">★</span>}
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-blue-100 text-sm">ID de Miembro</p>
                             <p className="font-mono opacity-90">**** 8842</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Quick Stats / Mini Cards */}
                 <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                          <ArrowDownLeft size={28} />
                       </div>
                       <div>
                          <p className="text-gray-500 text-sm font-medium">Ganados (Mes)</p>
                          <p className="text-2xl font-bold text-gray-900">+{purchases.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).reduce((acc,p) => acc+p.points, 0)}</p>
                       </div>
                    </div>
                    <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                          <ArrowUpRight size={28} />
                       </div>
                       <div>
                          <p className="text-gray-500 text-sm font-medium">Gastados (Total)</p>
                          <p className="text-2xl font-bold text-gray-900">-{redemptions.reduce((acc,r) => acc+r.points, 0)}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Quick Actions */}
              <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
                 <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <button 
                       onClick={() => setShowPurchaseModal(true)}
                       className="flex flex-col items-center gap-3 min-w-[5.5rem] group"
                    >
                       <div className={`w-16 h-16 rounded-[1.25rem] bg-yellow-50 text-yellow-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-yellow-100`}>
                          <PlusCircle size={24} />
                       </div>
                       <span className="text-sm font-medium text-gray-600">Registrar</span>
                    </button>
                    {[
                       { icon: <Gift size={24} />, label: 'Canjear', action: () => setActiveTab('rewards'), color: 'bg-purple-50 text-purple-600' },
                       { icon: <Megaphone size={24} />, label: 'Promos', action: () => setActiveTab('promotions'), color: 'bg-pink-50 text-pink-600' },
                       { icon: <ShoppingBag size={24} />, label: 'Compras', action: () => setActiveTab('purchases'), color: 'bg-green-50 text-green-600' },
                    ].map((action, idx) => (
                       <button 
                          key={idx}
                          onClick={action.action}
                          className="flex flex-col items-center gap-3 min-w-[5.5rem] group"
                       >
                          <div className={`w-16 h-16 rounded-[1.25rem] ${action.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                             {action.icon}
                          </div>
                          <span className="text-sm font-medium text-gray-600">{action.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Recent Activity */}
              <div>
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
                    <button onClick={() => setActiveTab('history')} className="text-blue-600 font-semibold text-sm hover:underline">Ver todo</button>
                 </div>
                 
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {purchases.slice(0, 5).map((p, idx) => (
                       <div key={p.id} className={`flex items-center justify-between p-5 hover:bg-gray-50 transition ${idx !== 4 ? 'border-b border-gray-50' : ''}`}>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600">
                                <ShoppingBagIcon />
                             </div>
                             <div>
                                <p className="font-bold text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.date}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {p.status === 'approved' ? (
                                <>
                                    <p className="font-bold text-green-600">+{p.points} pts</p>
                                    <p className="text-xs text-gray-400">${p.amount.toLocaleString()}</p>
                                </>
                             ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {p.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                                </span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* NEW: PURCHASES TAB */}
        {activeTab === 'purchases' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis Compras</h1>
                    <button 
                        onClick={() => setShowPurchaseModal(true)}
                        className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition flex items-center gap-2"
                    >
                        <PlusCircle size={20} /> Registrar
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setPurchaseFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition whitespace-nowrap ${
                                purchaseFilter === filter 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {filter === 'all' ? 'Todas' : filter === 'pending' ? 'Pendientes' : filter === 'approved' ? 'Aprobadas' : 'Rechazadas'}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredPurchases.length > 0 ? (
                        filteredPurchases.map(purchase => (
                            <div key={purchase.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        purchase.status === 'approved' ? 'bg-green-50 text-green-600' :
                                        purchase.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-red-50 text-red-600'
                                    }`}>
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{purchase.description}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                purchase.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {purchase.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm flex items-center gap-2">
                                            <Calendar size={14} /> {purchase.date} 
                                            <span className="text-gray-300">|</span> 
                                            {branches.find(b => b.id === purchase.branchId)?.name || 'Sede desconocida'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left md:text-right pl-16 md:pl-0">
                                    <div className="font-bold text-gray-900 text-xl">${purchase.amount.toLocaleString()}</div>
                                    <div className={`text-sm font-bold ${
                                        purchase.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                        {purchase.status === 'approved' ? `+${purchase.points} puntos ganados` : `${purchase.points} puntos estimados`}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 font-medium">No se encontraron compras en esta categoría.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* NEW: PROMOTIONS TAB */}
        {activeTab === 'promotions' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Promociones Activas</h1>
                <p className="text-gray-500 mb-8">Aprovecha estos beneficios para ganar más puntos.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promotions.filter(p => p.status === 'active').map(promo => (
                        <div key={promo.id} className={`rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl bg-gradient-to-br ${promo.bgColor || 'from-blue-600 to-indigo-700'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            
                            <div className="relative z-10">
                                <div className="bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                                    {promo.type === 'multiplier' ? `${promo.value}x Puntos` : `+${promo.value} Bono`}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{promo.title}</h3>
                                <p className="text-white/80 leading-relaxed mb-6 min-h-[3rem]">{promo.description}</p>
                                
                                <div className="flex items-center gap-2 text-sm font-medium bg-black/20 w-fit px-3 py-1.5 rounded-lg">
                                    <Calendar size={14} />
                                    <span>Válido hasta: {promo.endDate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {promotions.filter(p => p.status === 'active').length === 0 && (
                        <div className="col-span-full p-12 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                            <Megaphone className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">No hay promociones activas en este momento.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* REWARDS TAB */}
        {activeTab === 'rewards' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* My Coupons Section */}
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Mis Cupones Activos</h1>
                {userCoupons.filter(c => c.status === 'active').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {userCoupons.filter(c => c.status === 'active').map(coupon => (
                            <div key={coupon.id} className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-200">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Ticket size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-xs font-bold bg-yellow-400 text-blue-900 w-fit px-2 py-1 rounded-lg mb-2 uppercase tracking-wider">Cupón Activo</div>
                                    <h3 className="font-bold text-xl mb-1">{coupon.name}</h3>
                                    <p className="text-white/80 text-sm mb-4">{coupon.description}</p>
                                    <div className="bg-white text-blue-900 font-mono text-center py-2 rounded-xl font-bold text-lg tracking-widest border-2 border-dashed border-blue-300">
                                        {coupon.code}
                                    </div>
                                    <p className="text-xs text-center mt-2 text-white/70">Muestra este código en caja</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-gray-50 rounded-3xl text-center border border-dashed border-gray-300">
                        <Ticket className="mx-auto text-gray-300 mb-2" size={48} />
                        <p className="text-gray-500">No tienes cupones activos.</p>
                        <p className="text-xs text-gray-400">Completa 10 sellos en tus tarjetas para ganar uno.</p>
                    </div>
                )}
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Catálogo de Premios</h2>
                <p className="text-gray-500">Canjea tus puntos por recompensas exclusivas</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rewards.map(reward => (
                  <div key={reward.id} className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                     <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4 flex items-center justify-center text-6xl group-hover:scale-[1.02] transition-transform relative overflow-hidden">
                        {/* Simulate image */}
                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                        {reward.icon}
                     </div>
                     <div className="px-4 pb-4">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-lg text-gray-900">{reward.name}</h3>
                           <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">{reward.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{reward.description}</p>
                        <button
                          onClick={() => { setSelectedReward(reward); setShowRedeemModal(true); }}
                          disabled={user.points < reward.points}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                            user.points >= reward.points 
                              ? 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-200' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {user.points >= reward.points ? 'Canjear Ahora' : 'Faltan Puntos'}
                        </button>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* STAMPS TAB */}
        {activeTab === 'stamps' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tarjetas de Sellos</h1>
                <p className="text-gray-500">Completa y gana premios instantáneos</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {loyaltyCards.map(card => {
                    const userCard = userStamps.find(s => s.cardId === card.id && !s.completed) || 
                                     userStamps.find(s => s.cardId === card.id) || 
                                     { stamps: 0, completed: false };
                    const currentStamps = userCard.stamps;
                    const isCompleted = userCard.completed;

                    return (
                       <div key={card.id} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                          {isCompleted && (
                             <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl font-bold text-sm">
                                COMPLETADA
                             </div>
                          )}
                          
                          <div className="flex items-center gap-4 mb-6">
                             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                                {card.icon}
                             </div>
                             <div>
                                <h3 className="font-bold text-xl text-gray-900">{card.name}</h3>
                                <div className="text-sm text-gray-500 font-medium">{card.category}</div>
                             </div>
                          </div>
                          
                          <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-6 border border-gray-100">
                             <div className="flex flex-wrap gap-2 justify-center mb-3">
                                {[...Array(card.totalStamps)].map((_, i) => (
                                   <div key={i} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                      i < currentStamps 
                                         ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                         : 'bg-white border-dashed border-gray-300 text-gray-200'
                                   }`}>
                                      {i < currentStamps && <Check size={20} strokeWidth={3} />}
                                   </div>
                                ))}
                             </div>
                             <p className="text-center text-sm font-bold text-blue-600">
                                {currentStamps} de {card.totalStamps} Sellos
                             </p>
                          </div>

                          <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6">
                             <div className="text-sm">
                                <span className="block font-bold text-yellow-800">Recompensa</span>
                                <span className="text-yellow-700">{card.reward}</span>
                             </div>
                             <div className="text-2xl">🎁</div>
                          </div>

                          <div className="text-center text-xs text-gray-400">
                             Pide al administrador que escanee tu código para recibir sellos.
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
              <div className="mb-8">
                 <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
              </div>
              <div className="space-y-4">
                 {userNotifications.length > 0 ? (
                    userNotifications.map(notif => {
                       const isUnread = !unreadNotifications.includes(notif.id);
                       return (
                          <div 
                             key={notif.id} 
                             onClick={() => markAsRead(notif.id)}
                             className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                                isUnread 
                                   ? 'bg-white border-blue-100 shadow-md shadow-blue-50 relative' 
                                   : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
                             }`}
                          >
                             {isUnread && <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full"></div>}
                             <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                   <Bell size={24} />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-gray-900 text-lg">{notif.sentBy}</span>
                                      <span className="text-xs text-gray-400">• {notif.time}</span>
                                   </div>
                                   <p className="text-gray-600 leading-relaxed">{notif.message}</p>
                                </div>
                             </div>
                          </div>
                       );
                    })
                 ) : (
                    <div className="text-center py-20 text-gray-400">Sin mensajes recientes</div>
                 )}
              </div>
           </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-900">Historial</h1>
                 <button 
                     onClick={() => setShowPurchaseModal(true)}
                     className="bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition flex items-center gap-2"
                 >
                     <PlusCircle size={18} /> Registrar Compra
                 </button>
              </div>

              {/* History View Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-6">
                  <button 
                    onClick={() => setHistoryView('transactions')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${historyView === 'transactions' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Transacciones de Puntos
                  </button>
                  <button 
                    onClick={() => setHistoryView('coupons')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${historyView === 'coupons' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Historial de Cupones
                  </button>
              </div>
              
              {historyView === 'transactions' ? (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-800">Movimientos de Puntos</h2>
                     </div>
                     <div className="overflow-x-auto">
                        <div className="min-w-full">
                            {[...purchases, ...redemptions]
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((item: any) => {
                                const isPurchase = 'amount' in item;
                                return (
                                    <div key={item.id + (isPurchase?'p':'r')} className="flex items-center justify-between p-6 border-b border-gray-50 hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            !isPurchase ? 'bg-orange-50 text-orange-600' :
                                            item.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                            item.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                            'bg-green-50 text-green-600'
                                        }`}>
                                            {isPurchase ? <ArrowDownLeft /> : <ArrowUpRight />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{isPurchase ? item.description : `Canje: ${item.rewardName}`}</p>
                                            <p className="text-xs text-gray-500">{item.date}</p>
                                            {isPurchase && item.status !== 'approved' && (
                                                <div className="mt-1">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        </div>
                                        <div className="text-right pl-4">
                                        <p className={`font-bold text-lg whitespace-nowrap ${
                                            !isPurchase ? 'text-gray-900' :
                                            item.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            {isPurchase ? '+' : '-'}{item.points} pts
                                        </p>
                                        {isPurchase && <p className="text-xs text-gray-400">${item.amount.toLocaleString()}</p>}
                                        </div>
                                    </div>
                                );
                            })
                            }
                        </div>
                     </div>
                  </div>
              ) : (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-800">Mis Recompensas Generadas</h2>
                     </div>
                     <div>
                        {userCoupons.length > 0 ? (
                           userCoupons
                           .sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())
                           .map((coupon) => (
                              <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-50 hover:bg-gray-50 transition gap-4">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        coupon.status === 'active' ? 'bg-green-50 text-green-600' :
                                        coupon.status === 'used' ? 'bg-gray-100 text-gray-400' :
                                        'bg-red-50 text-red-400'
                                    }`}>
                                       <Ticket />
                                    </div>
                                    <div>
                                       <p className={`font-bold text-lg ${coupon.status === 'used' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{coupon.name}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                                coupon.status === 'active' ? 'bg-green-100 text-green-700' :
                                                coupon.status === 'used' ? 'bg-gray-100 text-gray-500' :
                                                'bg-red-100 text-red-500'
                                            }`}>
                                                {coupon.status === 'active' ? 'Activo' : coupon.status === 'used' ? 'Usado' : 'Expirado'}
                                           </span>
                                           <span className="text-xs text-gray-400">{new Date(coupon.generatedDate).toLocaleDateString()}</span>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center justify-between sm:justify-end gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 sm:w-auto w-full">
                                    <code className="font-mono font-bold text-gray-700 px-2">{coupon.code}</code>
                                    <button 
                                        onClick={() => copyToClipboard(coupon.code)}
                                        className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition" 
                                        title="Copiar Código"
                                    >
                                        <Copy size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="p-12 text-center text-gray-400">
                               <Ticket className="mx-auto mb-3 opacity-20" size={48} />
                               <p>No tienes historial de cupones.</p>
                           </div>
                        )}
                     </div>
                  </div>
              )}
           </div>
        )}

      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 p-2 flex justify-around z-30 pb-safe">
         {[
           { id: 'overview', icon: <BarChart2 size={24} />, label: 'Inicio' },
           { id: 'purchases', icon: <ShoppingBag size={24} />, label: 'Compras' },
           { id: 'rewards', icon: <Gift size={24} />, label: 'Premios' },
           { id: 'stamps', icon: <Grid size={24} />, label: 'Sellos' },
         ].map(item => (
           <button
             key={item.id}
             onClick={() => setActiveTab(item.id as any)}
             className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === item.id ? 'text-blue-700' : 'text-gray-400'}`}
           >
              {item.icon}
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
           </button>
         ))}
      </div>

      {/* REDEEM MODAL */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowRedeemModal(false)}>
           <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="h-32 bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-6xl">
                 {selectedReward.icon}
              </div>
              <div className="p-8">
                 <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{selectedReward.name}</h2>
                 <p className="text-center text-gray-500 mb-8">{selectedReward.description}</p>
                 
                 <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-gray-500">Saldo Actual</span>
                       <span className="font-bold text-gray-900">{user.points} pts</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-blue-700 font-medium">
                       <span>Costo</span>
                       <span>-{selectedReward.points} pts</span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                       <span>Saldo Final</span>
                       <span>{user.points - selectedReward.points} pts</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-3">
                    <button onClick={() => setShowRedeemModal(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
                    <button onClick={handleRedeem} className="flex-1 py-3.5 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-200 transition">Confirmar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* REGISTER PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowPurchaseModal(false)}>
           <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-gray-100 flex-shrink-0">
                 <h2 className="text-2xl font-bold text-gray-900">Registrar Nueva Compra</h2>
                 <p className="text-gray-500 mt-1">Ingresa los datos para solicitar tus puntos</p>
              </div>
              <div className="p-8 space-y-5 overflow-y-auto">
                 <div className="form-group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Monto de la Compra *</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span>
                        <input 
                            type="number"
                            value={purchaseForm.amount}
                            onChange={(e) => setPurchaseForm({...purchaseForm, amount: e.target.value})}
                            placeholder="Ej: 50000"
                            className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all ${formErrors.amount ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}
                        />
                    </div>
                    {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                    
                    {/* Points Calculation Preview */}
                    <div className="mt-3 bg-blue-50 p-3 rounded-xl border border-blue-100 flex justify-between items-center text-sm">
                        <span className="text-blue-700 font-medium">Puntos Estimados:</span>
                        <div className="text-right">
                            <span className="font-bold text-blue-900 text-lg">+{previewPoints.total}</span>
                            {previewPoints.multiplier > 1 && <span className="text-xs bg-yellow-300 text-blue-900 px-1.5 py-0.5 rounded ml-2 font-bold">{previewPoints.multiplier}x</span>}
                            {previewPoints.bonus > 0 && <span className="text-xs bg-pink-300 text-pink-900 px-1.5 py-0.5 rounded ml-1 font-bold">+{previewPoints.bonus}</span>}
                        </div>
                    </div>
                 </div>

                 <div className="form-group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción *</label>
                    <input 
                        type="text"
                        value={purchaseForm.description}
                        onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})}
                        placeholder="Ej: Compra de zapatillas..."
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all ${formErrors.description ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}
                    />
                    {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                 </div>

                 <div className="form-group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Sede *</label>
                    <select 
                        value={purchaseForm.branchId}
                        onChange={(e) => setPurchaseForm({...purchaseForm, branchId: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all ${formErrors.branchId ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}
                    >
                        <option value="">Selecciona una sede</option>
                        {branches.filter(b => b.status === 'active').map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                    {formErrors.branchId && <p className="text-red-500 text-xs mt-1">{formErrors.branchId}</p>}
                 </div>

                 <div className="form-group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Comprobante (Opcional)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={purchaseForm.receipt}
                            onChange={(e) => setPurchaseForm({...purchaseForm, receipt: e.target.value})}
                            placeholder="Número de factura o referencia"
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                        />
                        <button className="px-4 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition">
                            <Camera size={20} />
                        </button>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                        onClick={() => setShowPurchaseModal(false)}
                        className="flex-1 py-3.5 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmitPurchase}
                        className="flex-1 py-3.5 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-200 transition"
                    >
                        Registrar Compra
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* NEW NOTIFICATION TOAST */}
      {newNotificationToast && (
          <div className="fixed top-24 right-6 z-50 bg-blue-900 text-white px-6 py-4 rounded-2xl shadow-xl animate-in slide-in-from-right flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><Bell size={20} /></div>
              <div>
                  <div className="font-bold">¡Nuevo Mensaje!</div>
                  <div className="text-xs text-blue-200">Revisa tu bandeja de entrada</div>
              </div>
          </div>
      )}
      
      {/* AI ChatBot Integration */}
      <ChatBot user={user} />
      
    </div>
  );
};

// Helper component for icon
const ShoppingBagIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

export default UserDashboard;