import React, { useState } from 'react';
import { User, Purchase, Redemption, Branch, AppNotification, SystemSettings, Reward, LoyaltyCard, Promotion } from '../types';
import { 
  LayoutDashboard, Users, Building, Shield, Bell, LogOut, 
  TrendingUp, Download, Plus, Power, Settings, Gift, Trash2, 
  CreditCard, DollarSign, Activity, PieChart, Award, BarChart3, ArrowUp, ArrowDown,
  AlertCircle, Tag, Megaphone, Calendar, Edit2
} from 'lucide-react';

interface Props {
  user: User;
  logout: () => void;
  users: User[];
  purchases: Purchase[];
  redemptions: Redemption[];
  branches: Branch[];
  notifications: AppNotification[];
  settings: SystemSettings;
  rewards: Reward[];
  loyaltyCards: LoyaltyCard[];
  promotions?: Promotion[];
  onAddBranch: (data: Partial<Branch>) => void;
  onUpdateBranch: (id: number, status: 'active' | 'inactive') => void;
  onAddAdmin: (data: Partial<User>) => void;
  onExportData: () => void;
  onSendNotification: (msg: string) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onAddReward: (reward: Reward) => void;
  onDeleteReward: (id: number) => void;
  onAddLoyaltyCard: (card: LoyaltyCard) => void;
  onDeleteLoyaltyCard: (id: number) => void;
  onAddPromotion?: (promo: Promotion) => void;
  onUpdatePromotion?: (id: number, data: Partial<Promotion>) => void;
  onDeletePromotion?: (id: number) => void;
}

