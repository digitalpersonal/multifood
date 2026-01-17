
import React, { useState, useEffect, useMemo } from 'react';
import { Tab, Product, ItemStatus, OrderType, OrderItem, Category } from '../types';
import { 
  LayoutDashboard, ShoppingCart, X, Clock, CheckCircle2, 
  Umbrella, Utensils, Bike, Bell, MapPin, Phone, Send, Users, Minus, Plus, ListFilter, Timer, ChevronRight,
  Info, Printer, Soup, MessageCircle, Search, ChevronLeft, Zap, Utensils as ForkIcon
} from 'lucide-react';

interface Props {
  tabs: Tab[];
  products: Product[];
  notifications: any[];
  onOpenTab: (tent: string, name: string, waiter: string, type: OrderType) => void;
  onAddItems: (tabId: string, items: OrderItem[]) => void;
  onUpdatePeopleCount: (tabId: string, count: number) => void;
  onClearNotification: (id: string) => void;
}

const WaiterDashboard: React.FC<Props> = ({ tabs, products, onOpenTab, onAddItems }) => {
  const [filter, setFilter] = useState<'all' | OrderType>('all');
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempCart, setTempCart] = useState<{product: Product, quantity: number}[]>([]);

  const filteredTabs = tabs.filter(t => filter === 'all' || t.orderType === filter);
  const currentSelectedTab = selectedTab ? tabs.find(t => t.id === selectedTab.id) : null;

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleAddTemp = (p: Product) => {
    setTempCart(prev => {
      const exists = prev.find(i => i.product.id === p.id);
      if (exists) return prev.map(i => i.product.id === p.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, {product: p, quantity: 1}];
    });
  };

  const confirmWaiterAdd = () => {
    if (!currentSelectedTab || tempCart.length === 0) return;
    const items: OrderItem[] = tempCart.map(i => ({
      id: Math.random().toString(),
      productId: i.product.id,
      quantity: i.quantity,
      status: ItemStatus.NEW,
      timestamp: new Date().toISOString(),
      priceAtOrder: i.product.price
    }));
    onAddItems(currentSelectedTab.id, items);
    setTempCart([]);
    setShowProductPicker(false);
  };

  const getTypeStyles = (type: OrderType) => {
    switch (type) {
      case OrderType.DELIVERY: return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-600', icon: <Bike size={20}/> };
      case OrderType.BEACH: return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-600', icon: <Umbrella size={20}/> };
      case OrderType.INDOOR: return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'bg-indigo-600', icon: <Utensils size={20}/> };
      case OrderType.TAKEAWAY: return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-600', icon: <ShoppingCart size={20}/> };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'bg-slate-600', icon: <MapPin size={20}/> };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl shadow-lg shadow-yellow-400/20"><LayoutDashboard className="text-slate-900" size={24} /></div>
            Monitor de Pedidos
          </h2>
        </div>
        <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" count={tabs.length} />
          <FilterBtn active={filter === OrderType.INDOOR} onClick={() => setFilter(OrderType.INDOOR)} label="Mesa" count={tabs.filter(t => t.orderType === OrderType.INDOOR).length} color="indigo" />
          <FilterBtn active={filter === OrderType.BEACH} onClick={() => setFilter(OrderType.BEACH)} label="Barraca" count={tabs.filter(t => t.orderType === OrderType.BEACH).length} color="amber" />
          <FilterBtn active={filter === OrderType.DELIVERY} onClick={() => setFilter(OrderType.DELIVERY)} label="Delivery" count={tabs.filter(t => t.orderType === OrderType.DELIVERY).length} color="orange" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTabs.map(tab => {
          const styles = getTypeStyles(tab.orderType);
          return (
            <div key={tab.id} onClick={() => setSelectedTab(tab)} className={`bg-white rounded-[40px] border-2 ${styles.border} shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col p-6`}>
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${styles.accent}`} />
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${styles.bg} ${styles.color}`}>{styles.icon}</div>
                <div className="flex gap-1">
                   {tab.wantsCondiments && <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Zap size={14} fill="currentColor"/></div>}
                   {tab.wantsCutlery && <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ForkIcon size={14}/></div>}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{tab.customerName}</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{tab.tentNumber || 'Balcão'}</p>
              <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-50 mt-6">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Total</p><p className="text-xl font-black text-slate-900 leading-none mt-1">R$ {tab.total.toFixed(2)}</p></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.bg} ${styles.color}`}><ChevronRight size={20} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {currentSelectedTab && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-hidden">
            <header className="p-10 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl ${getTypeStyles(currentSelectedTab.orderType).accent}`}>{getTypeStyles(currentSelectedTab.orderType).icon}</div>
                <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{currentSelectedTab.customerName}</h3><p className="text-slate-400 text-[10px] font-black uppercase mt-2">{currentSelectedTab.orderType} • {currentSelectedTab.tentNumber || 'Balcão'}</p></div>
              </div>
              <button onClick={() => setSelectedTab(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400"><X size={24}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setShowProductPicker(true)} className="w-full bg-slate-950 text-white py-6 rounded-[25px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Plus size={20}/> Adicionar Itens</button>
                 <div className="flex gap-2">
                    <div className={`flex-1 flex flex-col items-center justify-center rounded-[25px] border-2 ${currentSelectedTab.wantsCondiments ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                       <Zap size={20} className={currentSelectedTab.wantsCondiments ? 'fill-emerald-500' : ''}/>
                       <span className="text-[8px] font-black uppercase mt-1">Sachês</span>
                    </div>
                    <div className={`flex-1 flex flex-col items-center justify-center rounded-[25px] border-2 ${currentSelectedTab.wantsCutlery ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                       <ForkIcon size={20}/>
                       <span className="text-[8px] font-black uppercase mt-1">Talheres</span>
                    </div>
                 </div>
              </div>

              {(currentSelectedTab.observation || currentSelectedTab.wantsCondiments || currentSelectedTab.wantsCutlery) && (
                <div className="bg-rose-50 border-2 border-rose-100 rounded-[35px] p-8 space-y-4">
                  <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Preferências do Cliente</h4>
                  <div className="flex flex-wrap gap-2">
                     {currentSelectedTab.wantsCondiments && <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest">Enviar Sachês</span>}
                     {currentSelectedTab.wantsCutlery && <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-widest">Enviar Talheres</span>}
                  </div>
                  {currentSelectedTab.observation && <p className="font-bold text-lg text-rose-700 italic">"{currentSelectedTab.observation}"</p>}
                </div>
              )}

              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Produtos na Conta</h4>
                <div className="grid gap-4">
                  {currentSelectedTab.items.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex justify-between items-center">
                       <div className="flex items-center gap-5">
                          <span className="font-black text-slate-900 bg-slate-100 w-12 h-12 flex items-center justify-center rounded-2xl text-lg">{item.quantity}x</span>
                          <div>
                            <p className="font-black text-lg text-slate-900 leading-none">{products.find(p => p.id === item.productId)?.name}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">{products.find(p => p.id === item.productId)?.category}</p>
                          </div>
                       </div>
                       <span className="font-black text-slate-900">R$ {(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Picker de Produtos para o Garçom */}
      {showProductPicker && currentSelectedTab && (
        <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl h-[80vh] rounded-[60px] flex flex-col overflow-hidden animate-in zoom-in-95">
              <header className="p-8 border-b flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setShowProductPicker(false)} className="p-3 bg-slate-50 rounded-xl text-slate-400"><ChevronLeft size={20}/></button>
                    <h3 className="text-2xl font-black">Selecionar Itens</h3>
                 </div>
                 <div className="bg-slate-100 p-3 rounded-2xl flex items-center gap-3">
                    <Search size={18} className="text-slate-400"/>
                    <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent font-bold outline-none text-sm"/>
                 </div>
              </header>
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4 no-scrollbar">
                 {filteredProducts.map(p => (
                   <button key={p.id} onClick={() => handleAddTemp(p)} className="p-5 bg-slate-50 border border-slate-100 rounded-[30px] flex justify-between items-center hover:bg-white hover:border-slate-900 hover:shadow-xl transition-all group">
                      <div className="text-left">
                        <p className="font-black text-slate-900">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">R$ {p.price.toFixed(2)}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-yellow-400 transition-all"><Plus size={18}/></div>
                   </button>
                 ))}
              </div>
              <footer className="p-8 bg-slate-50 border-t flex items-center justify-between">
                 <div className="flex -space-x-3">
                    {tempCart.slice(0, 3).map(i => (
                      <div key={i.product.id} className="w-10 h-10 bg-slate-950 text-white rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">{i.quantity}x</div>
                    ))}
                    {tempCart.length > 3 && <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">+{tempCart.length - 3}</div>}
                 </div>
                 <button onClick={confirmWaiterAdd} disabled={tempCart.length === 0} className="bg-emerald-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all">Lançar Agora</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; color?: string }> = ({ active, onClick, label, count, color }) => {
  const colorStyles = () => {
    if (!active) return 'text-slate-500 hover:text-slate-800';
    switch (color) {
      case 'indigo': return 'bg-indigo-600 text-white shadow-lg';
      case 'amber': return 'bg-amber-50 text-white shadow-lg';
      case 'orange': return 'bg-orange-600 text-white shadow-lg';
      default: return 'bg-slate-950 text-white shadow-lg';
    }
  };
  return <button onClick={onClick} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2.5 ${colorStyles()}`}>{label} <span className="opacity-50">{count}</span></button>;
};

export default WaiterDashboard;
