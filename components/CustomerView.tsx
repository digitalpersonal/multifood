
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ShoppingBag, X, Plus, Minus, Bike, Smartphone, 
  ShoppingCart, ChevronRight, Loader2, Store, Image as ImageIcon, Soup, 
  Check, QrCode, Copy, ShieldCheck, DollarSign, Wallet, MessageCircle, History, Receipt, Trash2, Utensils, MapPin, Package, Star, Clock, Umbrella, Footprints, Zap, Pizza, IceCream, UtensilsCrossed, Hamburger, Coffee, FileText, Utensils as ForkIcon, Sparkles, Tag
} from 'lucide-react';
import { Tab, Product, Category, ItemStatus, OrderType, OrderItem, DeliveryInfo, PaymentMethod, Settings, PaymentStatus, TabStatus, SelectedModifier, Combo, Promotion } from '../types';

interface Props {
  isWithinShifts: boolean;
  tabs: Tab[];
  products: Product[];
  combos: Combo[];
  promotions: Promotion[];
  isLocked: boolean;
  onLock: () => void;
  onAddItems: (tabId: string, items: OrderItem[], observation?: string, wantsCondiments?: boolean, wantsCutlery?: boolean) => void;
  onOpenOrder: (type: OrderType, name: string, ident: string | DeliveryInfo, method?: PaymentMethod) => string | undefined;
  settings: Settings;
  onUpdatePaymentStatus: (tabId: string, status: PaymentStatus) => void;
  onReturnToRoleSelection: () => void;
}

