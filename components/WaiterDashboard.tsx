
import React, { useState } from 'react';
import { Tab, Product, ItemStatus, OrderType, OrderItem, Notification } from '../types';
import { 
  LayoutDashboard, ShoppingCart, X, Clock, CheckCircle2, 
  Umbrella, Utensils, Bike, Bell, MapPin, Phone, Send, Users, Minus, Plus, ListFilter 
} from 'lucide-react';

interface Props {
  tabs: Tab[];
  products: Product[];
  notifications: Notification[];
  onOpenTab: (tent: string, name: string, waiter: string, type: OrderType) => void;
  onAddItems: (tabId: string, items: OrderItem[]) => void;
  onUpdatePeopleCount: (tabId: string, count: number) => void;
  onClearNotification: (id: string) => void;
}

const WaiterDashboard: React.FC<Props> = ({ tabs, products, notifications, onOpenTab, onAddItems, onUpdatePeopleCount, onClearNotification }) => {
  const [filter, setFilter] = useState<'all' | OrderType>('all');
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);

  const filteredTabs = tabs.filter(t => filter === 'all' || t.orderType === filter);
  const currentSelectedTab = selectedTab ? tabs.find(t => t.id === selectedTab.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <LayoutDashboard className="text-yellow-500" /> Operacional
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
          <FilterBtn active={filter === OrderType.BEACH} onClick={() => setFilter(OrderType.BEACH)} label="Praia" />
          <FilterBtn active={filter === OrderType.INDOOR} onClick={() => setFilter(OrderType.INDOOR)} label="Salão" />
          <FilterBtn active={filter === OrderType.DELIVERY} onClick={() => setFilter(OrderType.DELIVERY)} label="Delivery" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTabs.map(tab => (
          <div key={tab.id} onClick={() => setSelectedTab(tab)} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:border-yellow-400 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${tab.orderType === OrderType.DELIVERY ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}`}>
                {tab.orderType === OrderType.DELIVERY ? <Bike size={20}/> : <MapPin size={20}/>}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tab.orderType}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-none">{tab.customerName}</h3>
            <p className="text-xs font-bold text-slate-400 mt-2 truncate">{tab.tentNumber || 'Delivery'}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs font-black text-slate-900">R$ {tab.total.toFixed(2)}</span>
              <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full">{tab.items.length} itens</span>
            </div>
          </div>
        ))}
      </div>

      {currentSelectedTab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div><h3 className="text-2xl font-black text-slate-900">{currentSelectedTab.customerName}</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{currentSelectedTab.orderType}</p></div>
              <button onClick={() => setSelectedTab(null)} className="p-2 bg-slate-50 rounded-full"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens do Pedido</h4>
                {currentSelectedTab.items.map(item => (
                  <div key={item.id} className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-900 bg-white w-10 h-10 flex items-center justify-center rounded-xl shadow-sm">{item.quantity}x</span>
                        <p className="font-bold text-sm text-slate-800">{products.find(p => p.id === item.productId)?.name}</p>
                      </div>
                      <span className="font-black text-slate-900 text-xs">R$ {(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="pl-14 space-y-1">
                        {item.selectedModifiers.map((mod, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                             <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                             <span>{mod.groupName}: {mod.optionName}</span>
                             {mod.price > 0 && <span className="text-emerald-600">(+ R$ {mod.price.toFixed(2)})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.note && <p className="pl-14 text-[10px] text-rose-500 font-black italic">Obs: {item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${active ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
);

export default WaiterDashboard;
