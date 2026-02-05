import React, { useState, useEffect } from 'react';
import { User, UserStampCard, Branch, AppNotification, LoyaltyCard, Purchase, Coupon, SystemSettings, Reward, Promotion } from './types';
import { StorageService } from './services/storage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { User as UserIcon, ArrowRight, Star, Users, ShieldCheck, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);

  // App Data State
  const [users, setUsers] = useState(StorageService.getUsers());
  const [purchases, setPurchases] = useState(StorageService.getPurchases());
  const [redemptions, setRedemptions] = useState(StorageService.getRedemptions());
  const [userStamps, setUserStamps] = useState(StorageService.getUserStamps());
  const [coupons, setCoupons] = useState(StorageService.getCoupons());
  const [branches, setBranches] = useState(StorageService.getBranches());
  const [notifications, setNotifications] = useState(StorageService.getNotifications());
  
  // Dynamic Settings State
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [rewards, setRewards] = useState<Reward[]>(StorageService.getRewards());
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>(StorageService.getLoyaltyCards());
  const [promotions, setPromotions] = useState<Promotion[]>(StorageService.getPromotions());

  // Init
  useEffect(() => {
    StorageService.init();
    refreshData();
    const session = StorageService.getCurrentUser();
    if (session) setCurrentUser(session);
    setLoading(false);
  }, []);

  // Sync with Storage when state changes
  useEffect(() => StorageService.setUsers(users), [users]);
  useEffect(() => StorageService.setPurchases(purchases), [purchases]);
  useEffect(() => StorageService.setRedemptions(redemptions), [redemptions]);
  useEffect(() => StorageService.setUserStamps(userStamps), [userStamps]);
  useEffect(() => StorageService.setCoupons(coupons), [coupons]);
  useEffect(() => StorageService.setBranches(branches), [branches]);
  useEffect(() => StorageService.setNotifications(notifications), [notifications]);
  
  // Sync Settings
  useEffect(() => StorageService.setSettings(settings), [settings]);
  useEffect(() => StorageService.setRewards(rewards), [rewards]);
  useEffect(() => StorageService.setLoyaltyCards(loyaltyCards), [loyaltyCards]);
  useEffect(() => StorageService.setPromotions(promotions), [promotions]);

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setPurchases(StorageService.getPurchases());
    setRedemptions(StorageService.getRedemptions());
    setUserStamps(StorageService.getUserStamps());
    setCoupons(StorageService.getCoupons());
    setBranches(StorageService.getBranches());
    setNotifications(StorageService.getNotifications());
    setSettings(StorageService.getSettings());
    setRewards(StorageService.getRewards());
    setLoyaltyCards(StorageService.getLoyaltyCards());
    setPromotions(StorageService.getPromotions());
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
     setToast({ msg, type });
     setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
       setCurrentUser(user);
       StorageService.setCurrentUser(user);
       showToast(`¡Hola de nuevo, ${user.name}!`);
       setError('');
    } else {
       setError('Credenciales inválidas');
       showToast('Error de inicio de sesión', 'error');
    }
  };

  const handleLogout = () => {
     setCurrentUser(null);
     StorageService.setCurrentUser(null);
     setEmail('');
     setPassword('');
     showToast('Sesión cerrada');
  };

  // --- Actions ---

  const handleRedeemReward = (rewardId: number) => {
    if (!currentUser) return;
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (currentUser.points >= reward.points) {
       const newRedemption = {
          id: Date.now(),
          userId: currentUser.id,
          rewardId: reward.id,
          rewardName: reward.name,
          points: reward.points,
          date: new Date().toISOString().split('T')[0],
          status: 'pending' as const
       };
       setRedemptions([...redemptions, newRedemption]);
       
       const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, points: u.points - reward.points } : u);
       setUsers(updatedUsers);
       const me = updatedUsers.find(u => u.id === currentUser.id);
       if(me) {
          setCurrentUser(me);
          StorageService.setCurrentUser(me);
       }
       showToast('Solicitud de canje enviada');
    } else {
       showToast('Puntos insuficientes', 'error');
    }
  };

  const handleRedeemCard = (cardId: number) => {
     if (!currentUser) return;
     showToast('Las recompensas se generan automáticamente al llegar a la meta de sellos.');
  };

  // Handle User Register Purchase
  const handleRegisterPurchase = (data: { amount: number; description: string; branchId: number; receipt?: string }) => {
      if (!currentUser) return;
      
      // Calculate points dynamically based on Settings AND Promotions
      const basePoints = Math.floor(data.amount / settings.amountPerPoint);
      
      // Calculate Active Promotions
      const now = new Date();
      const activePromos = promotions.filter(p => 
          p.status === 'active' && 
          new Date(p.startDate) <= now && 
          new Date(p.endDate) >= now
      );

      let multiplier = 1;
      let bonusPoints = 0;

      activePromos.forEach(promo => {
          if (promo.type === 'multiplier') {
              multiplier = Math.max(multiplier, promo.value); // Use highest multiplier
          } else if (promo.type === 'bonus') {
              // Simple check: apply bonus if it's a purchase (could add min amount check later)
              bonusPoints += promo.value;
          }
      });

      const finalPoints = Math.floor(basePoints * multiplier) + bonusPoints;

      const newPurchase: Purchase = {
          id: Date.now(),
          userId: currentUser.id,
          branchId: data.branchId,
          date: new Date().toISOString().split('T')[0],
          amount: data.amount,
          points: finalPoints, 
          description: data.description,
          status: 'pending',
          receipt: data.receipt
      };
      setPurchases([newPurchase, ...purchases]);
      showToast('Compra registrada exitosamente. Pendiente de aprobación.');
  };

  const handleApproveRedemption = (id: number) => {
     setRedemptions(redemptions.map(r => r.id === id ? { ...r, status: 'approved' } : r));
     showToast('Canje aprobado');
  };

  const handleRejectRedemption = (id: number) => {
     const redemption = redemptions.find(r => r.id === id);
     if (redemption) {
        setRedemptions(redemptions.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        // Refund points
        setUsers(users.map(u => u.id === redemption.userId ? { ...u, points: u.points + redemption.points } : u));
        showToast('Rechazado y puntos devueltos');
     }
  };

  // --- Purchase Approval Logic with Business Rules ---
  const handleApprovePurchase = (purchase: Purchase, stamps: {cardId: number, count: number}[]) => {
     if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        showToast('No tienes permisos para aprobar compras', 'error');
        return;
     }

     const now = new Date();
     // Update Purchase
     setPurchases(prev => prev.map(p => p.id === purchase.id ? { ...p, status: 'approved', approvedAt: now.toISOString() } : p));

     // Add Points to User
     setUsers(prev => prev.map(u => 
        u.id === purchase.userId ? { ...u, points: u.points + purchase.points } : u
     ));

     // Handle Stamps
     let updatedUserStamps = [...userStamps];
     let newCoupons: Coupon[] = [];
     let stampsAssignedCount = 0;

     stamps.forEach(({ cardId, count }) => {
        const cardDef = loyaltyCards.find(c => c.id === cardId);
        if(!cardDef) return;

        let userCardIndex = updatedUserStamps.findIndex(s => s.userId === purchase.userId && s.cardId === cardId);
        let currentStamps = 0;
        
        if (userCardIndex > -1) {
            currentStamps = updatedUserStamps[userCardIndex].stamps;
        } else {
            updatedUserStamps.push({
                id: Date.now() + Math.random(),
                userId: purchase.userId,
                cardId,
                stamps: 0,
                completed: false,
                startDate: new Date().toISOString().split('T')[0]
            });
            userCardIndex = updatedUserStamps.length - 1;
        }

        currentStamps += count;
        stampsAssignedCount += count;

        // Auto-Reward Logic Dynamic based on Card Definition
        if (currentStamps >= cardDef.totalStamps) {
            const couponCode = `REW-${purchase.userId}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
            newCoupons.push({
                id: Date.now() + Math.random(),
                userId: purchase.userId,
                code: couponCode,
                name: `Cupón: ${cardDef.reward}`,
                description: `Ganado por completar ${cardDef.totalStamps} sellos en ${cardDef.name}`,
                generatedDate: new Date().toISOString(),
                status: 'active'
            });
            currentStamps = currentStamps - cardDef.totalStamps; 
        }

        updatedUserStamps[userCardIndex] = {
            ...updatedUserStamps[userCardIndex],
            stamps: currentStamps
        };
     });
     
     const branchName = branches.find(b => b.id === purchase.branchId)?.name || 'Tienda';
     const newNotification: AppNotification = {
         id: Date.now(),
         userId: purchase.userId,
         message: `🎉 Tu compra de $${purchase.amount.toLocaleString()} en ${branchName} ha sido APROBADA. Has recibido +${purchase.points} puntos.`,
         date: now.toISOString(),
         dateFormatted: now.toISOString().split('T')[0],
         time: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
         sentBy: 'Sistema'
     };
     setNotifications(prev => [newNotification, ...prev]);

     if (newCoupons.length > 0) {
         setCoupons(prev => [...prev, ...newCoupons]);
         showToast(`Compra aprobada. ¡Se generaron ${newCoupons.length} cupón(es) de recompensa!`);
     } else {
         showToast(`Compra aprobada. +${purchase.points} pts y ${stampsAssignedCount} sellos asignados.`);
     }

     setUserStamps(updatedUserStamps);
  };

  const handleRejectPurchase = (id: number) => {
     const purchase = purchases.find(p => p.id === id);
     setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
     if (purchase) {
         const now = new Date();
         const newNotification: AppNotification = {
             id: Date.now(),
             userId: purchase.userId,
             message: `⚠️ Tu compra de $${purchase.amount.toLocaleString()} del ${purchase.date} ha sido RECHAZADA. Por favor contacta al administrador.`,
             date: now.toISOString(),
             dateFormatted: now.toISOString().split('T')[0],
             time: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
             sentBy: 'Sistema'
         };
         setNotifications(prev => [newNotification, ...prev]);
     }
     showToast('Compra rechazada');
  };

  // Super Admin Actions
  const handleAddBranch = (branchData: Partial<Branch>) => {
     const newBranch: Branch = {
        id: Date.now(),
        name: branchData.name || '',
        address: branchData.address || '',
        city: branchData.city || '',
        phone: branchData.phone || '',
        manager: branchData.manager || '',
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0]
     };
     setBranches([...branches, newBranch]);
     showToast('Sede creada');
  };

  const handleUpdateBranch = (id: number, status: 'active' | 'inactive') => {
     setBranches(branches.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleAddAdmin = (data: Partial<User>) => {
     const newUser: User = {
        id: Date.now(),
        email: data.email || '',
        password: data.password || '',
        name: data.name || '',
        role: 'admin',
        points: 0,
        tier: null
     };
     setUsers([...users, newUser]);
     showToast('Admin creado');
  };

  const handleSendNotification = (message: string) => {
     if (!currentUser) return;
     const newNotif: AppNotification = {
        id: Date.now(),
        message,
        date: new Date().toISOString(),
        dateFormatted: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        sentBy: currentUser.name
     };
     setNotifications([newNotif, ...notifications]);
     showToast('Notificación enviada');
  };

  // Settings Management (SuperAdmin)
  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    showToast('Configuración global actualizada');
  };

  const handleAddReward = (reward: Reward) => {
    setRewards([...rewards, reward]);
    showToast('Premio agregado al catálogo');
  };

  const handleDeleteReward = (id: number) => {
    setRewards(rewards.filter(r => r.id !== id));
    showToast('Premio eliminado');
  };

  const handleAddLoyaltyCard = (card: LoyaltyCard) => {
    setLoyaltyCards([...loyaltyCards, card]);
    showToast('Nueva tarjeta de sellos creada');
  };

  const handleDeleteLoyaltyCard = (id: number) => {
    setLoyaltyCards(loyaltyCards.filter(c => c.id !== id));
    showToast('Tarjeta eliminada');
  };

  // Promotion Management
  const handleAddPromotion = (promo: Promotion) => {
      setPromotions([...promotions, promo]);
      showToast('Promoción creada');
  };

  const handleUpdatePromotion = (id: number, data: Partial<Promotion>) => {
      setPromotions(promotions.map(p => p.id === id ? { ...p, ...data } : p));
      if (data.status) showToast(`Promoción ${data.status === 'active' ? 'activada' : 'desactivada'}`);
      else showToast('Promoción actualizada');
  };

  const handleDeletePromotion = (id: number) => {
      setPromotions(promotions.filter(p => p.id !== id));
      showToast('Promoción eliminada');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;

  if (!currentUser) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
           {/* Login UI */}
           <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex-col md:flex-row">
              {/* Left Side: Branding (Hidden on Mobile, Visible on Desktop) */}
              <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-12 flex-col justify-between text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Star size={24} className="text-[#0F172A] fill-current" />
                      </div>
                      <span className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Fidelia App</span>
                    </div>
                    
                    <h1 className="text-4xl font-extrabold leading-tight mb-6 text-white">Donde siempre <span className="text-yellow-400">recibes más.</span></h1>
                    
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-4 shadow-xl">
                       <p className="text-blue-50 text-base font-medium leading-relaxed mb-4">
                          <strong>Únete al club donde ser fiel tiene privilegios.</strong>
                          <br/><br/>
                          Bienvenido a la experiencia <strong>Fidelia App</strong>. Hemos digitalizado la lealtad para que tu fidelidad nunca pase desapercibida.
                       </p>
                       <div className="h-px bg-white/20 my-4"></div>
                       <p className="text-yellow-200 italic font-serif text-lg">
                          "La app que entiende que tu tiempo y tu preferencia valen oro."
                       </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8">
                     <div className="flex items-center gap-4 bg-[#020617]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                        <div className="flex -space-x-3">
                           {[1,2,3,4].map(i => (
                              <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-[#1E293B] flex items-center justify-center text-[#1E293B] text-xs font-bold overflow-hidden">
                                 <Users size={16} />
                              </div>
                           ))}
                        </div>
                        <div className="text-sm font-medium text-blue-100">
                           <span className="text-yellow-400 font-bold">Más de 500 clientes</span> ya canjearon su café gratis esta semana.
                        </div>
                     </div>
                  </div>
              </div>

              {/* Right Side: Form */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                 <div className="max-w-md mx-auto w-full">
                    {/* Mobile Branding Header */}
                    <div className="md:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-2 justify-center mb-4">
                            <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center shadow-lg">
                                <Star size={24} className="text-white fill-current" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Fidelia App</h2>
                        <p className="text-gray-500 text-sm">Tu lealtad recompensada</p>
                    </div>

                    <div className="mb-8 text-center md:text-left">
                       <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Hola! 👋</h2>
                       <p className="text-gray-500 text-lg">Ingresa tus credenciales para ver tu progreso.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Correo Electrónico</label>
                          <input 
                             type="email" 
                             value={email} 
                             onChange={e => setEmail(e.target.value)} 
                             className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium" 
                             placeholder="usuario@demo.com" 
                             required 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Contraseña</label>
                          <input 
                             type="password" 
                             value={password} 
                             onChange={e => setPassword(e.target.value)} 
                             className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium" 
                             placeholder="••••••••" 
                             required 
                          />
                       </div>
                       
                       {error && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                             {error}
                          </div>
                       )}
                       
                       <button type="submit" className="w-full bg-[#0F172A] text-white font-bold py-4 rounded-xl hover:bg-[#1E293B] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group">
                          Iniciar Sesión <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                       </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                       <p className="text-xs text-gray-400 mb-4 uppercase font-bold text-center tracking-wider">Accesos Rápidos (Demo)</p>
                       <div className="flex flex-wrap gap-2 justify-center">
                          <button onClick={() => { setEmail('usuario@demo.com'); setPassword('demo123'); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition">Usuario</button>
                          <button onClick={() => { setEmail('admin@demo.com'); setPassword('admin123'); }} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition">Admin</button>
                          <button onClick={() => { setEmail('super@demo.com'); setPassword('super123'); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition">Super Admin</button>
                       </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setShowPolicy(true)} 
                            className="text-xs text-gray-400 hover:text-blue-600 underline flex items-center justify-center gap-1 mx-auto transition"
                        >
                            <ShieldCheck size={12} /> Política de Protección de Datos
                        </button>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Policy Modal */}
           {showPolicy && (
               <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowPolicy(false)}>
                   <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                       <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                           <h3 className="font-bold text-xl text-gray-900">Política de Privacidad</h3>
                           <button onClick={() => setShowPolicy(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
                       </div>
                       <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
                           <p><strong>1. Responsable del Tratamiento:</strong> Fidelia App, en cumplimiento de la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales.</p>
                           <p><strong>2. Finalidad:</strong> Los datos personales recolectados serán utilizados para la gestión del programa de fidelización, acumulación de puntos, comunicación de ofertas y análisis estadístico.</p>
                           <p><strong>3. Derechos del Titular:</strong> Como titular de los datos, tiene derecho a conocer, actualizar, rectificar y suprimir su información personal, así como a revocar la autorización otorgada.</p>
                           <p><strong>4. Seguridad:</strong> Implementamos medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.</p>
                           <p><strong>5. Contacto:</strong> Para ejercer sus derechos, puede contactarnos a través del correo soporte@fidelia.app.</p>
                           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs mt-4">
                               Al ingresar a la aplicación, aceptas nuestros términos y condiciones y autorizas el tratamiento de tus datos personales.
                           </div>
                       </div>
                       <div className="p-4 border-t border-gray-100 text-center">
                           <button onClick={() => setShowPolicy(false)} className="bg-[#0F172A] text-white px-6 py-2.5 rounded-xl font-bold text-sm w-full">Entendido</button>
                       </div>
                   </div>
               </div>
           )}

           {toast && <div className={`fixed top-5 right-5 px-6 py-3 rounded-2xl shadow-xl text-white font-bold animate-bounce z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.msg}</div>}
        </div>
     );
  }

  return (
    <>
      {currentUser.role === 'user' && (
         <UserDashboard 
            user={currentUser} 
            logout={handleLogout}
            purchases={purchases.filter(p => p.userId === currentUser.id)}
            redemptions={redemptions.filter(r => r.userId === currentUser.id)}
            rewards={rewards} 
            loyaltyCards={loyaltyCards} 
            userStamps={userStamps.filter(s => s.userId === currentUser.id)}
            userNotifications={notifications.filter(n => !n.userId || n.userId === currentUser.id)}
            userCoupons={coupons.filter(c => c.userId === currentUser.id)} 
            branches={branches} 
            promotions={promotions} // Pass Promotions
            settings={settings} // Pass Settings
            onRedeem={handleRedeemReward}
            onRedeemCard={handleRedeemCard}
            onRegisterPurchase={handleRegisterPurchase}
         />
      )}
      {currentUser.role === 'admin' && (
         <AdminDashboard 
            user={currentUser} 
            logout={handleLogout}
            redemptions={redemptions}
            purchases={purchases}
            users={users}
            onApproveRedemption={handleApproveRedemption}
            onRejectRedemption={handleRejectRedemption}
            onApprovePurchase={handleApprovePurchase}
            onRejectPurchase={handleRejectPurchase}
            loyaltyCards={loyaltyCards} 
            settings={settings} 
         />
      )}
      {currentUser.role === 'superadmin' && (
         <SuperAdminDashboard 
            user={currentUser} 
            logout={handleLogout}
            users={users}
            purchases={purchases}
            redemptions={redemptions}
            branches={branches}
            notifications={notifications}
            settings={settings}
            rewards={rewards}
            loyaltyCards={loyaltyCards}
            promotions={promotions} // New
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onAddAdmin={handleAddAdmin}
            onExportData={() => showToast('CSV Exportado (Simulado)')}
            onSendNotification={handleSendNotification}
            onUpdateSettings={handleUpdateSettings}
            onAddReward={handleAddReward}
            onDeleteReward={handleDeleteReward}
            onAddLoyaltyCard={handleAddLoyaltyCard}
            onDeleteLoyaltyCard={handleDeleteLoyaltyCard}
            onAddPromotion={handleAddPromotion} // New
            onUpdatePromotion={handleUpdatePromotion} // New
            onDeletePromotion={handleDeletePromotion} // New
         />
      )}
      {toast && (
         <div className={`fixed top-5 right-5 px-6 py-3 rounded-2xl shadow-xl text-white font-bold z-50 animate-in slide-in-from-top-5 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {toast.msg}
         </div>
      )}
    </>
  );
};

export default App;