const CustomerView: React.FC<Props> = ({ tabs, products, combos, promotions, onAddItems, onOpenOrder, settings, onUpdatePaymentStatus, onReturnToRoleSelection, isWithinShifts }) => {
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'identification' | 'menu' | 'cart' | 'success'>('landing');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('mf_name') || '');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [deliveryData, setDeliveryData] = useState<DeliveryInfo>(() => {
    const saved = localStorage.getItem('mf_delivery');
    return saved ? JSON.parse(saved) : { address: '', phone: '' };
  });
  
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos' | 'Combos' | 'Ofertas'>('Todos');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment_method' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Preferências do Pedido
  const [observation, setObservation] = useState('');
  const [wantsCondiments, setWantsCondiments] = useState(true);
  const [wantsCutlery, setWantsCutlery] = useState(true);

  // States for Customization (Wizard vs Standard)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);

  const isMarmitaTime = useMemo(() => {
    if (!settings.marmitaConfig.enabled) return false;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.marmitaConfig.startTime.split(':').map(Number);
    const [endH, endM] = settings.marmitaConfig.endTime.split(':').map(Number);
    return currentMin >= (startH * 60 + startM) && currentMin <= (endH * 60 + endM);
  }, [settings.marmitaConfig]);

  // LÓGICA DE PROMOÇÕES ATIVAS
  const getProductPromotion = (product: Product) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentMDay = now.getDate(); // 1-31
    const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return promotions.find(promo => {
      if (!promo.isActive) return false;
      
      // Checar Alvo
      const isTarget = (promo.targetType === 'product' && promo.targetId === product.id) ||
                       (promo.targetType === 'category' && promo.targetId === product.category);
      if (!isTarget) return false;

      // Checar Agendamento
      switch (promo.scheduleType) {
        case 'always': return true;
        case 'daily': return promo.scheduleValue === String(currentDay);
        case 'monthly': return promo.scheduleValue === String(currentMDay);
        case 'yearly': return promo.scheduleValue === currentMonthDay;
        default: return false;
      }
    });
  };

  const calculatePromoPrice = (product: Product) => {
    const promo = getProductPromotion(product);
    if (!promo || promo.promoType === 'badge_only') return product.price;

    if (promo.promoType === 'percentage') {
      return product.price * (1 - promo.discountValue / 100);
    } else {
      return Math.max(0, product.price - promo.discountValue);
    }
  };

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      if (p.category === Category.MARMITAS && !isMarmitaTime) return false;
      return (activeCategory === 'Todos' || activeCategory === 'Ofertas' || p.category === activeCategory);
    });

    if (activeCategory === 'Ofertas') {
      list = list.filter(p => getProductPromotion(p) !== undefined);
    }

    return list;
  }, [products, activeCategory, isMarmitaTime, promotions]);

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0);
    const service = (settings.serviceFeeEnabled && (orderType === OrderType.INDOOR || orderType === OrderType.BEACH)) ? subtotal * (settings.serviceFeePercent / 100) : 0;
    const delivery = orderType === OrderType.DELIVERY ? settings.deliveryFee : 0;
    return subtotal + service + delivery;
  }, [cart, orderType, settings]);

  const handleStartCustomization = (product: Product) => {
    setCustomizingProduct(product);
    setStepIndex(0);
    setSelectedModifiers([]);
  };

  const toggleModifier = (groupId: string, groupName: string, optionId: string, optionName: string, price: number, min: number, max: number) => {
    const existingInGroup = selectedModifiers.filter(m => m.groupId === groupId);
    const alreadySelected = selectedModifiers.find(m => m.optionId === optionId);

    if (alreadySelected) {
      setSelectedModifiers(prev => prev.filter(m => m.optionId !== optionId));
    } else {
      if (existingInGroup.length < max) {
        setSelectedModifiers(prev => [...prev, { groupId, groupName, optionId, optionName, price }]);
      } else if (max === 1) {
        setSelectedModifiers(prev => [...prev.filter(m => m.groupId !== groupId), { groupId, groupName, optionId, optionName, price }]);
      }
    }
  };

  const handleFinishCustomization = () => {
    if (!customizingProduct) return;
    
    if (!isWizardCategory(customizingProduct.category)) {
      for (const group of (customizingProduct.modifierGroups || [])) {
        const count = selectedModifiers.filter(m => m.groupId === group.id).length;
        if (count < group.min) {
          alert(`O grupo "${group.name}" exige pelo menos ${group.min} seleção(ões).`);
          return;
        }
      }
    }

    const finalPriceBase = calculatePromoPrice(customizingProduct);
    const finalPrice = selectedModifiers.reduce((acc, m) => acc + m.price, finalPriceBase);
    setCart(prev => [...prev, {
      id: Math.random().toString(),
      productId: customizingProduct.id,
      quantity: 1,
      status: ItemStatus.NEW,
      timestamp: new Date().toISOString(),
      priceAtOrder: finalPrice,
      selectedModifiers: [...selectedModifiers]
    }]);
    setCustomizingProduct(null);
  };

  const addComboToCart = (combo: Combo) => {
    setCart(prev => [...prev, {
      id: Math.random().toString(),
      productId: combo.id,
      quantity: 1,
      status: ItemStatus.NEW,
      timestamp: new Date().toISOString(),
      priceAtOrder: combo.price,
      isCombo: true
    }]);
  };

  const handleCheckout = () => {
    if (!paymentMethod && !activeTabId) return;
    const ident = (orderType === OrderType.DELIVERY || orderType === OrderType.TAKEAWAY) ? deliveryData : (selectedNumber || 'Balcão');
    const tabId = activeTabId || onOpenOrder(orderType!, customerName, ident, paymentMethod || PaymentMethod.CASH);
    if (tabId) {
      onAddItems(tabId, cart, observation, wantsCondiments, wantsCutlery);
      setActiveTabId(tabId);
      setCart([]);
      setObservation('');
      setCheckoutStep(null);
      setViewState('success');
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case Category.ACAI: return <IceCream size={24}/>;
      case Category.PIZZAS: return <Pizza size={24}/>;
      case Category.MARMITAS: return <UtensilsCrossed size={24}/>;
      case Category.PORCOES: return <Soup size={24}/>;
      case Category.BEBIDAS: return <Coffee size={24}/>;
      default: return <Hamburger size={24}/>;
    }
  };

  const isWizardCategory = (cat: Category) => [Category.ACAI, Category.PIZZAS, Category.MARMITAS].includes(cat);

  const enabledModes = useMemo(() => settings.enabledOrderTypes || [], [settings]);

  if (!isWithinShifts && viewState !== 'landing') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
         <Clock size={64} className="text-yellow-400 mb-8" />
         <h2 className="text-3xl font-black text-white mb-4">Loja Fechada</h2>
         <p className="text-slate-400 font-bold mb-10">Retorne em nosso horário de atendimento: {settings.openingTime} às {settings.closingTime}</p>
         <button onClick={onReturnToRoleSelection} className="bg-white px-10 py-5 rounded-full font-black uppercase text-xs">Voltar</button>
      </div>
    );
  }

  if (viewState === 'landing') {
    return (
      <div className="h-screen flex flex-col bg-slate-950 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
           <button onClick={onReturnToRoleSelection} className="p-3 bg-white/5 text-slate-500 rounded-2xl hover:text-white transition-all"><ChevronLeft size={24}/></button>
           <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">MultiFood Cloud</span>
        </div>
        <div className="flex flex-col items-center mb-10">
           <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-4 shadow-2xl border-4 border-slate-900 overflow-hidden">
              {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" alt="Logo"/> : <Store size={40} className="text-slate-900"/>}
           </div>
           <h1 className="text-3xl font-black text-white tracking-tighter text-center">{settings.companyName}</h1>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 mb-6">
           {enabledModes.includes(OrderType.INDOOR) && (
              <ModeCard onClick={() => { setOrderType(OrderType.INDOOR); setViewState('identification'); }} icon={<Utensils size={32}/>} label="Mesa" sub="Salão" color="bg-indigo-500" />
           )}
           {enabledModes.includes(OrderType.BEACH) && (
              <ModeCard onClick={() => { setOrderType(OrderType.BEACH); setViewState('identification'); }} icon={<Umbrella size={32}/>} label="Barraca" sub="Praia" color="bg-amber-500" />
           )}
           {enabledModes.includes(OrderType.DELIVERY) && (
              <ModeCard onClick={() => { setOrderType(OrderType.DELIVERY); setViewState('identification'); }} icon={<Bike size={32}/>} label="Delivery" sub="Em Casa" color="bg-emerald-500" />
           )}
           {enabledModes.includes(OrderType.TAKEAWAY) && (
              <ModeCard onClick={() => { setOrderType(OrderType.TAKEAWAY); setViewState('identification'); }} icon={<Package size={32}/>} label="Retirada" sub="Balcão" color="bg-rose-500" />
           )}
           {enabledModes.length === 0 && (
             <div className="col-span-2 text-center p-10 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Nenhum canal de venda ativo</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (viewState === 'identification') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
         <header className="w-full max-w-md flex items-center justify-between mb-16">
            <button onClick={() => setViewState('landing')} className="p-4 bg-white/5 rounded-2xl text-slate-500"><ChevronLeft size={24}/></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Check-in</h3>
            <div className="w-12"></div>
         </header>
         <div className="w-full max-w-md space-y-8 flex-1">
            <div className="space-y-4">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Como devemos te chamar?</label>
               <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] font-black text-2xl text-white outline-none focus:border-yellow-400" placeholder="Seu Nome" />
            </div>
            {(orderType === OrderType.INDOOR || orderType === OrderType.BEACH) && (
               <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{orderType === OrderType.BEACH ? 'Número da Barraca' : 'Número da Mesa'}</label>
                  <input type="text" value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)} className="w-full p-10 bg-white/5 border border-white/10 rounded-[40px] font-black text-6xl text-center text-white outline-none focus:border-yellow-400" placeholder="00" />
               </div>
            )}
            {orderType === OrderType.DELIVERY && (
               <textarea value={deliveryData.address} onChange={e => setDeliveryData({...deliveryData, address: e.target.value})} className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] font-bold text-white h-32 resize-none outline-none focus:border-emerald-400" placeholder="Endereço para entrega..." />
            )}
            <button onClick={() => setViewState('menu')} disabled={!customerName} className="w-full bg-white text-slate-950 py-7 rounded-[35px] font-black uppercase text-xs tracking-widest shadow-2xl disabled:opacity-20 transition-all">Ver Cardápio</button>
         </div>
      </div>
    );
  }

  if (viewState === 'menu') {
    return (
       <div className="min-h-screen bg-slate-50 pb-44">
          <header className="bg-slate-950 p-10 pt-16 rounded-b-[60px] text-white flex justify-between items-center relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-2xl font-black tracking-tight leading-none">{customerName}</h2>
                <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mt-2">{orderType} • {selectedNumber || 'Balcão'}</p>
             </div>
             <button onClick={() => setViewState('landing')} className="p-4 bg-white/10 rounded-2xl relative z-10"><X size={24}/></button>
          </header>
          
          <div className="p-8 max-w-xl mx-auto space-y-8">
             <div className="flex gap-3 overflow-x-auto no-scrollbar sticky top-4 z-[100]">
                {['Todos', 'Combos', 'Ofertas', ...availableCategories].map(cat => (
                   <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all shadow-sm ${activeCategory === cat ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-white text-slate-400'}`}>{cat}</button>
                ))}
             </div>

             <div className="grid gap-6">
                {(activeCategory === 'Todos' || activeCategory === 'Combos') && combos.map(combo => (
                  <div key={combo.id} className="bg-slate-900 p-6 rounded-[50px] shadow-2xl flex gap-6 group relative overflow-hidden border border-white/10">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full" />
                     <div className="w-28 h-28 bg-white/10 rounded-[35px] overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                        {combo.image ? <img src={combo.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt={combo.name}/> : <Sparkles size={32} className="text-yellow-400"/>}
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest">Oferta</span>
                           <h4 className="font-black text-white text-lg leading-tight">{combo.name}</h4>
                        </div>
                        <p className="text-slate-400 text-[10px] font-medium leading-relaxed mb-4 line-clamp-2">{combo.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                           <p className="text-2xl font-black text-yellow-400 tracking-tighter">R$ {combo.price.toFixed(2)}</p>
                           <button 
                             onClick={() => addComboToCart(combo)} 
                             className="p-4 rounded-[22px] bg-white text-slate-950 shadow-xl active:scale-90 transition-all"
                           >
                             <Plus size={20}/>
                           </button>
                        </div>
                     </div>
                  </div>
                ))}

                {(activeCategory !== 'Combos') && filteredProducts.map(item => {
                   const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;
                   const promo = getProductPromotion(item);
                   const finalPrice = calculatePromoPrice(item);
                   
                   return (
                      <div key={item.id} className="bg-white p-6 rounded-[50px] border border-slate-100 shadow-sm flex gap-6 hover:shadow-xl transition-all group relative overflow-hidden">
                         {promo && (
                           <div className="absolute top-0 right-10 z-10">
                              <div className="px-4 py-2 rounded-b-2xl font-black text-[9px] uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: promo.color }}>
                                 {promo.badge}
                              </div>
                           </div>
                         )}
                         <div className="w-28 h-28 bg-slate-50 rounded-[35px] overflow-hidden shrink-0 flex items-center justify-center border border-slate-50">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt={item.name}/> : <ImageIcon size={32} className="text-slate-200"/>}
                         </div>
                         <div className="flex-1 flex flex-col justify-center">
                            <h4 className="font-black text-slate-900 text-lg leading-tight mb-1">{item.name}</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">{item.category}</p>
                            <div className="flex items-center justify-between mt-auto">
                               <div>
                                  {promo && promo.promoType !== 'badge_only' && (
                                     <p className="text-[10px] font-bold text-slate-300 line-through">R$ {item.price.toFixed(2)}</p>
                                  )}
                                  <p className="text-2xl font-black text-slate-950 tracking-tighter">R$ {finalPrice.toFixed(2)}</p>
                               </div>
                               <button 
                                 onClick={() => hasModifiers ? handleStartCustomization(item) : setCart(prev => [...prev, { id: Math.random().toString(), productId: item.id, quantity: 1, status: ItemStatus.NEW, timestamp: new Date().toISOString(), priceAtOrder: finalPrice }])} 
                                 className={`p-4 rounded-[22px] transition-all active:scale-90 ${hasModifiers ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-950'}`}
                               >
                                 {hasModifiers ? <Plus size={20}/> : <ShoppingCart size={20}/>}
                               </button>
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

          {/* CUSTOMIZATION VIEW */}
          {customizingProduct && (
            <div className="fixed inset-0 bg-slate-950/98 z-[500] flex flex-col items-center justify-end">
               <div className="bg-white w-full max-w-xl h-[95vh] rounded-t-[60px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
                  <header className="p-10 border-b relative">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                           <div className={`p-4 rounded-2xl text-white ${customizingProduct.category === Category.ACAI ? 'bg-purple-600' : customizingProduct.category === Category.PIZZAS ? 'bg-orange-600' : 'bg-slate-950'}`}>
                              {getCategoryIcon(customizingProduct.category)}
                           </div>
                           <div>
                              <h3 className="text-2xl font-black tracking-tighter">Personalizar {customizingProduct.category.slice(0, -1)}</h3>
                              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{customizingProduct.name}</p>
                           </div>
                        </div>
                        <button onClick={() => setCustomizingProduct(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400"><X size={24}/></button>
                     </div>
                     {isWizardCategory(customizingProduct.category) && (
                        <div className="flex gap-1.5">
                           {customizingProduct.modifierGroups?.map((_, idx) => (
                              <div key={idx} className={`h-2 flex-1 rounded-full transition-all duration-500 ${idx <= stepIndex ? 'bg-slate-950' : 'bg-slate-100'}`} />
                           ))}
                        </div>
                     )}
                  </header>

                  <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                     {isWizardCategory(customizingProduct.category) ? (
                        <div className="animate-in slide-in-from-right duration-300">
                           <div className="flex justify-between items-end mb-8">
                              <div>
                                 <h4 className="text-2xl font-black text-slate-900 leading-tight">{customizingProduct.modifierGroups![stepIndex].name}</h4>
                                 <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                                    {customizingProduct.modifierGroups![stepIndex].min > 0 ? `Obrigatório: Escolha pelo menos ${customizingProduct.modifierGroups![stepIndex].min}` : 'Opcional'}
                                    {` • Máximo ${customizingProduct.modifierGroups![stepIndex].max} itens`}
                                 </p>
                              </div>
                              <span className="bg-slate-100 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest">Passo {stepIndex + 1}/{customizingProduct.modifierGroups!.length}</span>
                           </div>
                           <div className="grid gap-4">
                              {customizingProduct.modifierGroups![stepIndex].options.map(opt => {
                                 const isSelected = selectedModifiers.some(m => m.optionId === opt.id);
                                 return (
                                    <ModifierButton 
                                      key={opt.id} 
                                      opt={opt} 
                                      isSelected={isSelected} 
                                      onClick={() => toggleModifier(customizingProduct.modifierGroups![stepIndex].id, customizingProduct.modifierGroups![stepIndex].name, opt.id, opt.name, opt.extraPrice, customizingProduct.modifierGroups![stepIndex].min, customizingProduct.modifierGroups![stepIndex].max)} 
                                    />
                                 );
                              })}
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-12 animate-in fade-in duration-500">
                           {customizingProduct.modifierGroups?.map((group) => (
                              <div key={group.id} className="space-y-6">
                                 <div className="flex justify-between items-end">
                                    <div>
                                       <h4 className="text-xl font-black text-slate-900 leading-tight">{group.name}</h4>
                                       <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                                          {group.min > 0 ? `Obrigatório (${group.min})` : 'Opcional'} • Máximo {group.max}
                                       </p>
                                    </div>
                                    <div className="flex gap-1">
                                       {Array.from({length: selectedModifiers.filter(m => m.groupId === group.id).length}).map((_, i) => (
                                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                       ))}
                                    </div>
                                 </div>
                                 <div className="grid gap-4">
                                    {group.options.map(opt => {
                                       const isSelected = selectedModifiers.some(m => m.optionId === opt.id);
                                       return (
                                          <ModifierButton 
                                            key={opt.id} 
                                            opt={opt} 
                                            isSelected={isSelected} 
                                            onClick={() => toggleModifier(group.id, group.name, opt.id, opt.name, opt.extraPrice, group.min, group.max)} 
                                          />
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <footer className="p-10 border-t bg-slate-50 flex items-center gap-6 shadow-2xl">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Item</p>
                        <p className="text-3xl font-black tracking-tighter text-slate-950">
                           R$ {(calculatePromoPrice(customizingProduct) + selectedModifiers.reduce((a,b)=>a+b.price, 0)).toFixed(2)}
                        </p>
                     </div>
                     <div className="flex gap-4">
                        {isWizardCategory(customizingProduct.category) ? (
                           <>
                              {stepIndex > 0 && (
                                 <button onClick={() => setStepIndex(prev => prev - 1)} className="p-6 bg-white border-2 border-slate-200 text-slate-400 rounded-[30px] font-black uppercase text-[10px] tracking-widest">Anterior</button>
                              )}
                              <button 
                                 onClick={() => {
                                    const min = customizingProduct.modifierGroups![stepIndex].min;
                                    const count = selectedModifiers.filter(m => m.groupId === customizingProduct.modifierGroups![stepIndex].id).length;
                                    if (count < min) { alert(`A etapa "${customizingProduct.modifierGroups![stepIndex].name}" exige ${min} seleção(ões).`); return; }
                                    if (stepIndex < customizingProduct.modifierGroups!.length - 1) setStepIndex(prev => prev + 1);
                                    else handleFinishCustomization();
                                 }}
                                 className="px-12 py-6 bg-slate-950 text-white rounded-[30px] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                              >
                                 {stepIndex < (customizingProduct.modifierGroups?.length || 0) - 1 ? 'Próximo' : 'Concluir'}
                              </button>
                           </>
                        ) : (
                           <button onClick={handleFinishCustomization} className="px-14 py-7 bg-slate-950 text-white rounded-[35px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                              <Plus size={20}/> Adicionar Pedido
                           </button>
                        )}
                     </div>
                  </footer>
               </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="fixed bottom-10 left-8 right-8 z-[200] max-w-lg mx-auto">
               <button onClick={() => setCheckoutStep('cart')} className="w-full bg-emerald-600 text-white p-7 rounded-[40px] shadow-2xl flex items-center justify-between border-b-8 border-emerald-800 active:scale-95 transition-all">
                  <div className="flex items-center gap-5">
                     <div className="bg-white/20 p-4 rounded-2xl"><ShoppingCart size={28}/></div>
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Meu Carrinho ({cart.length})</p>
                        <p className="text-3xl font-black tracking-tighter leading-none mt-1">R$ {cartTotal.toFixed(2)}</p>
                     </div>
                  </div>
                  <div className="bg-white/20 px-6 py-4 rounded-[25px] font-black uppercase text-[10px] tracking-widest">Revisar</div>
               </button>
            </div>
          )}
       </div>
    );
  }

  if (checkoutStep) {
    return (
      <div className="fixed inset-0 bg-slate-950/98 z-[600] flex items-end justify-center p-4 backdrop-blur-md">
         <div className="bg-white w-full max-w-xl rounded-[60px] h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <header className="p-10 border-b flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-3xl font-black tracking-tighter">Meu Pedido</h3>
               <button onClick={() => setCheckoutStep(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400"><X size={24}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar pb-32">
               <div className="space-y-6">
                  {cart.map(item => {
                     const prod = products.find(p => p.id === item.productId);
                     const combo = combos.find(c => c.id === item.productId);
                     return (
                        <div key={item.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                                    {item.isCombo ? <Sparkles size={24} className="text-yellow-500"/> : getCategoryIcon(prod?.category || Category.PRATOS)}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-slate-900 leading-tight text-lg">{item.isCombo ? combo?.name : prod?.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.isCombo ? 'Combo Promocional' : `QTD: ${item.quantity}`}</p>
                                 </div>
                              </div>
                              <span className="font-black text-xl text-slate-950 tracking-tighter">R$ {item.priceAtOrder.toFixed(2)}</span>
                           </div>
                           {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="pt-6 border-t border-slate-200/60 flex flex-wrap gap-2">
                                 {item.selectedModifiers.map(m => (
                                    <span key={m.optionId} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.optionName}</span>
                                 ))}
                              </div>
                           )}
                           <div className="flex justify-end">
                              <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-rose-500 font-black text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={16} className="inline mr-2"/>Remover</button>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* PREFERÊNCIAS DO PEDIDO (Sachês e Talheres) */}
               <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferências de Entrega / Consumo</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setWantsCondiments(!wantsCondiments)}
                        className={`p-6 rounded-[35px] border-2 transition-all flex flex-col items-center gap-4 ${wantsCondiments ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}
                     >
                        <Zap size={24} className={wantsCondiments ? 'fill-emerald-500' : ''}/>
                        <span className="font-black text-[10px] uppercase tracking-widest">Enviar Sachês?</span>
                        <div className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest ${wantsCondiments ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {wantsCondiments ? 'Sim, enviar' : 'Não, obrigado'}
                        </div>
                     </button>
                     <button 
                        onClick={() => setWantsCutlery(!wantsCutlery)}
                        className={`p-6 rounded-[35px] border-2 transition-all flex flex-col items-center gap-4 ${wantsCutlery ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}
                     >
                        <ForkIcon size={24} className={wantsCutlery ? 'text-indigo-600' : ''}/>
                        <span className="font-black text-[10px] uppercase tracking-widest">Enviar Talheres?</span>
                        <div className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest ${wantsCutlery ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {wantsCutlery ? 'Sim, enviar' : 'Não, obrigado'}
                        </div>
                     </button>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[40px] border border-slate-100 space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={14}/> Alguma Observação?</label>
                     <textarea 
                        value={observation} 
                        onChange={e => setObservation(e.target.value)}
                        className="w-full p-6 bg-white border border-slate-200 rounded-[30px] font-bold text-slate-900 h-24 resize-none outline-none focus:border-slate-950 transition-all"
                        placeholder="Ex: Sem cebola, caprichar no milho, etc..."
                     />
                  </div>
               </div>

               <div className="bg-slate-950 p-10 rounded-[50px] text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
                  <div className="flex justify-between items-center opacity-60"><span className="text-[10px] font-black uppercase tracking-widest">Subtotal Itens</span><span className="font-bold">R$ {cart.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0).toFixed(2)}</span></div>
                  {settings.serviceFeeEnabled && (orderType === OrderType.INDOOR || orderType === OrderType.BEACH) && (
                     <div className="flex justify-between items-center text-yellow-400"><span className="text-[10px] font-black uppercase tracking-widest">Taxa de Serviço ({settings.serviceFeePercent}%)</span><span className="font-bold">+ R$ {(cart.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0) * (settings.serviceFeePercent/100)).toFixed(2)}</span></div>
                  )}
                  {orderType === OrderType.DELIVERY && (
                     <div className="flex justify-between items-center text-emerald-400"><span className="text-[10px] font-black uppercase tracking-widest">Taxa de Entrega</span><span className="font-bold">+ R$ {settings.deliveryFee.toFixed(2)}</span></div>
                  )}
                  <div className="border-t border-white/10 pt-8 flex justify-between items-end">
                     <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total do Pedido</p><p className="text-6xl font-black tracking-tighter leading-none">R$ {cartTotal.toFixed(2)}</p></div>
                  </div>
               </div>
            </div>
            
            <footer className="p-10 bg-slate-50 border-t flex flex-col gap-4">
               <button onClick={handleCheckout} className="w-full py-8 bg-emerald-600 text-white rounded-[35px] font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Enviar para Produção</button>
            </footer>
         </div>
      </div>
    );
  }

  if (viewState === 'success') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 bg-slate-950 text-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full" />
         <div className="relative z-10 animate-in zoom-in-50 duration-700">
            <div className="w-32 h-32 bg-emerald-500 rounded-[45px] flex items-center justify-center mb-12 shadow-2xl mx-auto shadow-emerald-500/40"><Check size={64} strokeWidth={4} className="text-white"/></div>
            <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Sucesso!</h2>
            <p className="text-slate-400 font-medium text-lg mb-16 max-w-xs mx-auto">Seu pedido já foi enviado para a cozinha.</p>
            <button onClick={() => { setViewState('landing'); setObservation(''); setWantsCondiments(true); setWantsCutlery(true); }} className="bg-white text-slate-950 px-16 py-7 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Voltar ao Início</button>
         </div>
      </div>
    );
  }

  return null;
};

const ModifierButton: React.FC<{ opt: any; isSelected: boolean; onClick: () => void }> = ({ opt, isSelected, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-[35px] border-2 transition-all flex justify-between items-center group ${isSelected ? 'bg-slate-50 border-slate-950 shadow-lg' : 'bg-white border-slate-100 hover:border-slate-300'}`}
  >
     <div className="flex items-center gap-4 text-left">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
           {isSelected ? <Check size={20} strokeWidth={4}/> : <Plus size={20}/>}
        </div>
        <div>
           <span className={`font-black block leading-none transition-colors ${isSelected ? 'text-slate-950' : 'text-slate-900'}`}>{opt.name}</span>
           {isSelected && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><Zap size={10} fill="currentColor"/> Adicionado</span>}
        </div>
     </div>
     {opt.extraPrice > 0 && <span className={`font-black text-lg tracking-tighter transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>+ R$ {opt.extraPrice.toFixed(2)}</span>}
  </button>
);

const ModeCard: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; sub: string; color: string }> = ({ onClick, icon, label, sub, color }) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center p-8 rounded-[45px] transition-all active:scale-95 bg-white/5 border border-white/5 group overflow-hidden">
     <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
     <div className={`mb-6 p-5 rounded-[28px] text-white ${color} shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all`}>{icon}</div>
     <h4 className="text-xl font-black text-white tracking-tighter">{label}</h4>
     <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">{sub}</p>
  </button>
);

export default CustomerView;
