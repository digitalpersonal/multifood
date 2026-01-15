
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronLeft, ShoppingBag, Utensils, Info, Lock, 
  Umbrella, X, Clock, CheckCircle2, Plus, Minus, Bike, Phone, 
  MapPin, ShoppingCart, Timer, ChevronRight, Send, Loader2, AlertTriangle, Star, Home, UserCheck, MapPinned, Store, Image as ImageIcon, Soup, ListChecks, Check, Settings2, Users, Handshake
} from 'lucide-react';
import { Tab, Product, Category, ItemStatus, OrderType, OrderItem, DeliveryInfo, PaymentMethod, Settings, Combo, Promotion, SelectedModifier, ModifierGroup, MarmitaSize } from '../types';

interface Props {
  isWithinShifts: boolean;
  tabs: Tab[];
  products: Product[];
  combos: Combo[];
  promotions: Promotion[];
  isLocked: boolean;
  onLock: () => void;
  onAddItems: (tabId: string, items: OrderItem[]) => void;
  onOpenOrder: (type: OrderType, name: string, ident: string | DeliveryInfo, method?: PaymentMethod) => string | undefined;
  settings: Settings;
  onReturnToRoleSelection: () => void; // Nova prop para voltar à seleção de perfil
}

const CustomerView: React.FC<Props> = ({ isWithinShifts, tabs, products, combos, promotions, isLocked, onLock, onAddItems, onOpenOrder, settings, onReturnToRoleSelection }) => {
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'identification' | 'menu' | 'cart' | 'success' | 'awaiting_waiter'>('landing');
  
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('mf_name') || '');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [deliveryData, setDeliveryData] = useState<DeliveryInfo>(() => {
    const saved = localStorage.getItem('mf_delivery');
    return saved ? JSON.parse(saved) : { address: '', phone: '' };
  });
  
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'success' | null>(null);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customizingMarmita, setCustomizingMarmita] = useState<{size: MarmitaSize} | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWithinMarmitaHours = useMemo(() => {
    if (!settings.marmitaConfig.enabled) return false;
    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.marmitaConfig.startTime.split(':').map(Number);
    const [endH, endM] = settings.marmitaConfig.endTime.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    return curr >= start && curr <= end;
  }, [settings.marmitaConfig]);

  const filteredItems = useMemo(() => {
    let list: any[] = [];
    if (activeCategory === 'Todos' || activeCategory === Category.COMBOS) {
      list = [...list, ...combos.map(c => ({...c, isCombo: true, category: Category.COMBOS}))];
    }
    if (activeCategory === 'Todos' || activeCategory !== Category.COMBOS) {
      list = [...list, ...products.filter(p => activeCategory === 'Todos' || p.category === activeCategory)];
    }
    return list.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, combos, activeCategory, searchQuery]);

  const cartSubtotal = useMemo(() => cart.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0), [cart]);
  const serviceFee = useMemo(() => (orderType === OrderType.BEACH || orderType === OrderType.INDOOR) && settings.serviceFeeEnabled ? cartSubtotal * (settings.serviceFeePercent / 100) : 0, [cartSubtotal, orderType, settings]);
  const deliveryFee = useMemo(() => orderType === OrderType.DELIVERY ? settings.deliveryFee : 0, [orderType, settings]);
  const cartTotal = cartSubtotal + serviceFee + deliveryFee;

  const handleOrderTypeSelection = (type: OrderType) => {
    setOrderType(type);
    if (type === OrderType.BEACH || type === OrderType.INDOOR) {
      setViewState('identification'); // Ainda precisa de identificação para nome/número
    } else {
      setViewState('identification');
    }
  };

  const handleOpenMarmitaCustomization = (size: MarmitaSize) => {
    setCustomizingMarmita({ size });
    setSelectedModifiers([]);
  };

  const finalizeMarmitaSelection = () => {
    if (!customizingMarmita) return;
    
    let finalPrice = customizingMarmita.size.price;
    selectedModifiers.forEach(m => finalPrice += m.price);

    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: 'marmita_dia',
      quantity: 1,
      status: ItemStatus.NEW,
      timestamp: new Date().toISOString(),
      priceAtOrder: finalPrice,
      marmitaSize: customizingMarmita.size.label,
      selectedModifiers: [...selectedModifiers]
    };
    
    setCart(prev => [...prev, newItem]);
    setCustomizingMarmita(null);
  };

  const toggleModifier = (group: ModifierGroup, option: any) => {
    const alreadySelected = selectedModifiers.filter(m => m.groupId === group.id);
    const isSelected = alreadySelected.some(m => m.optionId === option.id);

    if (isSelected) {
      setSelectedModifiers(prev => prev.filter(m => m.optionId !== option.id));
    } else {
      if (alreadySelected.length < group.max) {
        const newMod: SelectedModifier = {
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: option.extraPrice
        };
        setSelectedModifiers(prev => [...prev, newMod]);
      } else if (group.max === 1) {
        setSelectedModifiers(prev => [
          ...prev.filter(m => m.groupId !== group.id),
          { groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: option.extraPrice }
        ]);
      }
    }
  };

  const addToCart = (product: Product, modifiers: SelectedModifier[]) => {
    let finalPrice = product.price;
    modifiers.forEach(m => {
      finalPrice += m.price;
    });

    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      quantity: 1,
      status: ItemStatus.NEW,
      timestamp: new Date().toISOString(),
      priceAtOrder: finalPrice,
      selectedModifiers: modifiers
    };

    setCart(prev => [...prev, newItem]);
    setCustomizingProduct(null);
    setSelectedModifiers([]);
  };

  const handleConfirmIdentity = () => {
    if (!customerName) return;
    localStorage.setItem('mf_name', customerName);
    if (orderType === OrderType.DELIVERY) {
      localStorage.setItem('mf_delivery', JSON.stringify(deliveryData));
    }
    
    // Se for consumo local, vai para a tela de aguardando garçom
    if (orderType === OrderType.BEACH || orderType === OrderType.INDOOR) {
      setViewState('awaiting_waiter');
    } else {
      setViewState('menu');
    }
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getProductName = (id: string) => {
    if (id === 'marmita_dia') return 'Marmita do Dia';
    return products.find(p => p.id === id)?.name || combos.find(c => c.id === id)?.name || 'Item';
  };

  if (!settings.isOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-2xl shadow-rose-500/20">
          <Lock size={48} strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Estamos Pausados</h2>
        <p className="text-slate-500 font-bold mb-10 max-w-[280px] leading-relaxed">
          {settings.companyName} não está aceitando pedidos agora.
        </p>
        <button 
          onClick={onReturnToRoleSelection} 
          className="w-full max-w-xs bg-slate-800 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-700 transition-all active:scale-95 mt-8"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Permite retornar à seleção de perfil a partir de qualquer estado da CustomerView
  const returnToRoleSelectionButton = (
    <button 
      onClick={onReturnToRoleSelection} 
      className="mb-10 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors mx-auto"
    >
      <ChevronLeft size={16}/> Voltar para seleção de perfil
    </button>
  );

  if (viewState === 'landing') {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-md mx-auto w-full">
          {returnToRoleSelectionButton} {/* Botão para voltar */}
          <div className="text-center">
             <div className="bg-white w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-slate-200/50 overflow-hidden border-4 border-white">
               {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <Store size={48} className="text-yellow-400" />}
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{settings.companyName}</h1>
             <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Selecione o Atendimento</p>
          </div>
          <div className="w-full space-y-3">
            <SelectionBtn onClick={() => handleOrderTypeSelection(OrderType.BEACH)} icon={<Umbrella size={24}/>} label="Praia" sub="Atendimento pelo Garçom" color="bg-slate-900" badge="CHAMAR GARÇOM"/>
            <SelectionBtn onClick={() => handleOrderTypeSelection(OrderType.INDOOR)} icon={<Utensils size={24}/>} label="Salão" sub="Atendimento pelo Garçom" color="bg-blue-600" badge="CHAMAR GARÇOM"/>
            <SelectionBtn onClick={() => handleOrderTypeSelection(OrderType.DELIVERY)} icon={<Bike size={24}/>} label="Delivery" sub={isWithinShifts ? "Receber em Casa" : "Fechado agora"} color={isWithinShifts ? "bg-orange-600" : "bg-slate-300"} disabled={!isWithinShifts} badge={isWithinShifts ? "ABERTO" : "FECHADO"} />
            <SelectionBtn onClick={() => handleOrderTypeSelection(OrderType.TAKEAWAY)} icon={<ShoppingBag size={24}/>} label="Retirada" sub="Buscar no Balcão" color="bg-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'identification') {
     const isDelivery = orderType === OrderType.DELIVERY;
     return (
       <div className="h-screen flex flex-col p-8 bg-white overflow-y-auto animate-in slide-in-from-right duration-400">
         <button onClick={() => setViewState('landing')} className="mb-10 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
            <ChevronLeft size={16}/> Voltar
         </button>
         <div className="flex-1 max-w-md mx-auto w-full">
           <div className="mb-12">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{isDelivery ? 'Delivery' : (orderType === OrderType.TAKEAWAY ? 'Retirada' : 'Consumo Local')}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Complete os dados abaixo</p>
           </div>
           <div className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
               <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] font-bold focus:border-yellow-400 outline-none text-sm" placeholder="Seu nome" />
             </div>
             {isDelivery ? (
               <>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                   <textarea value={deliveryData.address} onChange={e => setDeliveryData({...deliveryData, address: e.target.value})} className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] font-bold focus:border-orange-400 outline-none h-32 resize-none text-sm" placeholder="Rua, número, bairro..." />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                   <input type="tel" value={deliveryData.phone} onChange={e => setDeliveryData({...deliveryData, phone: e.target.value})} className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] font-bold focus:border-orange-400 outline-none text-sm" placeholder="(00) 00000-0000" />
                 </div>
               </>
             ) : (orderType === OrderType.BEACH || orderType === OrderType.INDOOR) ? (
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número da {orderType === OrderType.BEACH ? 'Barraca' : 'Mesa'}</label>
                 <input type="text" value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[28px] font-bold focus:border-blue-400 outline-none text-2xl text-center" placeholder="00" />
               </div>
             ) : null} {/* Takeaway não precisa de identificação de mesa/endereço */}
             <button onClick={handleConfirmIdentity} disabled={!customerName || (isDelivery && (!deliveryData.address || !deliveryData.phone)) || ((orderType === OrderType.BEACH || orderType === OrderType.INDOOR) && !selectedNumber)} className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl disabled:opacity-30 mt-8">
               {isDelivery || orderType === OrderType.TAKEAWAY ? 'Ver Cardápio' : 'Chamar Garçom'}
            </button>
           </div>
         </div>
       </div>
     );
  }

  // Novo estado para atendimento de garçom (Consumo Local)
  if (viewState === 'awaiting_waiter') {
    return (
      <div className="h-screen flex flex-col p-8 bg-white overflow-y-auto animate-in slide-in-from-right duration-400 text-center">
        <button onClick={() => setViewState('landing')} className="mb-10 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors mx-auto">
          <ChevronLeft size={16}/> Voltar para seleção de pedido
        </button>
        <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center">
          <Handshake size={64} className="text-yellow-500 mb-8" /> {/* Ícone de aperto de mão ou users */}
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Aguarde o Atendimento</h3>
          <p className="text-lg text-slate-600 mb-8 max-w-sm">
            Olá <span className="font-bold">{customerName}</span>! Por favor, aguarde um de nossos garçons. Eles virão até a {orderType === OrderType.BEACH ? 'barraca' : 'mesa'} {selectedNumber} para anotar seu pedido.
          </p>
          <p className="text-sm text-slate-500 max-w-sm">
            Agradecemos a sua compreensão e preferência!
          </p>
          <button onClick={onReturnToRoleSelection} className="mt-8 bg-slate-900 text-white py-4 px-8 rounded-full font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800">
            Encerrar Atendimento
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'menu' && !checkoutStep) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32 animate-in fade-in duration-500">
        <header className={`p-8 pt-16 text-white rounded-b-[50px] shadow-2xl relative overflow-hidden ${orderType === OrderType.DELIVERY ? 'bg-orange-600' : 'bg-slate-900'}`}>
          <div className="flex justify-between items-start relative z-10">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white/20">
                   {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <Store className="text-yellow-400" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter leading-none">{customerName.split(' ')[0]}</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-1">{orderType} • {selectedNumber || 'Deliv'}</p>
                </div>
             </div>
             <button onClick={() => setViewState('landing')} className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><X size={20}/></button>
          </div>
          <div className="mt-8 relative z-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input type="text" placeholder="Buscar no cardápio..." className="w-full bg-white/10 border-none rounded-2xl py-5 pl-12 pr-6 text-white placeholder:text-white/40 font-bold focus:ring-2 focus:ring-yellow-400 outline-none text-sm transition-all shadow-inner backdrop-blur-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </header>

        <div className="px-6 py-8 max-w-xl mx-auto space-y-8">
          {/* HERO MARMITA DO DIA */}
          {isWithinMarmitaHours && (
            <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-emerald-900/10 border border-slate-100 flex flex-col transition-all">
              <div className="w-full h-64 relative bg-slate-100">
                {settings.marmitaConfig.image ? (
                  <img src={settings.marmitaConfig.image} className="w-full h-full object-cover" alt="Marmita do Dia" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10 text-emerald-600"><Soup size={100} /></div>
                )}
                <div className="absolute top-6 left-6 bg-emerald-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <Clock size={14}/> Disponível até {settings.marmitaConfig.endTime}
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Soup size={18}/></div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Marmita do Dia</h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest">Tempero Caseiro</div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                    <ListChecks size={14} className="text-emerald-500" /> Cardápio de Hoje:
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {settings.marmitaConfig.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={4} />
                        <span className="text-xs font-bold text-slate-700">{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {settings.marmitaConfig.sizes.map(size => (
                    <button 
                      key={size.id} 
                      onClick={() => handleOpenMarmitaCustomization(size)}
                      className="group bg-slate-50 hover:bg-emerald-600 border border-slate-100 p-4 rounded-3xl transition-all flex flex-col items-center gap-1 active:scale-95 shadow-sm"
                    >
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-white/70 uppercase tracking-tighter">TAM {size.label}</span>
                      <span className="text-lg font-black text-slate-900 group-hover:text-white tracking-tighter">R$ {size.price.toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
             {['Todos', ...Object.values(Category)].map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`}>
                 {cat}
               </button>
             ))}
          </div>

          <div className="grid gap-6">
             {filteredItems.map(item => (
               <div key={item.id} className="flex flex-col bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group active:scale-[0.98]">
                 <div className="w-full h-48 bg-slate-50 relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon size={64}/></div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
                       <p className="text-xl font-black text-slate-900 tracking-tighter">R$ {item.price.toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="p-6">
                   <h4 className="font-black text-slate-900 text-xl leading-tight mb-2 truncate">{item.name}</h4>
                   <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-8 mb-6">{item.description || 'Preparo artesanal com ingredientes selecionados.'}</p>
                   <button 
                    onClick={() => {
                        if (item.modifierGroups?.length) {
                          setCustomizingProduct(item);
                          setSelectedModifiers([]);
                        } else addToCart(item, []);
                    }} 
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${orderType === OrderType.DELIVERY ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                   >
                     <Plus size={18}/> {item.modifierGroups?.length ? 'Personalizar' : 'Adicionar'}
                   </button>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-10 left-6 right-6 z-[100] max-w-lg mx-auto">
            <button onClick={() => setCheckoutStep('cart')} className="w-full bg-emerald-600 text-white p-6 rounded-[35px] shadow-2xl flex items-center justify-between transition-all hover:scale-[1.03] active:scale-95">
               <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><ShoppingCart size={24} /></div>
                 <div className="text-left leading-tight">
                   <p className="text-[9px] font-black uppercase opacity-80 mb-1">Ver Sacola ({cart.length})</p>
                   <p className="text-2xl font-black tracking-tighter">R$ {cartTotal.toFixed(2)}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">Avançar <ChevronRight size={18} /></div>
            </button>
          </div>
        )}

        {/* MODAL DE CUSTOMIZAÇÃO GERAL (SUPORTA QUALQUER PRODUTO) */}
        {(customizingProduct || customizingMarmita) && (
          <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-end justify-center backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-t-[50px] flex flex-col h-[90vh] shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
                      {customizingMarmita ? <Soup size={28} className="text-emerald-500" /> : <Settings2 size={28} className="text-slate-900" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                        {customizingMarmita ? 'Personalizar Marmita' : customizingProduct?.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {customizingMarmita ? `Tamanho ${customizingMarmita.size.label}` : 'Escolha os opcionais'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setCustomizingProduct(null); setCustomizingMarmita(null); setSelectedModifiers([]); }} className="p-4 bg-white rounded-2xl text-slate-400 shadow-sm active:scale-90 transition-all"><X size={24}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
                 {(customizingMarmita ? settings.marmitaConfig.modifierGroups : customizingProduct?.modifierGroups)?.map(group => (
                    <div key={group.id} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">{group.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {group.min > 0 ? `Obrigatório • ${group.min} a ${group.max}` : `Opcional • Escolha até ${group.max}`}
                          </p>
                        </div>
                        {selectedModifiers.filter(m => m.groupId === group.id).length > 0 && (
                          <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">
                             {selectedModifiers.filter(m => m.groupId === group.id).length}/{group.max}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {group.options.map(option => {
                          const isSelected = selectedModifiers.some(m => m.optionId === option.id);
                          return (
                            <button 
                              key={option.id} 
                              onClick={() => toggleModifier(group, option)}
                              className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all group/opt ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-slate-200 group-hover/opt:border-slate-300'}`}>
                                  {isSelected && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                </div>
                                <span className="font-bold text-sm">{option.name}</span>
                              </div>
                              <span className={`text-xs font-black ${isSelected ? 'text-yellow-400' : (option.extraPrice > 0 ? 'text-emerald-600' : 'text-slate-400')}`}>
                                {option.extraPrice > 0 ? `+ R$ ${option.extraPrice.toFixed(2)}` : 'Grátis'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                 ))}
               </div>

               <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                  <button 
                    disabled={
                      (customizingProduct?.modifierGroups || settings.marmitaConfig.modifierGroups || []).some(g => 
                        g.min > 0 && selectedModifiers.filter(m => m.groupId === g.id).length < g.min
                      )
                    }
                    onClick={() => {
                      if (customizingMarmita) finalizeMarmitaSelection();
                      else if (customizingProduct) addToCart(customizingProduct, selectedModifiers);
                    }}
                    className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    Confirmar e Adicionar <ChevronRight size={18}/>
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODAL DE REVISÃO DA SACOLA
  if (checkoutStep === 'cart') {
    return (
        <div className="fixed inset-0 bg-slate-950/95 z-[150] flex items-end justify-center backdrop-blur-xl p-4">
           <div className="bg-white w-full max-w-xl rounded-[50px] flex flex-col h-[90vh] shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Sua Sacola</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                      <Info size={12}/> Revise antes de enviar
                    </p>
                 </div>
                 <button onClick={() => setCheckoutStep(null)} className="p-4 bg-white rounded-2xl text-slate-400 shadow-sm hover:text-slate-900 transition-all active:scale-90"><X size={24}/></button>
              </div>
    
              <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                 {cart.map(item => (
                   <div key={item.id} className="flex flex-col gap-3 bg-slate-50/50 p-6 rounded-[35px] border border-slate-100">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-3xl shrink-0 shadow-sm">
                           {item.productId === 'marmita_dia' ? <Soup className="text-emerald-500" /> : '🥘'}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-900 text-base truncate">{getProductName(item.productId)}</h4>
                           {item.marmitaSize && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Tamanho {item.marmitaSize}</span>}
                           <p className="text-sm font-black text-slate-400 mt-1">R$ {item.priceAtOrder.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                           <button onClick={() => updateCartQuantity(item.id, -1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Minus size={18}/></button>
                           <span className="font-black text-slate-900 text-base w-6 text-center">{item.quantity}</span>
                           <button onClick={() => updateCartQuantity(item.id, 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Plus size={18}/></button>
                        </div>
                      </div>
                      
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="pl-26 space-y-1">
                          {item.selectedModifiers.map((mod, idx) => (
                            <div key={idx} className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                               {mod.groupName}: {mod.optionName} {mod.price > 0 && `(+R$ ${mod.price.toFixed(2)})`}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                 ))}
              </div>
    
              <div className="p-10 bg-slate-50 border-t border-slate-200 space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end pt-6 border-t-2 border-slate-200">
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Final</p>
                         <p className="text-5xl font-black text-slate-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</p>
                       </div>
                       <div className="text-right pb-2">
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Pagamento na Entrega</div>
                       </div>
                    </div>
                 </div>
    
                 <button 
                   onClick={async () => {
                        setIsSubmitting(true);
                        const ident = orderType === OrderType.DELIVERY ? deliveryData : (selectedNumber || 'Balcão');
                        const tabId = onOpenOrder(orderType!, customerName, ident);
                        if (tabId) {
                            onAddItems(tabId, cart);
                            setCart([]);
                            setCheckoutStep('success');
                        }
                        setIsSubmitting(false);
                   }}
                   disabled={isSubmitting || cart.length === 0}
                   className={`w-full py-7 rounded-[30px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 transition-all ${isSubmitting ? 'bg-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                 >
                    {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}
                    {isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                 </button>
              </div>
           </div>
        </div>
      );
  }

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-10 shadow-2xl shadow-emerald-100/50">
          <CheckCircle2 size={64} strokeWidth={3} className="animate-in zoom-in duration-700 delay-300" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Recebemos!</h2>
        <p className="text-slate-500 font-bold mb-14 leading-relaxed max-w-[300px] text-lg">
          {orderType === OrderType.DELIVERY 
            ? 'Seu pedido já entrou em produção e logo sairá para entrega.' 
            : `Fique à vontade, em instantes seu pedido chegará até você!`}
        </p>
        <button 
          onClick={() => { setViewState('landing'); setOrderType(null); setCheckoutStep(null); }}
          className="w-full max-w-xs bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
        >
          Novo Pedido
        </button>
      </div>
    );
  }

  return null; 
};

const SelectionBtn: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; sub: string; color: string; disabled?: boolean; badge?: string }> = ({ onClick, icon, label, sub, color, disabled, badge }) => (
  <button onClick={onClick} disabled={disabled} className={`${disabled ? 'bg-slate-100' : color} p-5 md:p-8 rounded-[30px] md:rounded-[40px] text-white flex items-center gap-5 md:gap-8 transition-all active:scale-95 shadow-2xl group w-full h-24 md:h-32 relative overflow-hidden shrink-0`}>
    <div className={`w-14 h-14 md:w-20 md:h-20 ${disabled ? 'bg-slate-200' : 'bg-white/20'} rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0`}>
      {disabled ? <Lock size={20} className="text-slate-400"/> : icon}
    </div>
    <div className="text-left relative z-10 flex-1 overflow-hidden">
      <div className="flex items-center gap-2 md:gap-3 mb-0.5">
        <p className={`text-xl md:text-2xl font-black leading-none uppercase tracking-tighter truncate ${disabled ? 'text-slate-400' : 'text-white'}`}>{label}</p>
        {badge && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/20 text-white">{badge}</span>}
      </div>
      <p className={`text-[10px] md:text-[11px] font-bold opacity-70 truncate ${disabled ? 'text-slate-300' : 'text-white'}`}>{sub}</p>
    </div>
  </button>
);

export default CustomerView;