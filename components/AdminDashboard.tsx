import React, { useState } from 'react';
import { User, Redemption, Purchase, LoyaltyCard, SystemSettings } from '../types';
import { LogOut, CheckCircle, XCircle, Clock, CheckSquare, ShoppingBag, Stamp, Gift, Search, Calendar, AlertTriangle } from 'lucide-react';

interface Props {
  user: User;
  logout: () => void;
  redemptions: Redemption[];
  purchases: Purchase[];
  users: User[];
  onApproveRedemption: (id: number) => void;
  onRejectRedemption: (id: number) => void;
  onApprovePurchase: (purchase: Purchase, stamps: {cardId: number, count: number}[]) => void;
  onRejectPurchase: (id: number) => void;
  loyaltyCards: LoyaltyCard[];
  settings: SystemSettings;
}

const AdminDashboard: React.FC<Props> = ({ 
    user, logout, redemptions, purchases, users, 
    onApproveRedemption, onRejectRedemption, onApprovePurchase, onRejectPurchase,
    loyaltyCards, settings
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'redemptions' | 'history'>('purchases');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseToReject, setPurchaseToReject] = useState<Purchase | null>(null);
  const [stampsToAssign, setStampsToAssign] = useState<{ [key: number]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Desconocido';

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  
  // Filter purchases
  const pendingPurchases = purchases.filter(p => {
      const isPending = p.status === 'pending';
      const isBranchMatch = !user.branchId || p.branchId === user.branchId;
      const userName = getUserName(p.userId).toLowerCase();
      const isSearchMatch = userName.includes(searchTerm.toLowerCase());
      const isDateMatch = !dateFilter || p.date === dateFilter;
      
      return isPending && isBranchMatch && isSearchMatch && isDateMatch;
  });
  
  const processedRedemptions = redemptions.filter(r => r.status !== 'pending');
  const processedPurchases = purchases.filter(p => p.status !== 'pending' && (!user.branchId || p.branchId === user.branchId));

  const handleOpenApproval = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    // Calculate suggested stamps based on settings
    const suggestedStamps = Math.floor(purchase.amount / settings.amountPerStamp);
    
    // Auto-fill stamps for general cards? Or just leave 0 and let admin choose?
    setStampsToAssign({}); 
    setShowApprovalModal(true);
  };

  const handleStampChange = (cardId: number, delta: number) => {
    setStampsToAssign(prev => ({
        ...prev,
        [cardId]: Math.max(0, (prev[cardId] || 0) + delta)
    }));
  };

  const confirmApproval = () => {
    if (!selectedPurchase) return;
    const stampsList = Object.entries(stampsToAssign)
        .filter(([_, count]) => (count as number) > 0)
        .map(([cardId, count]) => ({ cardId: parseInt(cardId), count: count as number }));
    
    onApprovePurchase(selectedPurchase, stampsList);
    setShowApprovalModal(false);
    setSelectedPurchase(null);
    setStampsToAssign({});
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white shadow-xl z-10 md:fixed md:h-full border-r border-gray-100 flex flex-col">
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center md:block">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight">Panel Admin</h2>
            <div className="mt-1 md:mt-2 text-sm text-gray-500 font-medium hidden md:block">Hola, {user.name}</div>
            {user.branchId && <div className="text-xs text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded-md font-bold mt-2 hidden md:inline-block">Sede ID: {user.branchId}</div>}
          </div>
          {/* Mobile User Info (Compact) */}
          <div className="md:hidden text-right">
              <span className="text-sm font-bold text-gray-700 block">{user.name}</span>
              <span className="text-xs text-gray-400">ID: {user.branchId}</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <button 
             onClick={() => setActiveTab('purchases')}
             className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'purchases' ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <div className="flex items-center gap-3"><ShoppingBag size={20} /> Compras</div>
             {pendingPurchases.length > 0 && <span className="bg-yellow-400 text-blue-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{pendingPurchases.length}</span>}
          </button>
          <button 
             onClick={() => setActiveTab('redemptions')}
             className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'redemptions' ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <div className="flex items-center gap-3"><Gift size={20} /> Canjes</div>
             {pendingRedemptions.length > 0 && <span className="bg-yellow-400 text-blue-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{pendingRedemptions.length}</span>}
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all ${activeTab === 'history' ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <CheckSquare size={20} /> Historial
          </button>
        </nav>
        <div className="p-4 md:absolute md:bottom-0 md:w-full">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition font-bold text-sm">
             <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 p-6 md:p-8 lg:p-12">
        <div className="mb-8 md:mb-10">
           <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
               {activeTab === 'purchases' ? 'Aprobación de Compras' : activeTab === 'redemptions' ? 'Solicitudes de Canje' : 'Historial'}
           </h1>
           <p className="text-gray-500 text-lg">Gestiona las transacciones de tu sede</p>
        </div>

        {activeTab === 'purchases' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header & Filters */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <h2 className="font-bold text-xl text-gray-800">Compras Pendientes</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-48">
                            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input 
                                type="date" 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-600 font-medium" 
                            />
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                    </div>
                </div>

                {pendingPurchases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th className="p-6 font-semibold">Cliente</th>
                                    <th className="p-6 font-semibold">Monto</th>
                                    <th className="p-6 font-semibold">Puntos Calc.</th>
                                    <th className="p-6 font-semibold min-w-[200px]">Descripción</th>
                                    <th className="p-6 font-semibold">Sede ID</th>
                                    <th className="p-6 font-semibold">Fecha</th>
                                    <th className="p-6 font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingPurchases.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition">
                                        <td className="p-6 font-medium text-gray-900">{getUserName(p.userId)}</td>
                                        <td className="p-6 font-bold text-gray-900">${p.amount.toLocaleString()}</td>
                                        <td className="p-6 text-green-600 font-bold">+{p.points}</td>
                                        <td className="p-6 text-gray-600">{p.description}</td>
                                        <td className="p-6 text-gray-500 font-mono text-sm">#{p.branchId}</td>
                                        <td className="p-6 text-sm text-gray-500">{p.date}</td>
                                        <td className="p-6">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleOpenApproval(p)}
                                                    className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                                                >
                                                    <CheckCircle size={16} /> Aprobar
                                                </button>
                                                <button 
                                                    onClick={() => setPurchaseToReject(p)}
                                                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                                                >
                                                    <XCircle size={16} /> Rechazar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center text-gray-400">
                        <ShoppingBag className="mx-auto mb-4 opacity-10" size={64} />
                        <p className="text-lg font-medium">No se encontraron compras.</p>
                    </div>
                )}
            </div>
        )}

        {/* Redemptions Tab */}
        {activeTab === 'redemptions' && (
           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h2 className="font-bold text-xl text-gray-800">Solicitudes de Canje</h2>
                </div>
                {pendingRedemptions.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {pendingRedemptions.map(r => (
                            <div key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition gap-4">
                                <div>
                                    <div className="font-bold text-gray-900 text-lg">{r.rewardName}</div>
                                    <div className="text-gray-500">Cliente: {getUserName(r.userId)}</div>
                                    <div className="text-sm text-blue-600 font-bold mt-1">Costo: {r.points} pts</div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => onApproveRedemption(r.id)}
                                        className="flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
                                    >
                                        Aprobar Canje
                                    </button>
                                    <button 
                                        onClick={() => onRejectRedemption(r.id)}
                                        className="flex-1 md:flex-none px-6 py-2 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-20 text-center text-gray-400">
                        <Gift className="mx-auto mb-4 opacity-10" size={64} />
                        <p className="text-lg font-medium">No hay canjes pendientes.</p>
                    </div>
                )}
           </div>
        )}

        {activeTab === 'history' && (
           <div className="p-8 bg-white rounded-[2rem] shadow-sm">
                <h2 className="font-bold mb-4">Historial Reciente</h2>
                <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-center">
                    Funcionalidad de historial completo próximamente...
                </div>
           </div>
        )}
      </div>

      {/* MODAL: Approve Purchase & Assign Stamps */}
      {showApprovalModal && selectedPurchase && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowApprovalModal(false)}>
              <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-8 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-2xl font-bold text-gray-900">Aprobar Compra</h3>
                      <p className="text-gray-500 mt-1">Confirma la compra y asigna sellos al cliente.</p>
                  </div>
                  
                  <div className="p-8 space-y-6 overflow-y-auto">
                      <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-2 gap-6 border border-gray-100">
                          <div>
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Cliente</div>
                              <div className="font-bold text-lg text-gray-900">{getUserName(selectedPurchase.userId)}</div>
                          </div>
                          <div>
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Monto</div>
                              <div className="font-bold text-lg text-gray-900">${selectedPurchase.amount.toLocaleString()}</div>
                          </div>
                          <div className="col-span-2">
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Puntos a Sumar</div>
                              <div className="font-bold text-green-600 text-2xl flex items-center gap-2">+{selectedPurchase.points} <span className="text-sm font-normal text-gray-400">pts</span></div>
                          </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <Stamp size={20} className="text-blue-700" /> Asignar Sellos
                          </h4>
                          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mb-4">
                             Sugerencia del sistema: <strong>{Math.floor(selectedPurchase.amount / settings.amountPerStamp)} sellos</strong> (1 por cada ${settings.amountPerStamp.toLocaleString()})
                          </div>
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {loyaltyCards.map(card => (
                                  <div key={card.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition bg-white">
                                      <div className="flex items-center gap-4">
                                          <div className="text-3xl">{card.icon}</div>
                                          <div>
                                              <div className="font-bold text-gray-900">{card.name}</div>
                                              <div className="text-xs text-gray-500">{card.totalStamps} para premio</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                                          <button 
                                            onClick={() => handleStampChange(card.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-gray-50 font-bold text-gray-600 transition"
                                          >-</button>
                                          <span className="w-8 text-center font-bold text-blue-700 text-lg">{stampsToAssign[card.id] || 0}</span>
                                          <button 
                                            onClick={() => handleStampChange(card.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-blue-700 text-white rounded-md shadow-lg shadow-blue-200 hover:bg-blue-800 font-bold transition"
                                          >+</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                      <button onClick={() => setShowApprovalModal(false)} className="flex-1 py-3.5 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition">Cancelar</button>
                      <button onClick={confirmApproval} className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition">Confirmar y Asignar</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: Reject Purchase Confirmation */}
      {purchaseToReject && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setPurchaseToReject(null)}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">¿Rechazar Compra?</h3>
                    <p className="text-gray-500 mt-2">Esta acción no se puede deshacer. El usuario será notificado del rechazo.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setPurchaseToReject(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                    <button 
                        onClick={() => { onRejectPurchase(purchaseToReject.id); setPurchaseToReject(null); }} 
                        className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200"
                    >
                        Si, Rechazar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;