const SuperAdminDashboard: React.FC<Props> = ({ 
  user, logout, users, purchases, redemptions, branches, notifications, 
  settings, rewards, loyaltyCards, promotions = [],
  onAddBranch, onUpdateBranch, onAddAdmin, onExportData, onSendNotification,
  onUpdateSettings, onAddReward, onDeleteReward, onAddLoyaltyCard, onDeleteLoyaltyCard,
  onAddPromotion, onUpdatePromotion, onDeletePromotion
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'branches' | 'admins' | 'notifications' | 'settings' | 'catalogue' | 'promotions'>('dashboard');
  
  // Modal States
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'reward' | 'card' | 'promotion', id: number } | null>(null);
  
  // Editing States
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  
  // Forms
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [newBranch, setNewBranch] = useState({ name: '', address: '', city: '', phone: '', manager: '' });
  const [notifMsg, setNotifMsg] = useState('');
  
  // Settings Form
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(settings);
  
  // Reward Form
  const [rewardForm, setRewardForm] = useState<Partial<Reward>>({ name: '', points: 0, description: '', icon: '🎁' });
  
  // Card Form
  const [cardForm, setCardForm] = useState<Partial<LoyaltyCard>>({ name: '', totalStamps: 10, reward: '', description: '', icon: '☕', category: 'General' });

  // Promotion Form
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
      title: '', description: '', type: 'multiplier', value: 2, 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], 
      status: 'active'
  });

  // --- ANALYTICS CALCULATIONS ---
  const customers = users.filter(u => u.role === 'user');
  const admins = users.filter(u => u.role === 'admin');
  
  // Financials
  const totalRevenue = purchases.reduce((acc, p) => acc + p.amount, 0);
  const totalTransactions = purchases.length;
  const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  // Points Economics
  const totalPointsIssued = purchases.reduce((acc, p) => acc + p.points, 0);
  const totalPointsRedeemed = redemptions.reduce((acc, r) => acc + r.points, 0);
  const activePoints = customers.reduce((acc, u) => acc + u.points, 0);
  const redemptionRate = totalPointsIssued > 0 ? (totalPointsRedeemed / totalPointsIssued) * 100 : 0;

  // ROI Estimation (Simple Model)
  const ESTIMATED_COST_PER_POINT = 10; 
  const estimatedLoyaltyCost = totalPointsRedeemed * ESTIMATED_COST_PER_POINT;
  const roi = estimatedLoyaltyCost > 0 ? ((totalRevenue - estimatedLoyaltyCost) / estimatedLoyaltyCost) * 100 : 0;

  // Reward Statistics
  const redemptionCounts: Record<number, number> = {};
  redemptions.forEach(r => {
      redemptionCounts[r.rewardId] = (redemptionCounts[r.rewardId] || 0) + 1;
  });

  const rewardStats = rewards.map(r => ({
      ...r,
      count: redemptionCounts[r.id] || 0,
      percentage: redemptions.length > 0 ? ((redemptionCounts[r.id] || 0) / redemptions.length) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  const topReward = rewardStats[0];
  const bottomReward = rewardStats.length > 0 ? rewardStats[rewardStats.length - 1] : null;

  // --- HANDLERS ---
  const handleCreateBranch = () => {
    onAddBranch(newBranch);
    setNewBranch({ name: '', address: '', city: '', phone: '', manager: '' });
    setShowAddBranch(false);
  };

  const handleCreateAdmin = () => {
    onAddAdmin(newAdmin);
    setNewAdmin({ name: '', email: '', password: '' });
    setShowAddAdmin(false);
  };

  const handleSaveSettings = () => {
      onUpdateSettings(settingsForm);
  };

  const handleCreateReward = () => {
      if(rewardForm.name && rewardForm.points) {
          onAddReward({ ...rewardForm, id: Date.now() } as Reward);
          setShowAddReward(false);
          setRewardForm({ name: '', points: 0, description: '', icon: '🎁' });
      }
  };

  const handleCreateCard = () => {
      if(cardForm.name && cardForm.totalStamps && cardForm.reward) {
          onAddLoyaltyCard({ ...cardForm, id: Date.now() } as LoyaltyCard);
          setShowAddCard(false);
          setCardForm({ name: '', totalStamps: 10, reward: '', description: '', icon: '☕', category: 'General' });
      }
  };
  
  const handleEditPromo = (promo: Promotion) => {
      setPromoForm(promo);
      setEditingPromoId(promo.id);
      setShowAddPromo(true);
  };

  const handleSavePromo = () => {
      if (!promoForm.title || !promoForm.value) return;

      if (editingPromoId && onUpdatePromotion) {
          // Update
          onUpdatePromotion(editingPromoId, promoForm);
      } else if (onAddPromotion) {
          // Create
          onAddPromotion({ ...promoForm, id: Date.now() } as Promotion);
      }
      
      // Reset
      setShowAddPromo(false);
      setPromoForm({
          title: '', description: '', type: 'multiplier', value: 2, 
          startDate: new Date().toISOString().split('T')[0], 
          endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], 
          status: 'active'
      });
      setEditingPromoId(null);
  };

  const handleDeleteRequest = (type: 'reward' | 'card' | 'promotion', id: number) => {
    setDeleteConfirm({ type, id });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'reward') onDeleteReward(deleteConfirm.id);
    else if (deleteConfirm.type === 'card') onDeleteLoyaltyCard(deleteConfirm.id);
    else if (deleteConfirm.type === 'promotion' && onDeletePromotion) onDeletePromotion(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('café') || cat.includes('cafe') || cat.includes('bebida')) 
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700' };
    if (cat.includes('descuento') || cat.includes('vip') || cat.includes('oferta')) 
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700' };
    if (cat.includes('regalo') || cat.includes('gratis')) 
        return { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', badge: 'bg-pink-100 text-pink-700' };
    return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' };
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F1F5F9] font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-[#0F172A] text-slate-300 z-10 md:fixed md:h-full flex flex-col shadow-2xl">
         <div className="p-6 md:p-8 bg-[#020617] flex justify-between items-center md:block">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Super Admin</h2>
                <div className="text-xs text-yellow-500 mt-1 uppercase tracking-wider font-bold">Fidelia App</div>
            </div>
            {/* Mobile Toggle Placeholder - In real app use state to toggle nav */}
         </div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[
              { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
              { id: 'customers', icon: <Users size={20} />, label: 'Clientes' },
              { id: 'branches', icon: <Building size={20} />, label: 'Sedes' },
              { id: 'admins', icon: <Shield size={20} />, label: 'Admins' },
              { id: 'catalogue', icon: <Gift size={20} />, label: 'Fidelización' },
              { id: 'promotions', icon: <Megaphone size={20} />, label: 'Promociones' },
              { id: 'settings', icon: <Settings size={20} />, label: 'Configuración' },
              { id: 'notifications', icon: <Bell size={20} />, label: 'Notificaciones' },
            ].map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as any)}
                 className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold transition-all ${
                   activeTab === item.id 
                     ? 'bg-blue-700 text-white shadow-lg shadow-blue-900/50' 
                     : 'hover:bg-slate-800 hover:text-white'
                 }`}
               >
                  {item.icon} {item.label}
               </button>
            ))}
         </nav>
         <div className="p-6 bg-[#020617]">
            <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition font-bold">
               <LogOut size={18} /> Cerrar Sesión
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 p-6 md:p-8 lg:p-12">
         
         {/* DASHBOARD TAB */}
         {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Resumen Ejecutivo</h1>
                    <p className="text-gray-500 mt-2">Métricas clave de rendimiento y fidelización</p>
                  </div>
                  <div className="text-right hidden md:block">
                      <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                        Última act: {new Date().toLocaleTimeString()}
                      </span>
                  </div>
               </div>
               
               {/* KPI Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                     </div>
                     <div className="text-gray-500 text-sm font-medium">Ingresos Totales</div>
                     <div className="text-3xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</div>
                     <div className="text-xs text-gray-400 mt-2">{totalTransactions} transacciones registradas</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            Promedio
                        </span>
                     </div>
                     <div className="text-gray-500 text-sm font-medium">Ticket Promedio</div>
                     <div className="text-3xl font-bold text-gray-900 mt-1">${Math.floor(avgTicket).toLocaleString()}</div>
                     <div className="text-xs text-gray-400 mt-2">Valor medio por compra</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                            <PieChart size={24} />
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            ROI Est.
                        </span>
                     </div>
                     <div className="text-gray-500 text-sm font-medium">Retorno de Inversión</div>
                     <div className="text-3xl font-bold text-gray-900 mt-1">{roi.toFixed(1)}%</div>
                     <div className="text-xs text-gray-400 mt-2">Basado en costo est. de puntos</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                            Activos
                        </span>
                     </div>
                     <div className="text-sm text-gray-500 font-medium">Clientes Totales</div>
                     <div className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</div>
                     <div className="text-xs text-gray-400 mt-2">{activePoints.toLocaleString()} puntos circulantes</div>
                  </div>
               </div>

               {/* Advanced Stats Section */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   
                   {/* Reward Performance Chart */}
                   <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="text-blue-600" /> Rendimiento de Recompensas
                                </h3>
                                <p className="text-sm text-gray-500">Top 5 premios más canjeados por los usuarios</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {rewardStats.slice(0, 5).map((reward, idx) => (
                                <div key={reward.id}>
                                    <div className="flex justify-between items-center mb-2 text-sm">
                                        <span className="font-bold text-gray-700 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">#{idx + 1}</span>
                                            {reward.name}
                                        </span>
                                        <span className="font-bold text-blue-600">{reward.count} canjes</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${idx === 0 ? 'bg-blue-600' : 'bg-blue-400'}`} 
                                            style={{ width: `${reward.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {rewardStats.length === 0 && (
                                <div className="text-center py-10 text-gray-400 italic">No hay datos de canjes aún.</div>
                            )}
                        </div>
                   </div>

                   {/* Insights Card */}
                   <div className="space-y-6">
                        {/* Top Performer */}
                        <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <h3 className="text-blue-200 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Award size={16} /> Estrella del Mes
                            </h3>
                            {topReward ? (
                                <>
                                    <div className="text-4xl mb-2">{topReward.icon}</div>
                                    <div className="text-2xl font-bold mb-1">{topReward.name}</div>
                                    <div className="text-blue-200 text-sm mb-4">El premio favorito de tus clientes</div>
                                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 inline-block">
                                        <span className="font-bold text-2xl">{topReward.count}</span> <span className="text-xs opacity-80">canjes totales</span>
                                    </div>
                                </>
                            ) : (
                                <p className="opacity-70">Sin datos suficientes</p>
                            )}
                        </div>

                        {/* Low Performer */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                            <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ArrowDown size={16} /> Menos Movimiento
                            </h3>
                            {bottomReward && bottomReward.count < (topReward?.count || 0) / 4 ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl grayscale opacity-50">{bottomReward.icon}</div>
                                        <div>
                                            <div className="text-lg font-bold text-gray-700">{bottomReward.name}</div>
                                            <div className="text-xs text-red-500 font-bold">Baja rotación</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">Considera reducir el costo en puntos o cambiar este premio.</p>
                                </>
                            ) : (
                                <p className="text-gray-400 text-sm">Todos los premios tienen buen rendimiento.</p>
                            )}
                        </div>
                   </div>
               </div>
            </div>
         )}

         {/* SETTINGS TAB */}
         {activeTab === 'settings' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Configuración del Sistema</h1>
                 
                 <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 max-w-2xl">
                     <h2 className="text-xl font-bold text-gray-800 mb-6">Reglas de Economía</h2>
                     <div className="space-y-6">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Valor de Compra para 1 Punto</label>
                             <div className="flex items-center gap-3">
                                 <span className="text-gray-400 font-bold">$</span>
                                 <input 
                                    type="number" 
                                    value={settingsForm.amountPerPoint}
                                    onChange={(e) => setSettingsForm({...settingsForm, amountPerPoint: parseInt(e.target.value)})}
                                    className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-900"
                                 />
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                 Ejemplo: Si pones 1000, una compra de $10.000 generará 10 puntos.
                             </p>
                         </div>

                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Valor de Compra para 1 Sello (Sugerido)</label>
                             <div className="flex items-center gap-3">
                                 <span className="text-gray-400 font-bold">$</span>
                                 <input 
                                    type="number" 
                                    value={settingsForm.amountPerStamp}
                                    onChange={(e) => setSettingsForm({...settingsForm, amountPerStamp: parseInt(e.target.value)})}
                                    className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-900"
                                 />
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                 Este valor se usa para sugerir al administrador cuántos sellos asignar en una compra.
                             </p>
                         </div>
                         
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Vencimiento de Puntos (Días)</label>
                             <input 
                                type="number" 
                                value={settingsForm.pointsExpirationDays}
                                onChange={(e) => setSettingsForm({...settingsForm, pointsExpirationDays: parseInt(e.target.value)})}
                                className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-900"
                             />
                         </div>

                         <div className="pt-6 border-t border-gray-100">
                             <button 
                                onClick={handleSaveSettings}
                                className="bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-200"
                             >
                                Guardar Cambios
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         )}
         
         {/* PROMOTIONS TAB (NEW) */}
         {activeTab === 'promotions' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Gestión de Promociones</h1>
                        <p className="text-gray-500 mt-2">Crea incentivos para aumentar la retención</p>
                    </div>
                    <button 
                        onClick={() => {
                            setPromoForm({
                                title: '', description: '', type: 'multiplier', value: 2, 
                                startDate: new Date().toISOString().split('T')[0], 
                                endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], 
                                status: 'active'
                            });
                            setEditingPromoId(null);
                            setShowAddPromo(true);
                        }} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 font-bold shadow-lg shadow-blue-200 transition"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Nueva Promo</span>
                    </button>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th className="p-6">Promoción</th>
                                    <th className="p-6">Tipo</th>
                                    <th className="p-6">Valor</th>
                                    <th className="p-6 min-w-[200px]">Vigencia</th>
                                    <th className="p-6">Estado</th>
                                    <th className="p-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {promotions.map(promo => (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition">
                                        <td className="p-6">
                                            <div className="font-bold text-gray-900">{promo.title}</div>
                                            <div className="text-xs text-gray-500">{promo.description}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                promo.type === 'multiplier' ? 'bg-purple-100 text-purple-700' :
                                                promo.type === 'bonus' ? 'bg-pink-100 text-pink-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {promo.type === 'multiplier' ? 'Multiplicador' : promo.type === 'bonus' ? 'Bono Puntos' : 'Descuento'}
                                            </span>
                                        </td>
                                        <td className="p-6 font-bold text-gray-700">
                                            {promo.type === 'multiplier' ? `${promo.value}x` : `+${promo.value}`}
                                        </td>
                                        <td className="p-6 text-sm text-gray-500 whitespace-nowrap">
                                            {promo.startDate} <span className="text-gray-300">→</span> {promo.endDate}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                promo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {promo.status === 'active' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => onUpdatePromotion && onUpdatePromotion(promo.id, { status: promo.status === 'active' ? 'inactive' : 'active' })}
                                                    className={`p-2 rounded-lg transition ${promo.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    title={promo.status === 'active' ? 'Desactivar' : 'Activar'}
                                                >
                                                    <Power size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditPromo(promo)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRequest('promotion', promo.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {promotions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 italic">No hay promociones creadas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
         )}

         {/* CATALOGUE TAB */}
         {activeTab === 'catalogue' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 
                 {/* Rewards Section */}
                 <div>
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Catálogo de Premios</h2>
                            <p className="text-gray-500">Artículos que los usuarios canjean por puntos</p>
                        </div>
                        <button onClick={() => setShowAddReward(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 font-bold text-sm shadow-md transition">
                            <Plus size={18} /> <span className="hidden md:inline">Nuevo Premio</span>
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards.map(reward => (
                            <div key={reward.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative group">
                                <button 
                                    onClick={() => handleDeleteRequest('reward', reward.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition md:opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="text-4xl mb-4">{reward.icon}</div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{reward.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 flex-1">{reward.description}</p>
                                <div className="bg-blue-50 text-blue-700 font-bold py-2 px-4 rounded-lg text-center text-sm">
                                    {reward.points} Puntos
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>

                 <hr className="border-gray-200" />

                 {/* Loyalty Cards Section */}
                 <div>
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tarjetas de Sellos</h2>
                            <p className="text-gray-500">Definiciones de tarjetas para acumular sellos</p>
                        </div>
                        <button onClick={() => setShowAddCard(true)} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-blue-900 rounded-xl hover:bg-yellow-500 font-bold text-sm shadow-md transition">
                            <Plus size={18} /> <span className="hidden md:inline">Nueva Tarjeta</span>
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loyaltyCards.map(card => {
                            const styles = getCategoryStyles(card.category);
                            return (
                                <div key={card.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative group transition-all hover:shadow-md">
                                    {/* Header with Icon and Name */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 ${styles.bg} ${styles.text} rounded-2xl flex items-center justify-center text-3xl shadow-sm`}>
                                                {card.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{card.name}</h3>
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${styles.badge}`}>{card.category}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteRequest('card', card.id)}
                                            className="text-gray-300 hover:text-red-500 transition md:opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{card.description}</p>

                                    {/* Visual Progress Preview */}
                                    <div className={`bg-white rounded-xl p-4 border ${styles.border} mb-4 relative overflow-hidden`}>
                                        <div className={`absolute top-0 left-0 w-1 h-full ${styles.bg}`}></div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Previsualización de Meta</div>
                                        <div className="flex flex-wrap gap-2">
                                            {[...Array(Math.min(card.totalStamps, 10))].map((_, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-dashed ${i === 0 ? styles.border + ' bg-gray-50' : 'border-gray-200'} flex items-center justify-center`}>
                                                    {i === 0 && <div className={`w-3 h-3 rounded-full ${styles.bg}`}></div>}
                                                </div>
                                            ))}
                                            {card.totalStamps > 10 && <span className="text-xs text-gray-400 self-center">+{card.totalStamps - 10}</span>}
                                        </div>
                                        <div className="mt-4 flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                                            <span className="font-medium text-gray-500">Meta Total</span>
                                            <span className={`font-bold ${styles.text}`}>{card.totalStamps} Sellos</span>
                                        </div>
                                    </div>

                                    {/* Reward Info */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-100 text-sm font-bold mt-auto">
                                        <Gift size={18} className="text-gray-400" />
                                        <span>Premio: <span className="text-gray-900">{card.reward}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
             </div>
         )}

         {/* EXISTING TABS */}
         {activeTab === 'branches' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Sedes</h1>
                  <button onClick={() => setShowAddBranch(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 font-bold shadow-lg shadow-blue-200 transition">
                     <Plus size={20} /> <span className="hidden md:inline">Nueva Sede</span>
                  </button>
               </div>
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                            <tr><th className="p-6">Sede</th><th className="p-6">Dirección</th><th className="p-6">Estado</th><th className="p-6">Acción</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {branches.map(b => (
                            <tr key={b.id}>
                                <td className="p-6 font-medium">{b.name}</td><td className="p-6 text-gray-500">{b.address}</td>
                                <td className="p-6"><span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${b.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{b.status}</span></td>
                                <td className="p-6"><button onClick={() => onUpdateBranch(b.id, b.status === 'active' ? 'inactive' : 'active')}><Power size={18} /></button></td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
               </div>
            </div>
         )}
         
          {activeTab === 'customers' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Clientes</h1>
                  <button onClick={onExportData} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-sm shadow-sm transition">
                     <Download size={18} /> <span className="hidden md:inline">Exportar CSV</span>
                  </button>
               </div>
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                            <tr>
                            <th className="p-6 font-semibold">Nombre</th>
                            <th className="p-6 font-semibold">Email</th>
                            <th className="p-6 font-semibold">Puntos</th>
                            <th className="p-6 font-semibold">Nivel</th>
                            <th className="p-6 font-semibold">Compras</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition">
                                <td className="p-6 font-medium text-gray-900">{c.name}</td>
                                <td className="p-6 text-gray-500">{c.email}</td>
                                <td className="p-6 font-bold text-blue-700">{c.points}</td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                                        c.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' : 
                                        c.tier === 'silver' ? 'bg-slate-100 text-slate-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                        {c.tier || 'N/A'}
                                    </span>
                                </td>
                                <td className="p-6 text-gray-500 font-medium">{purchases.filter(p => p.userId === c.id).length}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
               </div>
            </div>
         )}
          
          {activeTab === 'admins' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Administradores</h1>
                  <button onClick={() => setShowAddAdmin(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 font-bold shadow-lg shadow-blue-200 transition">
                     <Plus size={20} /> <span className="hidden md:inline">Crear Admin</span>
                  </button>
               </div>
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                            <tr>
                            <th className="p-6 font-semibold">Nombre</th>
                            <th className="p-6 font-semibold">Email</th>
                            <th className="p-6 font-semibold">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {admins.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50 transition">
                                <td className="p-6 font-medium text-gray-900">{a.name}</td>
                                <td className="p-6 text-gray-500">{a.email}</td>
                                <td className="p-6"><span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">ACTIVO</span></td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
               </div>
            </div>
         )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Centro de Mensajes</h1>
               
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <h2 className="font-bold text-xl mb-4 text-gray-800">Nueva Notificación Push</h2>
                  <textarea 
                     className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none mb-6 transition"
                     rows={4}
                     placeholder="Escribe el mensaje para todos los usuarios..."
                     value={notifMsg}
                     onChange={e => setNotifMsg(e.target.value)}
                  ></textarea>
                  <button 
                     disabled={!notifMsg.trim()}
                     onClick={() => { onSendNotification(notifMsg); setNotifMsg(''); }}
                     className="bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
                  >
                     Enviar a Todos
                  </button>
               </div>

               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 text-xs uppercase tracking-wider">Historial Enviado</div>
                  <div className="divide-y divide-gray-100">
                     {notifications.map(n => (
                        <div key={n.id} className="p-6 hover:bg-gray-50 transition">
                           <div className="flex justify-between mb-2">
                              <span className="text-xs text-gray-400 font-medium">{n.dateFormatted} {n.time}</span>
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{n.sentBy}</span>
                           </div>
                           <p className="text-gray-800 font-medium">{n.message}</p>
                        </div>
                     ))}
                     {notifications.length === 0 && <div className="p-12 text-center text-gray-400">Sin historial de notificaciones</div>}
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* MODALS */}
      {showAddAdmin && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md" onClick={() => setShowAddAdmin(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <h3 className="text-2xl font-bold mb-6 text-gray-900">Nuevo Administrador</h3>
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Nombre" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-8 focus:ring-2 focus:ring-blue-100 outline-none" type="password" placeholder="Contraseña" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} />
               <div className="flex gap-4">
                  <button onClick={() => setShowAddAdmin(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
                  <button onClick={handleCreateAdmin} disabled={!newAdmin.name || !newAdmin.email} className="flex-1 py-3.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-200 transition">Crear</button>
               </div>
            </div>
         </div>
      )}

      {showAddBranch && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md" onClick={() => setShowAddBranch(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <h3 className="text-2xl font-bold mb-6 text-gray-900">Nueva Sede</h3>
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Nombre" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Dirección" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ciudad" value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Teléfono" value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} />
               <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl mb-8 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Manager" value={newBranch.manager} onChange={e => setNewBranch({...newBranch, manager: e.target.value})} />
               <div className="flex gap-4">
                  <button onClick={() => setShowAddBranch(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
                  <button onClick={handleCreateBranch} disabled={!newBranch.name} className="flex-1 py-3.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-200 transition">Crear</button>
               </div>
            </div>
         </div>
      )}

      {/* NEW MODAL: Add Reward */}
      {showAddReward && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md" onClick={() => setShowAddReward(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <h3 className="text-2xl font-bold mb-6 text-gray-900">Nuevo Premio</h3>
               <div className="space-y-4">
                   <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Nombre del premio" value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} />
                   <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Descripción" value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} />
                   <div className="flex gap-4">
                        <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" type="number" placeholder="Puntos Costo" value={rewardForm.points || ''} onChange={e => setRewardForm({...rewardForm, points: parseInt(e.target.value)})} />
                        <input className="w-20 border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-center" placeholder="Icono" value={rewardForm.icon} onChange={e => setRewardForm({...rewardForm, icon: e.target.value})} />
                   </div>
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowAddReward(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl">Cancelar</button>
                  <button onClick={handleCreateReward} className="flex-1 py-3.5 bg-blue-700 text-white rounded-xl font-bold">Guardar</button>
               </div>
            </div>
         </div>
      )}

      {/* NEW MODAL: Add Loyalty Card */}
      {showAddCard && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md" onClick={() => setShowAddCard(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <h3 className="text-2xl font-bold mb-6 text-gray-900">Nueva Tarjeta de Sellos</h3>
               <div className="space-y-4">
                   <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Nombre (Ej: Café Gratis)" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} />
                   <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Descripción" value={cardForm.description} onChange={e => setCardForm({...cardForm, description: e.target.value})} />
                   <div className="flex gap-4">
                        <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" type="number" placeholder="Total Sellos" value={cardForm.totalStamps || ''} onChange={e => setCardForm({...cardForm, totalStamps: parseInt(e.target.value)})} />
                        <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Categoría" value={cardForm.category} onChange={e => setCardForm({...cardForm, category: e.target.value})} />
                   </div>
                   <div className="flex gap-4">
                       <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Premio Final (Ej: 1 Café)" value={cardForm.reward} onChange={e => setCardForm({...cardForm, reward: e.target.value})} />
                       <input className="w-20 border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-center" placeholder="Icono" value={cardForm.icon} onChange={e => setCardForm({...cardForm, icon: e.target.value})} />
                   </div>
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowAddCard(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl">Cancelar</button>
                  <button onClick={handleCreateCard} className="flex-1 py-3.5 bg-blue-700 text-white rounded-xl font-bold">Guardar</button>
               </div>
            </div>
         </div>
      )}

      {/* NEW MODAL: Add/Edit Promotion */}
      {showAddPromo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md" onClick={() => setShowAddPromo(false)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <h3 className="text-2xl font-bold mb-6 text-gray-900">{editingPromoId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
               <div className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Título</label>
                       <input className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ej: ¡Doble Puntos!" value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} />
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descripción</label>
                       <textarea className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" rows={2} placeholder="Detalles de la promo..." value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tipo</label>
                            <select 
                                className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                                value={promoForm.type}
                                onChange={e => setPromoForm({...promoForm, type: e.target.value as any})}
                            >
                                <option value="multiplier">Multiplicador</option>
                                <option value="bonus">Bono Puntos</option>
                                <option value="discount">Descuento</option>
                            </select>
                       </div>
                       <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Valor</label>
                            <input type="number" className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ej: 2 (para 2x)" value={promoForm.value} onChange={e => setPromoForm({...promoForm, value: parseFloat(e.target.value)})} />
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inicio</label>
                            <input type="date" className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={promoForm.startDate} onChange={e => setPromoForm({...promoForm, startDate: e.target.value})} />
                       </div>
                       <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fin</label>
                            <input type="date" className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={promoForm.endDate} onChange={e => setPromoForm({...promoForm, endDate: e.target.value})} />
                       </div>
                   </div>
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowAddPromo(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl">Cancelar</button>
                  <button onClick={handleSavePromo} className="flex-1 py-3.5 bg-blue-700 text-white rounded-xl font-bold">{editingPromoId ? 'Actualizar' : 'Guardar Promo'}</button>
               </div>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                 <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                         <AlertCircle size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
                     <p className="text-gray-500">
                         {deleteConfirm.type === 'reward' && "Esta acción eliminará el premio del catálogo permanentemente."}
                         {deleteConfirm.type === 'card' && "Esta acción eliminará la tarjeta de sellos. Los usuarios con sellos activos podrían perder su progreso."}
                         {deleteConfirm.type === 'promotion' && "Esta acción eliminará la promoción. Dejará de aplicarse a las compras inmediatamente."}
                     </p>
                 </div>
                 <div className="flex gap-3">
                     <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                     <button 
                        onClick={confirmDelete} 
                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition"
                     >
                        Eliminar
                     </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;