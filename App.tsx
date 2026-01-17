
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tab, TabStatus, Product, OrderItem, ItemStatus, PaymentMethod,
  Settings, Category, OrderType, Notification, Company, DeliveryInfo, PaymentStatus,
  Combo, Promotion, OperatingShift, MarmitaConfig, PaymentLog
} from './types';
import { MOCK_PRODUCTS } from './constants';
import WaiterDashboard from './components/WaiterDashboard';
import CashierDashboard from './components/CashierDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import CustomerView from './components/CustomerView';
import { 
  Store, ChevronRight, LayoutDashboard, Receipt, Settings2, 
  MessageCircle, Star, Sparkles, ChevronLeft, Maximize, Briefcase, Smartphone
} from 'lucide-react';

const App: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('mf_companies_v5');
    const defaultCompanies = [
      { 
        id: '1', 
        name: 'Multi Gastronomia', 
        logo: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?q=80&w=500&auto=format&fit=crop',
        slug: 'multi-gastronomia', 
        deliveryFee: 7.00, 
        createdAt: new Date().toISOString() 
      },
      { 
        id: '2', 
        name: 'Açaí Mania', 
        logo: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=500&auto=format&fit=crop',
        slug: 'acai-mania', 
        deliveryFee: 5.00, 
        createdAt: new Date().toISOString() 
      }
    ];
    return saved ? JSON.parse(saved) : defaultCompanies;
  });

  const [activeCompany, setActiveCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('active_company_id_v5');
    return companies.find(c => c.id === saved) || null;
  });

  const [appMode, setAppMode] = useState<'home' | 'master_login' | 'super_admin' | 'staff_mode' | 'customer_mode'>(() => {
    if (localStorage.getItem('is_master_logged_v5')) return 'super_admin';
    return 'home';
  });

  const [staffProfile, setStaffProfile] = useState<'waiter' | 'cashier' | 'admin'>('waiter');
  const [isLocked, setIsLocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('mf_tabs_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mf_products_v5');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [combos, setCombos] = useState<Combo[]>(() => {
    const saved = localStorage.getItem('mf_combos_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('mf_promotions_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(`mf_settings_v5_${activeCompany?.id || 'default'}`);
    const defaultSettings: Settings = {
      companyId: activeCompany?.id || '',
      isOpen: true,
      openingTime: '10:00',
      closingTime: '23:00',
      operatingShifts: [],
      marmitaConfig: {
        enabled: true,
        dailyMenu: 'O tempero caseiro que você já conhece.',
        ingredients: ['Arroz', 'Feijão', 'Proteína', 'Acompanhamento', 'Salada'],
        startTime: '10:30',
        endTime: '15:30',
        sizes: [{ id: 'm1', label: 'Média', price: 18.00 }, { id: 'm2', label: 'Grande', price: 24.00 }],
        modifierGroups: []
      },
      serviceFeePercent: 10,
      serviceFeeEnabled: true,
      deliveryFee: activeCompany?.deliveryFee || 0.00,
      autoPrintReceipt: true,
      printKitchenVia: true,
      companyName: activeCompany?.name || 'MultiFood',
      cnpj: '00.000.000/0001-00',
      whatsapp: '85900000000',
      address: 'Rua Principal, 123',
      enabledPaymentMethods: [PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD],
      enabledOrderTypes: [OrderType.INDOOR, OrderType.DELIVERY, OrderType.TAKEAWAY]
    };
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('mf_companies_v5', JSON.stringify(companies));
    localStorage.setItem('mf_tabs_v5', JSON.stringify(tabs));
    localStorage.setItem('mf_products_v5', JSON.stringify(products));
    localStorage.setItem('mf_combos_v5', JSON.stringify(combos));
    localStorage.setItem('mf_promotions_v5', JSON.stringify(promotions));
    if (activeCompany) {
      localStorage.setItem('active_company_id_v5', activeCompany.id);
      localStorage.setItem(`mf_settings_v5_${activeCompany.id}`, JSON.stringify(settings));
    }
  }, [companies, activeCompany, tabs, products, combos, promotions, settings]);

  const isStoreOpen = (compId: string) => {
    const compSettingsStr = localStorage.getItem(`mf_settings_v5_${compId}`);
    if (!compSettingsStr) return true;
    const s: Settings = JSON.parse(compSettingsStr);
    if (!s.isOpen) return false;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [oH, oM] = s.openingTime.split(':').map(Number);
    const [cH, cM] = s.closingTime.split(':').map(Number);
    const oT = oH * 60 + oM;
    let cT = cH * 60 + cM;
    if (cT < oT) {
      return currentMin >= oT || currentMin <= cT;
    }
    return currentMin >= oT && currentMin <= cT;
  };

  const addItemsToTab = (tabId: string, newItems: OrderItem[], observation?: string, wantsCondiments?: boolean, wantsCutlery?: boolean) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        const updatedItems = [...tab.items, ...newItems];
        const subtotal = updatedItems.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0);
        const serviceFee = (settings.serviceFeeEnabled && (tab.orderType === OrderType.INDOOR || tab.orderType === OrderType.BEACH)) ? subtotal * (settings.serviceFeePercent / 100) : 0;
        const deliveryFee = tab.orderType === OrderType.DELIVERY ? settings.deliveryFee : 0;
        
        return { 
          ...tab, 
          items: updatedItems, 
          subtotal, 
          serviceFee, 
          total: subtotal + serviceFee + deliveryFee,
          observation: observation || tab.observation,
          wantsCondiments: wantsCondiments !== undefined ? wantsCondiments : tab.wantsCondiments,
          wantsCutlery: wantsCutlery !== undefined ? wantsCutlery : tab.wantsCutlery
        };
      }
      return tab;
    }));
  };

  const handleOpenOrder = (type: OrderType, name: string, ident: string | DeliveryInfo) => {
    if (!activeCompany) return;
    const newTab: Tab = {
      id: Date.now().toString(),
      companyId: activeCompany.id,
      orderType: type,
      customerName: name,
      items: [],
      status: TabStatus.OPEN,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date().toISOString(),
      subtotal: 0,
      serviceFee: 0,
      total: 0,
      amountPaid: 0,
      paymentLogs: [],
      tentNumber: typeof ident === 'string' ? ident : undefined,
      deliveryInfo: typeof ident === 'object' ? ident as DeliveryInfo : undefined,
    };
    setTabs(prev => [...prev, newTab]);
    return newTab.id;
  };

  const handleAddPayment = (tabId: string, amount: number, method: PaymentMethod) => {
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        const totalPaid = t.amountPaid + amount;
        const isPaid = totalPaid >= t.total - 0.01;
        return {
          ...t,
          amountPaid: totalPaid,
          paymentLogs: [...t.paymentLogs, { id: Math.random().toString(), amount, method, timestamp: new Date().toISOString() }],
          status: isPaid ? TabStatus.CLOSED : TabStatus.OPEN,
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          closedAt: isPaid ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));
  };

  if (appMode === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <section className="h-[75vh] relative overflow-hidden flex items-center justify-center">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Hero Background"/>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-50" />
          
          <div className="relative z-10 text-center px-6 mt-[-10vh]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 mb-10 animate-pulse">
              <Sparkles size={18} className="text-yellow-400 fill-current"/>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Gastronomia Digital de Elite</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              Multi<span className="text-yellow-400">Food</span>
            </h1>
            <p className="text-white/80 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Acesse os melhores cardápios e faça seu pedido em segundos. 
              Sabor, praticidade e tecnologia em um só lugar.
            </p>
          </div>
        </section>

        <main className="flex-1 px-6 md:px-20 -mt-40 relative z-20 pb-40">
           <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {companies.map(company => {
                const isOpen = isStoreOpen(company.id);
                const compSettingsStr = localStorage.getItem(`mf_settings_v5_${company.id}`);
                const compSettings: Settings | null = compSettingsStr ? JSON.parse(compSettingsStr) : null;
                const whats = compSettings?.whatsapp || "85900000000";
                
                const coverImage = company.id === '1' 
                  ? "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop" 
                  : "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=2070&auto=format&fit=crop"; 

                return (
                  <div key={company.id} className="group relative">
                    <a 
                      href={`https://wa.me/${whats}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-6 right-6 z-30 p-4 bg-emerald-500 text-white rounded-[24px] shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white/20 backdrop-blur-sm"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={22} fill="currentColor" />
                    </a>

                    <button 
                      onClick={() => { setActiveCompany(company); setAppMode('customer_mode'); }}
                      className="w-full bg-white rounded-[60px] overflow-hidden shadow-2xl border border-slate-100 hover:-translate-y-4 transition-all duration-700 flex flex-col text-left group"
                    >
                      <div className="h-60 w-full relative overflow-hidden">
                        <img src={coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Restaurante Cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-6 left-8">
                           <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-lg ${isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                             {isOpen ? '● Aberto agora' : '○ Fechado'}
                           </span>
                        </div>
                      </div>

                      <div className="p-10 relative pt-16">
                        <div className="absolute -top-14 left-10 w-28 h-28 bg-white rounded-[35px] shadow-2xl flex items-center justify-center font-black text-5xl text-slate-900 border-8 border-slate-50 group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors duration-500 overflow-hidden">
                          {company.logo ? <img src={company.logo} className="w-full h-full object-cover" alt="Logo" /> : company.name.charAt(0)}
                        </div>

                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{company.name}</h3>
                          <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-xl font-black text-xs">
                            <Star size={16} fill="currentColor"/> 4.9
                          </div>
                        </div>

                        <p className="text-slate-400 font-medium text-base mb-10 line-clamp-2 leading-relaxed">
                          Ingredientes selecionados, preparo artesanal e o melhor atendimento da região. Peça agora!
                        </p>

                        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Taxa de Entrega</span>
                              <span className="font-black text-2xl text-slate-900 tracking-tighter">R$ {company.deliveryFee.toFixed(2)}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-950 transition-colors">Cardápio</span>
                              <div className="p-5 bg-slate-950 text-white rounded-[28px] group-hover:bg-yellow-400 group-hover:text-slate-950 transition-all shadow-xl group-hover:rotate-6">
                                <ChevronRight size={24} strokeWidth={3}/>
                              </div>
                           </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
           </div>
        </main>

        <footer className="bg-slate-950 py-32 px-6 text-center text-white overflow-hidden relative">
           <img 
             src="https://images.unsplash.com/photo-1550966842-2849a221985b?q=80&w=2070&auto=format&fit=crop" 
             className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-luminosity"
             alt=""
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/50" />
           
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-yellow-400/5 blur-[150px] rounded-full" />
           
           <div className="max-w-4xl mx-auto space-y-20 relative z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                   <div className="w-14 h-14 bg-white/5 rounded-[22px] flex items-center justify-center text-yellow-400 border border-white/10 shadow-2xl">
                      <Briefcase size={28}/>
                   </div>
                   <h2 className="text-3xl font-black tracking-tighter uppercase">Expanda seu Negócio</h2>
                </div>
                <p className="text-slate-400 font-medium text-xl max-w-xl mx-auto leading-relaxed">
                  Transforme seu restaurante em uma potência digital com a MultiFood. Tecnologia de ponta para gestão inteligente.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
                  <a 
                    href="https://wa.me/35991048020" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-8 py-4 rounded-3xl border border-emerald-500/20 transition-all active:scale-95 group"
                  >
                    <MessageCircle size={20} className="group-hover:rotate-12 transition-transform"/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Falar com o Desenvolvedor</span>
                  </a>
                  <button 
                    onClick={() => alert('Para instalar o aplicativo:\n1. No Safari (iOS): toque em compartilhar e "Adicionar à Tela de Início"\n2. No Chrome (Android): toque nos três pontos e "Instalar Aplicativo"')}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-3xl border border-white/10 transition-all active:scale-95 group"
                  >
                    <Smartphone size={20} className="group-hover:-translate-y-1 transition-transform"/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Instalar no Celular (PWA)</span>
                  </button>
                </div>
              </div>

              <div className="pt-24 border-t border-white/5 space-y-4">
                 <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.3em]">Desenvolvido por Multiplus - Sistemas Inteligentes</p>
                 <p className="text-slate-600 font-black text-[11px] uppercase tracking-[0.5em]">Silvio T. de Sá Filho</p>
                 <div className="pt-8">
                   <button 
                    onClick={() => setAppMode('master_login')} 
                    className="text-slate-800 text-[8px] font-black uppercase tracking-[0.8em] opacity-5 hover:opacity-100 transition-opacity"
                   >
                     ADMINISTRATIVO RESTRITO
                   </button>
                 </div>
              </div>
           </div>
        </footer>
      </div>
    );
  }

  if (appMode === 'master_login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[60px] w-full max-w-md shadow-2xl relative overflow-hidden">
           <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/20 blur-[60px] rounded-full" />
           <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight text-center relative z-10">Login MultiFood</h2>
           <div className="space-y-4 mb-8 relative z-10">
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 transition-all outline-none" placeholder="E-mail Administrativo"/>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-slate-900 transition-all outline-none" placeholder="Senha de Acesso"/>
           </div>
           {loginError && <p className="text-rose-500 font-bold text-sm mb-6 text-center">{loginError}</p>}
           <button onClick={() => { if(adminEmail==='digitalpersonal@gmail.com' && adminPassword==='Mld3602#?+') { setAppMode('super_admin'); localStorage.setItem('is_master_logged_v5', 'true'); } else { setLoginError('Credenciais Inválidas'); } }} className="w-full bg-slate-950 text-white py-7 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Autenticar Sistema</button>
           <button onClick={() => setAppMode('home')} className="w-full mt-6 text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-40 hover:opacity-100 transition-opacity">Voltar para Início</button>
        </div>
      </div>
    );
  }

  if (appMode === 'super_admin') {
     return (
       <div className="min-h-screen bg-slate-50 p-10">
          <header className="flex justify-between items-center mb-16">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-950 text-white rounded-2xl"><Settings2 size={24}/></div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Painel Master MultiFood</h2>
             </div>
             <button onClick={() => { localStorage.removeItem('is_master_logged_v5'); setAppMode('home'); }} className="bg-rose-50 text-rose-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm hover:bg-rose-600 hover:text-white transition-all">Encerrar Sessão</button>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {companies.map(c => (
               <div key={c.id} className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 group hover:-translate-y-2 transition-transform">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl mb-8 flex items-center justify-center font-black text-4xl text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all overflow-hidden">
                    {c.logo ? <img src={c.logo} className="w-full h-full object-cover" alt="Logo" /> : c.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{c.name}</h3>
                  <button onClick={() => { setActiveCompany(c); setAppMode('staff_mode'); }} className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Acessar Unidade</button>
               </div>
             ))}
          </div>
       </div>
     );
  }

  if (appMode === 'customer_mode' && activeCompany) {
    return (
      <CustomerView 
        isWithinShifts={isStoreOpen(activeCompany.id)}
        tabs={tabs.filter(t => t.companyId === activeCompany.id)} 
        products={products.filter(p => p.companyId === activeCompany.id)} 
        combos={combos.filter(c => c.companyId === activeCompany.id)}
        promotions={promotions.filter(p => p.companyId === activeCompany.id)} 
        isLocked={isLocked} onLock={() => setIsLocked(!isLocked)} 
        onAddItems={addItemsToTab} 
        onOpenOrder={handleOpenOrder} 
        settings={settings}
        onUpdatePaymentStatus={() => {}}
        onReturnToRoleSelection={() => { setActiveCompany(null); setAppMode('home'); }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${!isLocked ? 'pt-20' : ''}`}>
      {!isLocked && (
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 h-20 flex items-center justify-between px-10 z-[100] backdrop-blur-md bg-opacity-90">
          <div className="flex items-center gap-4">
            <button onClick={() => setAppMode('super_admin')} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"><ChevronLeft size={24} /></button>
            <span className="font-black text-slate-900 text-2xl tracking-tighter">{activeCompany?.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <NavBtn active={staffProfile === 'waiter'} onClick={() => setStaffProfile('waiter')} icon={<LayoutDashboard size={18}/>} label="Pedidos" />
            <NavBtn active={staffProfile === 'cashier'} onClick={() => setStaffProfile('cashier')} icon={<Receipt size={18}/>} label="Caixa" />
            <NavBtn active={staffProfile === 'admin'} onClick={() => setStaffProfile('admin')} icon={<Settings2 size={18}/>} label="Admin" />
          </div>
          <button onClick={() => setIsLocked(!isLocked)} className="p-3 bg-yellow-400 text-slate-950 rounded-2xl shadow-lg"><Maximize size={22}/></button>
        </header>
      )}

      <main className={`flex-1 w-full ${isLocked ? 'p-0' : 'p-10'}`}>
        {staffProfile === 'waiter' && <WaiterDashboard tabs={tabs.filter(t => t.companyId === activeCompany?.id && t.status === TabStatus.OPEN)} products={products.filter(p => p.companyId === activeCompany?.id)} notifications={[]} onAddItems={addItemsToTab} onUpdatePeopleCount={()=>{}} onOpenTab={(t, n, w, type) => handleOpenOrder(type as any, n, t)} onClearNotification={()=>{}} />}
        {staffProfile === 'cashier' && <CashierDashboard tabs={tabs.filter(t => t.companyId === activeCompany?.id)} products={products.filter(p => p.companyId === activeCompany?.id)} settings={settings} onUpdatePeopleCount={()=>{}} onAddPayment={handleAddPayment} />}
        {staffProfile === 'admin' && <AdminDashboard tabs={tabs.filter(t => t.companyId === activeCompany?.id)} settings={settings} products={products.filter(p => p.companyId === activeCompany?.id)} combos={combos.filter(c => c.companyId === activeCompany?.id)} promotions={promotions.filter(p => p.companyId === activeCompany?.id)} onUpdateProducts={setProducts} onUpdateCombos={setCombos} onUpdatePromotions={setPromotions} onUpdateSettings={setSettings} onResetData={()=>{}} onUpdateItemStatus={()=>{}} onReprintItem={()=>{}} onReprintReceipt={()=>{}} onAddItems={addItemsToTab} onOpenOrder={handleOpenOrder} onAddPayment={handleAddPayment} onUpdatePeopleCount={()=>{}} isWithinShifts={true} />}
      </main>

      {!isLocked && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 flex items-center justify-around z-[100] px-4">
          <MobileNavBtn active={staffProfile === 'waiter'} onClick={() => setStaffProfile('waiter')} icon={<LayoutDashboard size={24}/>} label="Pedidos" />
          <MobileNavBtn active={staffProfile === 'cashier'} onClick={() => setStaffProfile('cashier')} icon={<Receipt size={24}/>} label="Caixa" />
          <MobileNavBtn active={staffProfile === 'admin'} onClick={() => setStaffProfile('admin')} icon={<Settings2 size={24}/>} label="Admin" />
        </nav>
      )}
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${active ? 'bg-white shadow-xl text-slate-950 border border-slate-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{icon}<span>{label}</span></button>
);

const MobileNavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all ${active ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
);

export default App;
