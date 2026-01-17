
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Tab, TabStatus, Settings, Product, Category, PaymentMethod, 
  ItemStatus, OrderType, OrderItem, DeliveryInfo, Combo, Promotion, 
  ModifierGroup, ModifierOption, Transaction, TransactionType, InventoryItem, Closure, PromotionSchedule, PromotionType 
} from '../types';
import { 
  BarChart3, Settings as SettingsIcon, Bell, DollarSign, Utensils, Printer, 
  PlusCircle, Edit, Trash, ChevronRight, Check, X, Clock, AlertTriangle, Package, CalendarDays, Soup, ListChecks, Bike, Info, Users, Menu, Store, Maximize, Loader2, CheckCircle2, MapPin, Umbrella, ShoppingCart, ToggleLeft, ToggleRight, Layout, Truck, Image as ImageIcon, Search, Plus, Phone, Upload, Monitor, Smartphone, Terminal, Copy, TrendingUp, TrendingDown, Wallet, Briefcase, FileText, ArrowUpRight, ArrowDownRight, Layers, Boxes, ShieldCheck, Activity, Calendar, Camera, Pizza, Receipt, Zap, IceCream, UtensilsCrossed, Coffee, Layers2, Sparkles, Tag, Percent, AlertCircle
} from 'lucide-react';

interface Props {
  tabs: Tab[];
  settings: Settings;
  products: Product[];
  combos: Combo[];
  promotions: Promotion[];
  onUpdateProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onUpdateCombos: React.Dispatch<React.SetStateAction<Combo[]>>;
  onUpdatePromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  onUpdateSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onResetData: () => void;
  onUpdateItemStatus: (tabId: string, itemId: string, status: ItemStatus) => void;
  onReprintItem: (tabId: string, itemId: string) => void;
  onReprintReceipt: (tabId: string) => void;
  onAddItems: (tabId: string, items: OrderItem[]) => void;
  onOpenOrder: (type: OrderType, name: string, ident: string | DeliveryInfo, method?: PaymentMethod) => string | undefined;
  onAddPayment: (tabId: string, amount: number, method: PaymentMethod) => void;
  onUpdatePeopleCount: (tabId: string, count: number) => void;
  isWithinShifts: boolean;
}

