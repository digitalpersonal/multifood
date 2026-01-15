
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tab, TabStatus, Product, OrderItem, ItemStatus, PaymentMethod,
  Settings, Category, OrderType, Notification, Company, DeliveryInfo, PaymentStatus,
  Combo, Promotion, OperatingShift, MarmitaConfig
} from './types';
import { MOCK_PRODUCTS } from './constants';
import WaiterDashboard from './components/WaiterDashboard';
import CashierDashboard from './components/CashierDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import CustomerView from './components/CustomerView';
import { 
  Users, Receipt, BarChart3, User, Maximize, Minimize, 
  Store, ChevronRight, LayoutDashboard, Bike, Clock, Briefcase, Handshake
} from 'lucide-react';

const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'Multi Gastronomia', slug: 'multi-gastronomia', deliveryFee: 7.00 },
  { id: '2', name: 'Açaí Mania', slug: 'acai-mania', deliveryFee: 5.00 } // Novo restaurante de Açaí
];

const App: React.FC = () => {
  const [activeCompany, setActiveCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('active_company_id');
    return MOCK_COMPANIES.find(c => c.id === saved) || null;
  });

  // Novo estado para controlar o modo principal da aplicação
  const [appMode, setAppMode] = useState<'company_selection' | 'role_selection' | 'staff_mode' | 'customer_mode'>(
    activeCompany ? 'role_selection' : 'company_selection'
  );

  const [staffProfile, setStaffProfile] = useState<'waiter' | 'cashier' | 'admin'>('waiter'); // Perfil para modo funcionário
  const [isLocked, setIsLocked] = useState(false); // Mantém o estado de bloqueio da tela

  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('multifood_tabs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('multifood_products_v1');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [combos, setCombos] = useState<Combo[]>(() => {
    const saved = localStorage.getItem('multifood_combos_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('multifood_promotions_v1');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', companyId: '1', title: 'Combo Família', description: '3 Pratos + Sobremesa Grátis', badge: 'DESTAQUE', color: 'bg-rose-500' },
      { id: 'p2', companyId: '1', title: 'Frete Grátis Delivery', description: 'Somente para pedidos no turno da noite', badge: 'PROMO DELIVERY', color: 'bg-emerald-500' }
    ];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('multifood_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('multifood_settings_v1');
    const defaultSettings: Settings = {
      companyId: activeCompany?.id || '1',
      isOpen: true,
      operatingShifts: [
        { id: 's1', label: 'Almoço Delivery', startTime: '11:00', endTime: '15:00', enabled: true },
        { id: 's2', label: 'Jantar Delivery', startTime: '19:00', endTime: '03:00', enabled: true }
      ],
      marmitaConfig: {
        enabled: true,
        dailyMenu: 'O tempero caseiro que você já conhece.',
        ingredients: ['Arroz Branco', 'Feijão Carioca', 'Frango Grelhado', 'Purê de Batata', 'Salada Verde'],
        startTime: '10:30',
        endTime: '14:30',
        sizes: [
          { id: 'm1', label: 'P', price: 18.00 },
          { id: 'm2', label: 'M', price: 22.00 },
          { id: 'm3', label: 'G', price: 28.00 }
        ],
        modifierGroups: [
          {
            id: 'mg_marm_1',
            name: 'Opcionais Marmita',
            min: 0,
            max: 3,
            options: [
              { id: 'mo_marm_1', name: 'Ovo Frito Extra', extraPrice: 3.00 },
              { id: 'mo_marm_2', name: 'Farofa Extra', extraPrice: 1.50 },
              { id: 'mo_marm_3', name: 'Sem Cebola', extraPrice: 0 }
            ]
          }
        ]
      },
      serviceFeePercent: 10,
      serviceFeeEnabled: true,
      deliveryFee: activeCompany?.deliveryFee || 7.00,
      autoPrintReceipt: true,
      printKitchenVia: true,
      companyName: activeCompany?.name || 'MultiFood Admin',
      cnpj: '00.000.000/0001-00',
      enabledPaymentMethods: [PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD],
      enabledOrderTypes: [OrderType.BEACH, OrderType.INDOOR, OrderType.DELIVERY, OrderType.TAKEAWAY]
    };

    if (activeCompany?.id === '2') { // Ajusta as configurações padrão se a empresa ativa for o Açaí Mania
      defaultSettings.companyName = activeCompany.name;
      defaultSettings.deliveryFee = activeCompany.deliveryFee;
      defaultSettings.marmitaConfig.enabled = false;
      defaultSettings.serviceFeeEnabled = false;
    }

    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('multifood_tabs_v2', JSON.stringify(tabs));
    localStorage.setItem('multifood_products_v1', JSON.stringify(products));
    localStorage.setItem('multifood_combos_v1', JSON.stringify(combos));
    localStorage.setItem('multifood_promotions_v1', JSON.stringify(promotions));
    localStorage.setItem('multifood_notifications_v1', JSON.stringify(notifications));
    localStorage.setItem('multifood_settings_v1', JSON.stringify(settings));
    if (activeCompany) localStorage.setItem('active_company_id', activeCompany.id);

    // Ajusta o appMode quando a empresa ativa é definida ou removida
    if (activeCompany && appMode === 'company_selection') {
      setAppMode('role_selection');
    } else if (!activeCompany && appMode !== 'company_selection') {
      setAppMode('company_selection');
    }
  }, [tabs, products, combos, promotions, notifications, settings, activeCompany, appMode]);

  const isWithinShifts = useMemo(() => {
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return settings.operatingShifts.some(shift => {
      if (!shift.enabled) return false;
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const [currH, currM] = currentTimeStr.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      const curr = currH * 60 + currM;
      return start <= end ? (curr >= start && curr <= end) : (curr >= start || curr <= end);
    });
  }, [settings.operatingShifts]);

  const companyTabs = useMemo(() => tabs.filter(t => t.companyId === activeCompany?.id), [tabs, activeCompany]);
  const companyProducts = useMemo(() => products.filter(p => p.companyId === activeCompany?.id), [products, activeCompany]);
  const companyCombos = useMemo(() => combos.filter(c => c.companyId === activeCompany?.id), [combos, activeCompany]);
  const companyPromotions = useMemo(() => promotions.filter(p => p.companyId === activeCompany?.id), [promotions, activeCompany]);
  const companyNotifications = useMemo(() => notifications.filter(n => n.companyId === activeCompany?.id), [notifications, activeCompany]);

  const handleOpenOrder = (type: OrderType, customerName: string, ident: string | DeliveryInfo) => {
    if (!activeCompany) return;
    const newTab: Tab = {
      id: Date.now().toString(),
      companyId: activeCompany.id,
      orderType: type,
      customerName,
      items: [],
      status: TabStatus.OPEN,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date().toISOString(),
      subtotal: 0,
      serviceFee: 0,
      total: 0,
      amountPaid: 0,
      peopleCount: 1,
      tentNumber: typeof ident === 'string' ? ident : undefined,
      deliveryInfo: typeof ident === 'object' ? ident as DeliveryInfo : undefined
    };
    setTabs(prev => [...prev, newTab]);
    return newTab.id;
  };

  const handleAddPayment = (tabId: string, amount: number, method: PaymentMethod) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        const newPaidAmount = tab.amountPaid + amount;
        const isFullyPaid = newPaidAmount >= tab.total - 0.01;
        return {
          ...tab,
          amountPaid: newPaidAmount,
          paymentMethod: method,
          status: isFullyPaid ? TabStatus.CLOSED : TabStatus.OPEN,
          paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          closedAt: isFullyPaid ? new Date().toISOString() : undefined
        };
      }
      return tab;
    }));
  };

  const handleUpdatePeopleCount = (tabId: string, count: number) => {
    setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, peopleCount: Math.max(1, count) } : tab));
  };

  const addItemsToTab = (tabId: string, newItems: OrderItem[]) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        const updatedItems = [...tab.items, ...newItems];
        const subtotal = updatedItems.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0);
        let fee = tab.orderType === OrderType.DELIVERY ? settings.deliveryFee : (settings.serviceFeeEnabled ? subtotal * (settings.serviceFeePercent / 100) : 0);
        return { ...tab, items: updatedItems, subtotal, serviceFee: fee, total: subtotal + fee };
      }
      return tab;
    }));
  };

  const updateItemStatus = (tabId: string, itemId: string, status: ItemStatus) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, items: tab.items.map(i => i.id === itemId ? { ...i, status } : i) };
      }
      return tab;
    }));
  };

  // Renderização condicional baseada no appMode
  if (appMode === 'company_selection') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-yellow-400 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20"><Store className="text-slate-950" size={40} /></div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">MultiFood</h1>
        <p className="text-slate-500 font-medium mb-12">Selecione o estabelecimento de trabalho</p>
        <div className="grid gap-4 w-full max-w-sm">
          {MOCK_COMPANIES.map(company => (
            <button key={company.id} onClick={() => setActiveCompany(company)} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] text-left hover:border-yellow-400 group transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white group-hover:text-yellow-400">{company.name}</span>
                <ChevronRight className="text-slate-600 group-hover:text-yellow-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (appMode === 'role_selection') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-yellow-400 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20"><Store className="text-slate-950" size={40} /></div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">{activeCompany?.name}</h1>
        <p className="text-slate-500 font-medium mb-12">Bem-vindo(a)! Como você irá acessar?</p>
        <div className="grid gap-4 w-full max-w-sm">
          <button onClick={() => setAppMode('customer_mode')} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] text-left hover:border-yellow-400 group transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <User className="text-white group-hover:text-yellow-400" size={24} />
                <span className="text-xl font-bold text-white group-hover:text-yellow-400">Sou Cliente</span>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-yellow-400" />
            </div>
          </button>
          <button onClick={() => setAppMode('staff_mode')} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] text-left hover:border-yellow-400 group transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Briefcase className="text-white group-hover:text-yellow-400" size={24} />
                <span className="text-xl font-bold text-white group-hover:text-yellow-400">Sou Funcionário</span>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-yellow-400" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (appMode === 'customer_mode') {
    return (
      <CustomerView 
        isWithinShifts={isWithinShifts} 
        tabs={companyTabs.filter(t => t.status === TabStatus.OPEN)} 
        products={companyProducts} 
        combos={companyCombos} 
        promotions={companyPromotions} 
        isLocked={isLocked} 
        onLock={() => setIsLocked(!isLocked)} 
        onAddItems={addItemsToTab} 
        onOpenOrder={(type, name, ident) => handleOpenOrder(type, name, ident)} 
        settings={settings}
        onReturnToRoleSelection={() => setAppMode('role_selection')} // Nova prop
      />
    );
  }

  // Se for staff_mode, renderiza os dashboards da equipe com o cabeçalho existente
  return (
    <div className={`min-h-screen flex flex-col ${!isLocked && staffProfile !== 'customer' ? 'pt-16 pb-20 md:pb-0' : ''}`}>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveCompany(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><Store size={20} /></button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <span className="font-black text-slate-900 tracking-tight">{activeCompany.name}</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${settings.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${settings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {settings.isOpen ? 'Online' : 'Offline'}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <NavBtn active={staffProfile === 'waiter'} onClick={() => setStaffProfile('waiter')} icon={<LayoutDashboard size={18}/>} label="Operacional" />
          <NavBtn active={staffProfile === 'cashier'} onClick={() => setStaffProfile('cashier')} icon={<Receipt size={18}/>} label="Caixa" />
          <NavBtn active={staffProfile === 'admin'} onClick={() => setStaffProfile('admin')} icon={<BarChart3 size={18}/>} label="Gestão" />
          {/* <NavBtn active={staffProfile === 'customer'} onClick={() => setStaffProfile('customer')} icon={<User size={18}/>} label="Menu Digital" /> */}
          <button onClick={() => setAppMode('customer_mode')} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-500 hover:text-slate-700">
            <User size={18}/>
            <span className="font-bold text-sm">Menu Digital</span>
          </button>
        </div>

        <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-xl ${isLocked ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:bg-slate-50'}`}><Maximize size={20} /></button>
      </header>

      <main className="flex-1 p-4 md:max-w-7xl md:mx-auto w-full">
        {staffProfile === 'waiter' && <WaiterDashboard tabs={companyTabs.filter(t => t.status === TabStatus.OPEN)} products={companyProducts} notifications={companyNotifications} onAddItems={addItemsToTab} onUpdatePeopleCount={handleUpdatePeopleCount} onOpenTab={(t, n, w, l) => handleOpenOrder(l as any, n, t)} onClearNotification={id => setNotifications(prev => prev.filter(n => n.id !== id))} />}
        {staffProfile === 'cashier' && <CashierDashboard tabs={companyTabs} products={companyProducts} settings={settings} onUpdatePeopleCount={handleUpdatePeopleCount} onAddPayment={handleAddPayment} onCloseTab={() => {}} />}
        {staffProfile === 'admin' && (
          <AdminDashboard 
            tabs={companyTabs} settings={settings} products={companyProducts} combos={companyCombos} promotions={companyPromotions}
            onUpdateProducts={setProducts} onUpdateCombos={setCombos} onUpdatePromotions={setPromotions} onUpdateSettings={setSettings} 
            onResetData={() => setTabs([])} onUpdateItemStatus={updateItemStatus} onReprintItem={() => {}} onReprintReceipt={id => {}}
            onAddItems={addItemsToTab} onOpenOrder={handleOpenOrder} onAddPayment={handleAddPayment} onUpdatePeopleCount={handleUpdatePeopleCount}
            isWithinShifts={isWithinShifts}
          />
        )}
        {/* Removido CustomerView do render principal do staff, agora é um modo separado */}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 z-50">
        <MobileNavBtn active={staffProfile === 'waiter'} onClick={() => setStaffProfile('waiter')} icon={<LayoutDashboard size={24}/>} label="Pedidos" />
        <MobileNavBtn active={staffProfile === 'cashier'} onClick={() => setStaffProfile('cashier')} icon={<Receipt size={24}/>} label="Caixa" />
        <MobileNavBtn active={staffProfile === 'admin'} onClick={() => setStaffProfile('admin')} icon={<BarChart3 size={24}/>} label="Admin" />
        {/* Removido MobileNavBtn para CustomerView, agora é um modo separado */}
        <MobileNavBtn active={appMode === 'customer_mode'} onClick={() => setAppMode('customer_mode')} icon={<User size={24}/>} label="Menu" />
      </nav>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}>{icon}<span className="font-bold text-sm">{label}</span></button>
);

const MobileNavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${active ? 'text-yellow-600' : 'text-slate-400'}`}>{icon}<span className="text-[10px] font-bold uppercase">{label}</span></button>
);

export default App;