export const AdminDashboard: React.FC<Props> = ({
  tabs, settings, products, combos, promotions,
  onUpdateProducts, onUpdateCombos, onUpdatePromotions, onUpdateSettings,
  onResetData, onUpdateItemStatus, onReprintItem, onReprintReceipt,
  onAddItems, onOpenOrder, onAddPayment, onUpdatePeopleCount,
  isWithinShifts
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'combos' | 'promos' | 'settings'>('overview');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingCombo, setIsEditingCombo] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [isEditingPromo, setIsEditingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [searchProduct, setSearchProduct] = useState('');

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const comboFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const optimizeImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsOptimizing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
          } else {
            if (height > maxWidth) { width *= maxWidth / height; height = maxWidth; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Canvas context error");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
          setIsOptimizing(false);
        };
      };
    });
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const optimized = await optimizeImage(file, 600, 0.6);
      setEditingProduct({ ...editingProduct, image: optimized });
    }
  };

  const handleComboImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCombo) {
      const optimized = await optimizeImage(file, 600, 0.6);
      setEditingCombo({ ...editingCombo, image: optimized });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimized = await optimizeImage(file, 300, 0.7);
      onUpdateSettings(prev => ({ ...prev, logo: optimized }));
    }
  };

  const toggleOrderType = (type: OrderType) => {
    const current = settings.enabledOrderTypes || [];
    let updated;
    if (current.includes(type)) {
      updated = current.filter(t => t !== type);
    } else {
      updated = [...current, type];
    }
    onUpdateSettings({ ...settings, enabledOrderTypes: updated });
  };

  const handleSaveCombo = () => {
    if (!editingCombo) return;
    if (editingCombo.id.startsWith('temp_')) {
      const newCombo = { ...editingCombo, id: Math.random().toString(36).substr(2, 9) };
      onUpdateCombos(prev => [...prev, newCombo]);
    } else {
      onUpdateCombos(prev => prev.map(c => c.id === editingCombo.id ? editingCombo : c));
    }
    setIsEditingCombo(false);
    setEditingCombo(null);
  };

  const handleSavePromo = () => {
    if (!editingPromo) return;
    if (editingPromo.id.startsWith('temp_')) {
      const newPromo = { ...editingPromo, id: Math.random().toString(36).substr(2, 9) };
      onUpdatePromotions(prev => [...prev, newPromo]);
    } else {
      onUpdatePromotions(prev => prev.map(p => p.id === editingPromo.id ? editingPromo : p));
    }
    setIsEditingPromo(false);
    setEditingPromo(null);
  };

  const toggleProductInCombo = (productId: string) => {
    if (!editingCombo) return;
    const currentIds = editingCombo.productIds || [];
    const updatedIds = currentIds.includes(productId) 
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId];
    setEditingCombo({ ...editingCombo, productIds: updatedIds });
  };

  const applyTemplate = (type: 'PIZZA' | 'ACAI' | 'MARMITA' | 'SUCO') => {
    if (!editingProduct) return;
    let groups: ModifierGroup[] = [];
    let cat = editingProduct.category;

    if (type === 'PIZZA') {
      cat = Category.PIZZAS;
      groups = [
        { id: 'pz1_'+Date.now(), name: 'Escolha os Sabores (Até 2)', min: 1, max: 2, options: [{ id: 'opt1', name: 'Calabresa', extraPrice: 0 }, { id: 'opt2', name: 'Mussarela', extraPrice: 0 }] },
        { id: 'pz2_'+Date.now(), name: 'Borda Recheada', min: 0, max: 1, options: [{ id: 'opt3', name: 'Borda de Catupiry', extraPrice: 10 }, { id: 'opt4', name: 'Borda de Cheddar', extraPrice: 12 }] }
      ];
    } else if (type === 'ACAI') {
      cat = Category.ACAI;
      groups = [
        { id: 'ac1_'+Date.now(), name: '1. Escolha a Base', min: 1, max: 1, options: [{ id: 'opt1', name: 'Açaí Tradicional', extraPrice: 0 }, { id: 'opt2', name: 'Açaí com Cupuaçu', extraPrice: 0 }] },
        { id: 'ac2_'+Date.now(), name: '2. Frutas (Grátis)', min: 0, max: 3, options: [{ id: 'opt3', name: 'Banana', extraPrice: 0 }, { id: 'opt4', name: 'Morango', extraPrice: 0 }] },
        { id: 'ac3_'+Date.now(), name: '3. Cremes e Coberturas', min: 0, max: 2, options: [{ id: 'opt5', name: 'Leite Ninho', extraPrice: 3 }, { id: 'opt6', name: 'Nutella', extraPrice: 7 }] }
      ];
    } else if (type === 'MARMITA') {
      cat = Category.MARMITAS;
      groups = [
        { id: 'mr1_'+Date.now(), name: 'Proteína Principal', min: 1, max: 1, options: [{ id: 'opt1', name: 'Frango Grelhado', extraPrice: 0 }, { id: 'opt2', name: 'Carne de Panela', extraPrice: 5 }] },
        { id: 'mr2_'+Date.now(), name: 'Acompanhamentos (Escolha 3)', min: 3, max: 3, options: [{ id: 'opt3', name: 'Arroz Branco', extraPrice: 0 }, { id: 'opt4', name: 'Feijão Carioca', extraPrice: 0 }, { id: 'opt5', name: 'Purê de Batata', extraPrice: 0 }, { id: 'opt6', name: 'Macarrão', extraPrice: 0 }] }
      ];
    } else if (type === 'SUCO') {
      cat = Category.BEBIDAS;
      groups = [
        { id: 'sc1_'+Date.now(), name: 'Base do Suco', min: 1, max: 1, options: [{ id: 'opt1', name: 'Com Água', extraPrice: 0 }, { id: 'opt2', name: 'Com Leite', extraPrice: 3.50 }] },
        { id: 'sc2_'+Date.now(), name: 'Opção de Adoçamento', min: 1, max: 1, options: [{ id: 'opt3', name: 'Com Açúcar', extraPrice: 0 }, { id: 'opt4', name: 'Com Adoçante', extraPrice: 0 }, { id: 'opt5', name: 'Natural (Sem nada)', extraPrice: 0 }] }
      ];
    }

    setEditingProduct({ ...editingProduct, category: cat, modifierGroups: groups });
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;

    // VALIDAÇÕES DE REGRAS DE NEGÓCIO PARA O FLUXO DE CUSTOMIZAÇÃO
    if (editingProduct.modifierGroups && editingProduct.modifierGroups.length > 0) {
      for (const group of editingProduct.modifierGroups) {
        // 1. Validar se grupos obrigatórios têm opções suficientes
        if (group.min > group.options.length) {
          alert(`ERRO DE CONFIGURAÇÃO: O grupo "${group.name}" exige ${group.min} seleção(ões), mas você cadastrou apenas ${group.options.length} opção(ões). Adicione mais itens à lista deste grupo.`);
          return;
        }

        // 2. Validar se o mínimo é maior que o máximo
        if (group.min > group.max) {
          alert(`ERRO DE LÓGICA: No grupo "${group.name}", o valor MÍNIMO (${group.min}) não pode ser maior que o MÁXIMO (${group.max}).`);
          return;
        }

        // 3. Impedir grupos sem nenhuma opção
        if (group.options.length === 0) {
          alert(`ERRO: O grupo "${group.name}" está vazio. Adicione pelo menos uma opção ou remova o grupo.`);
          return;
        }
      }
    }

    // Validação específica para categorias Wizard (Açaí, Pizza, Marmita)
    const isWizard = [Category.ACAI, Category.PIZZAS, Category.MARMITAS].includes(editingProduct.category);
    if (isWizard && (!editingProduct.modifierGroups || editingProduct.modifierGroups.length === 0)) {
       const confirmSave = window.confirm(`ATENÇÃO: Produtos da categoria ${editingProduct.category} geralmente possuem etapas de montagem. Deseja salvar mesmo sem nenhuma etapa configurada?`);
       if (!confirmSave) return;
    }

    if (editingProduct.id.startsWith('temp_')) {
      const newProd = { ...editingProduct, id: Math.random().toString(36).substr(2, 9) };
      onUpdateProducts(prev => [...prev, newProd]);
    } else {
      onUpdateProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    }
    setIsEditingProduct(false);
    setEditingProduct(null);
  };

  const totalRevenue = useMemo(() => tabs.filter(t => t.status === TabStatus.CLOSED).reduce((acc, t) => acc + t.total, 0), [tabs]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
             <div className="p-3 bg-slate-950 text-white rounded-3xl shadow-xl"><SettingsIcon size={28}/></div>
             Gestão Estratégica
          </h2>
          <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">{settings.companyName}</p>
        </div>
        <div className="flex bg-white p-2 rounded-[30px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`px-8 py-4 rounded-[22px] text-xs font-black transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>OVERVIEW</button>
          <button onClick={() => setActiveTab('menu')} className={`px-8 py-4 rounded-[22px] text-xs font-black transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>PRODUTOS</button>
          <button onClick={() => setActiveTab('combos')} className={`px-8 py-4 rounded-[22px] text-xs font-black transition-all whitespace-nowrap ${activeTab === 'combos' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>COMBOS</button>
          <button onClick={() => setActiveTab('promos')} className={`px-8 py-4 rounded-[22px] text-xs font-black transition-all whitespace-nowrap ${activeTab === 'promos' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>PROMOS</button>
          <button onClick={() => setActiveTab('settings')} className={`px-8 py-4 rounded-[22px] text-xs font-black transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>AJUSTES</button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StatCard label="Receita Bruta" value={`R$ ${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-emerald-500"/>} bg="bg-emerald-50" />
           <StatCard label="Mesas Ativas" value={tabs.filter(t => t.status === TabStatus.OPEN).length.toString()} icon={<Receipt className="text-indigo-500"/>} bg="bg-indigo-50" />
           <StatCard label="Total Produtos" value={products.length.toString()} icon={<Package className="text-amber-500"/>} bg="bg-amber-50" />
           <StatCard label="Tickets Pagos" value={tabs.filter(t => t.status === TabStatus.CLOSED).length.toString()} icon={<CheckCircle2 className="text-blue-500"/>} bg="bg-blue-50" />
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="bg-white p-4 rounded-[30px] flex items-center gap-4 border border-slate-100 w-full max-w-md shadow-sm">
                 <Search size={20} className="text-slate-300"/>
                 <input type="text" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} placeholder="Pesquisar item..." className="bg-transparent font-bold outline-none flex-1"/>
              </div>
              <button onClick={() => { setEditingProduct({ id: 'temp_' + Date.now(), companyId: settings.companyId, name: '', price: 0, category: Category.PRATOS }); setIsEditingProduct(true); }} className="bg-slate-950 text-white px-10 py-5 rounded-[25px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                <Plus size={20}/> Adicionar Item
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[45px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                   <div className="w-24 h-24 bg-slate-50 rounded-[30px] overflow-hidden flex items-center justify-center">
                      {p.image ? <img src={p.image} className="w-full h-full object-cover" alt={p.name}/> : <ImageIcon size={28} className="text-slate-200"/>}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-slate-900 leading-tight mb-1">{p.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</p>
                      <p className="text-xl font-black text-slate-950 tracking-tighter mt-2">R$ {p.price.toFixed(2)}</p>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingProduct(p); setIsEditingProduct(true); }} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-950 hover:text-white transition-all"><Edit size={18}/></button>
                      <button onClick={() => onUpdateProducts(prev => prev.filter(item => item.id !== p.id))} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all"><Trash size={18}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'combos' && (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3"><Sparkles className="text-yellow-500" size={24}/> Gestão de Combos</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Combine produtos e aumente o ticket médio</p>
              </div>
              <button onClick={() => { setEditingCombo({ id: 'temp_' + Date.now(), companyId: settings.companyId, name: '', description: '', price: 0, productIds: [] }); setIsEditingCombo(true); }} className="bg-yellow-400 text-slate-900 px-10 py-5 rounded-[25px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                <Plus size={20}/> Criar Novo Combo
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {combos.map(combo => (
                <div key={combo.id} className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl rounded-full" />
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-slate-50 rounded-[35px] overflow-hidden flex items-center justify-center border border-slate-100">
                         {combo.image ? <img src={combo.image} className="w-full h-full object-cover" alt={combo.name}/> : <Package size={32} className="text-slate-200"/>}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black text-slate-900 text-xl leading-tight">{combo.name}</h4>
                         <p className="text-2xl font-black text-slate-950 tracking-tighter mt-2">R$ {combo.price.toFixed(2)}</p>
                      </div>
                   </div>
                   
                   <div className="flex-1 space-y-4 mb-8">
                      <p className="text-slate-400 text-sm font-medium line-clamp-2">{combo.description}</p>
                      <div className="flex flex-wrap gap-2">
                         {combo.productIds.map(pid => {
                            const p = products.find(prod => prod.id === pid);
                            return p ? (
                               <span key={pid} className="px-3 py-1.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{p.name}</span>
                            ) : null;
                         })}
                      </div>
                   </div>

                   <div className="flex gap-3 pt-6 border-t border-slate-50">
                      <button onClick={() => { setEditingCombo(combo); setIsEditingCombo(true); }} className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Editar Combo</button>
                      <button onClick={() => onUpdateCombos(prev => prev.filter(c => c.id !== combo.id))} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash size={20}/></button>
                   </div>
                </div>
              ))}
              {combos.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[60px] border-2 border-dashed border-slate-100 opacity-30">
                   <Sparkles size={64} className="text-slate-300 mb-6"/>
                   <p className="font-black text-xs uppercase tracking-widest">Nenhum combo configurado</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'promos' && (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3"><Tag className="text-rose-500" size={24}/> Campanhas de Promoção</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Configure ofertas diárias, mensais e anuais</p>
              </div>
              <button onClick={() => { setEditingPromo({ id: 'temp_' + Date.now(), companyId: settings.companyId, title: '', description: '', badge: 'OFERTA', color: '#f43f5e', targetType: 'product', targetId: '', scheduleType: 'always', promoType: 'percentage', discountValue: 0, isActive: true }); setIsEditingPromo(true); }} className="bg-rose-500 text-white px-10 py-5 rounded-[25px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                <Plus size={20}/> Criar Promoção
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map(promo => (
                <div key={promo.id} className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full" style={{ backgroundColor: promo.color + '10' }} />
                   <div className="flex items-center gap-6 mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: promo.color }}>
                         {promo.promoType === 'percentage' ? <Percent size={24}/> : <Tag size={24}/>}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black text-slate-900 text-xl leading-tight">{promo.title}</h4>
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-white mt-2 inline-block" style={{ backgroundColor: promo.color }}>{promo.badge}</span>
                      </div>
                   </div>
                   <div className="flex-1 space-y-4 mb-8">
                      <p className="text-slate-400 text-sm font-medium line-clamp-2">{promo.description}</p>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Clock size={16}/></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {promo.scheduleType === 'always' && 'Sempre Ativo'}
                            {promo.scheduleType === 'daily' && `Toda ${['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][Number(promo.scheduleValue)]}`}
                            {promo.scheduleType === 'monthly' && `Todo dia ${promo.scheduleValue}`}
                            {promo.scheduleType === 'yearly' && `Todo dia ${promo.scheduleValue?.split('-').reverse().join('/')}`}
                         </p>
                      </div>
                   </div>
                   <div className="flex gap-3 pt-6 border-t border-slate-50">
                      <button onClick={() => { setEditingPromo(promo); setIsEditingPromo(true); }} className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Editar</button>
                      <button 
                        onClick={() => onUpdatePromotions(prev => prev.map(p => p.id === promo.id ? {...p, isActive: !p.isActive} : p))} 
                        className={`p-4 rounded-2xl transition-all ${promo.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}
                      >
                         {promo.isActive ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                      </button>
                      <button onClick={() => onUpdatePromotions(prev => prev.filter(p => p.id !== promo.id))} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash size={20}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-[60px] p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-16">
           <section className="space-y-10">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-4"><Store size={20}/> Dados do Estabelecimento</h3>
              <div className="flex flex-col items-center p-10 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200">
                 <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-6 overflow-hidden border-8 border-white">
                    {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" alt="Logo"/> : <ImageIcon size={40} className="text-slate-200"/>}
                 </div>
                 <input type="file" ref={logoFileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                 <button onClick={() => logoFileInputRef.current?.click()} className="bg-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm border border-slate-100 flex items-center gap-3">
                    {isOptimizing ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16}/>} Alterar Logo
                 </button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={settings.companyName} onChange={e => onUpdateSettings({...settings, companyName: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" placeholder="Nome Fantasia" />
                    <input type="text" value={settings.whatsapp} onChange={e => onUpdateSettings({...settings, whatsapp: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" placeholder="WhatsApp" />
                 </div>
              </div>

              {/* CANAIS DE VENDA */}
              <div className="pt-10 border-t border-slate-100 space-y-6">
                 <h4 className="text-xl font-black tracking-tight flex items-center gap-3"><Layers2 size={20}/> Canais de Venda Ativos</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <ChannelToggle 
                      label="Mesa (Salão)" 
                      icon={<Utensils size={18}/>} 
                      active={settings.enabledOrderTypes.includes(OrderType.INDOOR)} 
                      onClick={() => toggleOrderType(OrderType.INDOOR)} 
                    />
                    <ChannelToggle 
                      label="Barraca (Praia)" 
                      icon={<Umbrella size={18}/>} 
                      active={settings.enabledOrderTypes.includes(OrderType.BEACH)} 
                      onClick={() => toggleOrderType(OrderType.BEACH)} 
                    />
                    <ChannelToggle 
                      label="Entrega (Delivery)" 
                      icon={<Bike size={18}/>} 
                      active={settings.enabledOrderTypes.includes(OrderType.DELIVERY)} 
                      onClick={() => toggleOrderType(OrderType.DELIVERY)} 
                    />
                    <ChannelToggle 
                      label="Retirada (Balcão)" 
                      icon={<Package size={18}/>} 
                      active={settings.enabledOrderTypes.includes(OrderType.TAKEAWAY)} 
                      onClick={() => toggleOrderType(OrderType.TAKEAWAY)} 
                    />
                 </div>
              </div>
           </section>
           <section className="space-y-10">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-4"><Clock size={20}/> Configurações Gerais</h3>
              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[35px]">
                 <div>
                    <h4 className="font-black text-slate-900">Taxa de Serviço</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">Cobrança automática de {settings.serviceFeePercent}%</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <input type="number" value={settings.serviceFeePercent} onChange={e => onUpdateSettings({...settings, serviceFeePercent: Number(e.target.value)})} className="w-20 p-4 bg-white border border-slate-200 rounded-2xl font-black text-center" />
                    <button onClick={() => onUpdateSettings({...settings, serviceFeeEnabled: !settings.serviceFeeEnabled})} className={`p-2 rounded-xl transition-all ${settings.serviceFeeEnabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                       {settings.serviceFeeEnabled ? <ToggleRight size={40}/> : <ToggleLeft size={40}/>}
                    </button>
                 </div>
              </div>
           </section>
        </div>
      )}

      {/* MODAL EDITOR DE PROMOÇÃO */}
      {isEditingPromo && editingPromo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-5xl h-[94vh] rounded-[60px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <header className="p-10 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-6">
                    <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg"><Tag size={24}/></div>
                    <h3 className="text-3xl font-black tracking-tighter">Configurar Campanha Promocional</h3>
                 </div>
                 <button onClick={() => setIsEditingPromo(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </header>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* CONFIGURAÇÃO VISUAL */}
                    <div className="space-y-10">
                       <div className="p-10 rounded-[50px] space-y-6 shadow-inner border-2 border-dashed border-slate-100" style={{ backgroundColor: editingPromo.color + '05' }}>
                          <h4 className="text-xl font-black tracking-tight">Aspecto Visual</h4>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Campanha</label>
                             <input type="text" value={editingPromo.title} onChange={e => setEditingPromo({...editingPromo, title: e.target.value})} className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold mt-2" placeholder="Ex: Black Friday" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Texto do Badge</label>
                                <input type="text" value={editingPromo.badge} onChange={e => setEditingPromo({...editingPromo, badge: e.target.value})} className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-black uppercase" placeholder="Ex: 50% OFF" />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Temática</label>
                                <div className="flex gap-2 mt-2">
                                   {['#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#a855f7', '#000000'].map(c => (
                                     <button key={c} onClick={() => setEditingPromo({...editingPromo, color: c})} className={`w-10 h-10 rounded-full border-4 transition-all ${editingPromo.color === c ? 'border-white shadow-xl scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-xl font-black tracking-tight">Regras de Desconto</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => setEditingPromo({...editingPromo, promoType: 'percentage'})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${editingPromo.promoType === 'percentage' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                <Percent size={24}/>
                                <span className="text-[10px] font-black uppercase">Porcentagem</span>
                             </button>
                             <button onClick={() => setEditingPromo({...editingPromo, promoType: 'fixed'})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${editingPromo.promoType === 'fixed' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                <DollarSign size={24}/>
                                <span className="text-[10px] font-black uppercase">Valor Fixo</span>
                             </button>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Abatimento {editingPromo.promoType === 'percentage' ? '(%)' : '(R$)'}</label>
                             <input type="number" value={editingPromo.discountValue} onChange={e => setEditingPromo({...editingPromo, discountValue: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-4xl text-emerald-600 outline-none mt-2" placeholder="0" />
                          </div>
                       </div>
                    </div>

                    {/* AGENDAMENTO E ALVO */}
                    <div className="space-y-10">
                       <div className="space-y-6">
                          <h4 className="text-xl font-black tracking-tight">Agendamento Recorrente</h4>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setEditingPromo({...editingPromo, scheduleType: 'always', scheduleValue: undefined})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${editingPromo.scheduleType === 'always' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Sempre</button>
                             <button onClick={() => setEditingPromo({...editingPromo, scheduleType: 'daily', scheduleValue: '1'})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${editingPromo.scheduleType === 'daily' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Diário</button>
                             <button onClick={() => setEditingPromo({...editingPromo, scheduleType: 'monthly', scheduleValue: '1'})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${editingPromo.scheduleType === 'monthly' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Mensal</button>
                             <button onClick={() => setEditingPromo({...editingPromo, scheduleType: 'yearly', scheduleValue: '01-01'})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${editingPromo.scheduleType === 'yearly' ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Anual</button>
                          </div>

                          {editingPromo.scheduleType === 'daily' && (
                             <div className="flex flex-wrap gap-2 pt-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                                  <button key={day} onClick={() => setEditingPromo({...editingPromo, scheduleValue: String(idx)})} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${editingPromo.scheduleValue === String(idx) ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{day}</button>
                                ))}
                             </div>
                          )}

                          {editingPromo.scheduleType === 'monthly' && (
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia do Mês (1 a 31)</label>
                                <input type="number" min="1" max="31" value={editingPromo.scheduleValue} onChange={e => setEditingPromo({...editingPromo, scheduleValue: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black mt-2" />
                             </div>
                          )}

                          {editingPromo.scheduleType === 'yearly' && (
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fixa (MM-DD)</label>
                                <input type="text" value={editingPromo.scheduleValue} onChange={e => setEditingPromo({...editingPromo, scheduleValue: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black mt-2" placeholder="Ex: 12-25 (Natal)" />
                             </div>
                          )}
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-xl font-black tracking-tight">Aplicar em</h4>
                          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                             <button onClick={() => setEditingPromo({...editingPromo, targetType: 'product', targetId: ''})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingPromo.targetType === 'product' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Produto Específico</button>
                             <button onClick={() => setEditingPromo({...editingPromo, targetType: 'category', targetId: ''})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingPromo.targetType === 'category' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Categoria Inteira</button>
                          </div>

                          {editingPromo.targetType === 'product' ? (
                             <select value={editingPromo.targetId} onChange={e => setEditingPromo({...editingPromo, targetId: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                                <option value="">Selecionar Produto...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                          ) : (
                             <select value={editingPromo.targetId} onChange={e => setEditingPromo({...editingPromo, targetId: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                                <option value="">Selecionar Categoria...</option>
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <footer className="p-10 border-t bg-slate-50 flex items-center justify-end gap-6">
                 <button onClick={() => setIsEditingPromo(false)} className="px-10 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition-all">Cancelar</button>
                 <button onClick={handleSavePromo} disabled={!editingPromo.title || !editingPromo.targetId} className="bg-slate-950 text-white px-14 py-6 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-20">
                   <CheckCircle2 size={20}/> Aplicar Promoção
                 </button>
              </footer>
           </div>
        </div>
      )}

      {/* MODAL EDITOR DE COMBO (EXISTENTE) */}
      {isEditingCombo && editingCombo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-5xl h-[94vh] rounded-[60px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <header className="p-10 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-6">
                    <div className="p-3 bg-yellow-400 text-slate-900 rounded-2xl shadow-lg"><Sparkles size={24}/></div>
                    <h3 className="text-3xl font-black tracking-tighter">Configurar Combo Promocional</h3>
                 </div>
                 <button onClick={() => setIsEditingCombo(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </header>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* LADO ESQUERDO: DADOS DO COMBO */}
                    <div className="space-y-10">
                       <div className="relative group">
                          <div className="w-full h-80 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative">
                             {editingCombo.image ? <img src={editingCombo.image} className="w-full h-full object-cover" alt="Preview"/> : <Package size={48} className="text-slate-200"/>}
                             {isOptimizing && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" size={40}/></div>}
                          </div>
                          <input type="file" ref={comboFileInputRef} onChange={handleComboImageUpload} className="hidden" accept="image/*" />
                          <button onClick={() => comboFileInputRef.current?.click()} className="absolute bottom-6 right-6 p-5 bg-slate-950 text-white rounded-[25px] shadow-2xl active:scale-95 transition-all"><Camera size={24}/></button>
                       </div>
                       
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Oferta</label>
                             <input type="text" value={editingCombo.name} onChange={e => setEditingCombo({...editingCombo, name: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-2xl outline-none mt-2" placeholder="Ex: Combo Família" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço do Pacote (R$)</label>
                             <input type="number" value={editingCombo.price} onChange={e => setEditingCombo({...editingCombo, price: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-4xl outline-none mt-2 text-emerald-600" placeholder="R$ 0,00" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Comercial</label>
                             <textarea value={editingCombo.description} onChange={e => setEditingCombo({...editingCombo, description: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-bold h-32 resize-none outline-none mt-2" placeholder="Descreva o que vem no combo para atrair o cliente..." />
                          </div>
                       </div>
                    </div>

                    {/* LADO DIREITO: SELEÇÃO DE PRODUTOS */}
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black tracking-tight">Vincular Produtos</h4>
                          <span className="bg-slate-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{editingCombo.productIds.length} Itens Selecionados</span>
                       </div>
                       
                       <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3 border border-slate-100 mb-6">
                          <Search size={20} className="text-slate-300"/>
                          <input type="text" placeholder="Filtrar produtos..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="bg-transparent font-bold flex-1 outline-none text-sm" />
                       </div>

                       <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                          {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => {
                            const isSelected = editingCombo.productIds.includes(p.id);
                            return (
                              <button key={p.id} onClick={() => toggleProductInCombo(p.id)} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-slate-950 border-slate-950 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                       {isSelected ? <CheckCircle2 size={24}/> : <Plus size={20} className="text-slate-300"/>}
                                    </div>
                                    <div className="text-left">
                                       <p className="font-black text-sm">{p.name}</p>
                                       <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>{p.category}</p>
                                    </div>
                                 </div>
                                 <span className={`font-black text-sm ${isSelected ? 'text-yellow-400' : 'text-slate-400'}`}>R$ {p.price.toFixed(2)}</span>
                              </button>
                            );
                          })}
                       </div>
                    </div>
                 </div>
              </div>

              <footer className="p-10 border-t bg-slate-50 flex items-center justify-end gap-6">
                 <button onClick={() => setIsEditingCombo(false)} className="px-10 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition-all">Descartar Alterações</button>
                 <button onClick={handleSaveCombo} disabled={editingCombo.productIds.length < 2} className="bg-slate-950 text-white px-14 py-6 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-20">
                   <CheckCircle2 size={20}/> Salvar Novo Combo
                 </button>
              </footer>
           </div>
        </div>
      )}

      {/* MODAL EDITOR DE PRODUTO (EXISTENTE) */}
      {isEditingProduct && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-4xl h-[94vh] rounded-[60px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <header className="p-10 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-6">
                    <div className="p-3 bg-slate-950 text-white rounded-2xl"><Edit size={24}/></div>
                    <h3 className="text-3xl font-black tracking-tighter">Personalizar Item</h3>
                 </div>
                 <button onClick={() => setIsEditingProduct(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </header>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <div className="relative group">
                          <div className="w-full h-72 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                             {editingProduct.image ? <img src={editingProduct.image} className="w-full h-full object-cover" alt="Preview"/> : <ImageIcon size={48} className="text-slate-200"/>}
                             {isOptimizing && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-slate-900" size={40}/></div>}
                          </div>
                          <input type="file" ref={productFileInputRef} onChange={handleProductImageUpload} className="hidden" accept="image/*" />
                          <button onClick={() => productFileInputRef.current?.click()} className="absolute bottom-6 right-6 p-5 bg-slate-950 text-white rounded-[25px] shadow-2xl active:scale-95 transition-all"><Camera size={24}/></button>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.values(Category).map(cat => (
                            <button key={cat} onClick={() => setEditingProduct({...editingProduct, category: cat})} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${editingProduct.category === cat ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900'}`}>{cat}</button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-2xl outline-none" placeholder="Nome do Produto" />
                       <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-4xl outline-none" placeholder="R$ 0,00" />
                       <textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-bold h-32 resize-none outline-none" placeholder="Descrição curta do item..." />
                    </div>
                 </div>

                 <div className="p-10 bg-slate-950 rounded-[50px] space-y-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-20 -mt-20" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div>
                          <h4 className="text-xl font-black tracking-tight flex items-center gap-3"><Zap size={24} className="text-yellow-400"/> Templates de Fluxo Especializado</h4>
                          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Crie regras complexas com apenas um toque</p>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          <button onClick={() => applyTemplate('PIZZA')} className="bg-white/10 hover:bg-white text-white hover:text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><Pizza size={18}/> Pizza (Meio-a-Meio)</button>
                          <button onClick={() => applyTemplate('ACAI')} className="bg-white/10 hover:bg-white text-white hover:text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><IceCream size={18}/> Açaí (Montagem)</button>
                          <button onClick={() => applyTemplate('MARMITA')} className="bg-white/10 hover:bg-white text-white hover:text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><UtensilsCrossed size={18}/> Marmita (Custom)</button>
                          <button onClick={() => applyTemplate('SUCO')} className="bg-white/10 hover:bg-white text-white hover:text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><Coffee size={18}/> Suco (Variações)</button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xl font-black tracking-tight flex items-center gap-3">Grupos de Customização</h4>
                       <button onClick={() => setEditingProduct({...editingProduct, modifierGroups: [...(editingProduct.modifierGroups || []), { id: Date.now().toString(), name: '', min: 0, max: 1, options: [] }]})} className="bg-slate-50 p-4 rounded-2xl text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Novo Grupo +</button>
                    </div>

                    <div className="grid gap-8">
                       {editingProduct.modifierGroups?.map((group, gIdx) => (
                         <div key={group.id} className="bg-slate-50 p-10 rounded-[45px] border border-slate-100 space-y-8 relative">
                            <button onClick={() => setEditingProduct({...editingProduct, modifierGroups: editingProduct.modifierGroups?.filter(g => g.id !== group.id)})} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-all"><Trash size={20}/></button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                               <div className="md:col-span-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Etapa do Fluxo / Nome</label>
                                  <input type="text" value={group.name} onChange={e => {
                                    const newGroups = [...(editingProduct.modifierGroups || [])];
                                    newGroups[gIdx].name = e.target.value;
                                    setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                  }} className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-black" placeholder="Ex: Escolha o Sabor" />
                               </div>
                               <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mínimo (0 = Opcional)</label>
                                  <div className="flex items-center gap-2">
                                     <input type="number" value={group.min} onChange={e => {
                                       const newGroups = [...(editingProduct.modifierGroups || [])];
                                       newGroups[gIdx].min = Number(e.target.value);
                                       setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                     }} className={`w-full p-5 bg-white border-2 rounded-2xl font-black text-center transition-all ${group.min > 0 ? 'border-indigo-500 text-indigo-700' : 'border-slate-200'}`} />
                                     {group.min > 0 && <div className="bg-indigo-500 text-white p-2 rounded-lg" title="Passo Obrigatório"><ShieldCheck size={16}/></div>}
                                  </div>
                               </div>
                               <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Máximo de Seleções</label>
                                  <input type="number" value={group.max} onChange={e => {
                                    const newGroups = [...(editingProduct.modifierGroups || [])];
                                    newGroups[gIdx].max = Number(e.target.value);
                                    setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                  }} className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-black text-center" />
                               </div>
                            </div>
                            
                            {/* Alerta de erro em tempo real */}
                            {group.min > group.options.length && (
                              <div className="bg-rose-50 p-4 rounded-2xl flex items-center gap-3 text-rose-600 border border-rose-100 animate-pulse">
                                 <AlertCircle size={20}/>
                                 <p className="text-[10px] font-black uppercase tracking-widest">Configuração Inválida: Adicione pelo menos {group.min} opções para cumprir a obrigatoriedade.</p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {group.options.map((opt, oIdx) => (
                                 <div key={opt.id} className="flex gap-2">
                                    <input type="text" value={opt.name} onChange={e => {
                                      const newGroups = [...(editingProduct.modifierGroups || [])];
                                      newGroups[gIdx].options[oIdx].name = e.target.value;
                                      setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                    }} className="flex-1 p-5 bg-white border border-slate-200 rounded-2xl font-bold" placeholder="Item" />
                                    <input type="number" value={opt.extraPrice} onChange={e => {
                                      const newGroups = [...(editingProduct.modifierGroups || [])];
                                      newGroups[gIdx].options[oIdx].extraPrice = Number(e.target.value);
                                      setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                    }} className="w-28 p-5 bg-white border border-slate-200 rounded-2xl font-black text-emerald-600 text-center" placeholder="+ R$" />
                                    <button onClick={() => {
                                      const newGroups = [...(editingProduct.modifierGroups || [])];
                                      newGroups[gIdx].options = newGroups[gIdx].options.filter(o => o.id !== opt.id);
                                      setEditingProduct({...editingProduct, modifierGroups: newGroups});
                                    }} className="text-slate-300 hover:text-rose-500 transition-all px-2"><X size={20}/></button>
                                 </div>
                               ))}
                               <button onClick={() => {
                                 const newGroups = [...(editingProduct.modifierGroups || [])];
                                 newGroups[gIdx].options.push({ id: Math.random().toString(), name: '', extraPrice: 0 });
                                 setEditingProduct({...editingProduct, modifierGroups: newGroups});
                               }} className="p-5 border-2 border-dashed border-slate-200 rounded-[30px] flex items-center justify-center gap-2 text-slate-300 hover:text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all">Novo Item na Lista +</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <footer className="p-10 border-t bg-slate-50 flex items-center justify-end gap-6">
                 <button onClick={() => setIsEditingProduct(false)} className="px-10 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition-all">Cancelar</button>
                 <button onClick={handleSaveProduct} className="bg-slate-950 text-white px-14 py-6 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                   <CheckCircle2 size={20}/> Aplicar Configurações
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

const ChannelToggle: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${active ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
     <div className={`p-2 rounded-lg ${active ? 'bg-white/10' : 'bg-slate-50'}`}>{icon}</div>
     <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
     <div className="ml-auto">
        {active ? <ToggleRight size={32} className="text-emerald-400"/> : <ToggleLeft size={32}/>}
     </div>
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; bg: string }> = ({ label, value, icon, bg }) => (
  <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 flex items-center gap-6">
     <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-inner ${bg}`}>{icon}</div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-950 tracking-tighter">{value}</p>
     </div>
  </div>
);

export default AdminDashboard;
