
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Tab, TabStatus, Settings, Product, Category, PaymentMethod, ItemStatus, OrderType, OrderItem, DeliveryInfo, Combo, Promotion } from '../types'; // Added DeliveryInfo, Combo, Promotion import
import { MOCK_PRODUCTS } from '../constants'; // Added MOCK_PRODUCTS import for potential usage
import { 
  BarChart3, Settings as SettingsIcon, Bell, DollarSign, Utensils, Printer, 
  PlusCircle, Edit, Trash, ChevronRight, Check, X, Clock, AlertTriangle, Package, CalendarDays, Soup, ListChecks, Bike, Info, Users, Menu, Store, Maximize, Loader2, CheckCircle2 // Adicionado CheckCircle2 e Loader2, removido Play
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai'; // Added GoogleGenAI import and Type

// Assume this is the AdminDashboard component
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

export const AdminDashboard: React.FC<Props> = ({ // Changed to named export
  tabs, settings, products, combos, promotions,
  onUpdateProducts, onUpdateCombos, onUpdatePromotions, onUpdateSettings,
  onResetData, onUpdateItemStatus, onReprintItem, onReprintReceipt,
  onAddItems, onOpenOrder, onAddPayment, onUpdatePeopleCount,
  isWithinShifts
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'settings' | 'kitchen'>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    companyId: settings.companyId,
    name: '',
    price: 0,
    category: Category.BEBIDAS,
    description: '',
    image: ''
  });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState('');
  const [menuGenerationError, setMenuGenerationError] = useState('');

  const openTabs = useMemo(() => tabs.filter(t => t.status === TabStatus.OPEN), [tabs]);
  const closedTabs = useMemo(() => tabs.filter(t => t.status === TabStatus.CLOSED), [tabs]);

  const itemsInPreparation = useMemo(() => 
    tabs.flatMap(tab => 
      tab.items.filter(item => item.status === ItemStatus.NEW || item.status === ItemStatus.PREPARING)
        .map(item => ({ ...item, tabCustomerName: tab.customerName, tabTentNumber: tab.tentNumber, tabId: tab.id, orderType: tab.orderType }))
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  [tabs]);

  const handleUpdateProduct = (updatedProduct: Product) => {
    onUpdateProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    onUpdateProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAddNewProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      const productToAdd: Product = {
        ...newProduct,
        id: Date.now().toString(),
        companyId: settings.companyId,
      };
      onUpdateProducts(prev => [...prev, productToAdd]);
      setShowAddProductModal(false);
      setNewProduct({
        companyId: settings.companyId,
        name: '',
        price: 0,
        category: Category.BEBIDAS,
        description: '',
        image: ''
      });
    }
  };

  const handleUpdateSettings = (updatedSetting: Partial<Settings>) => {
    onUpdateSettings(prev => ({ ...prev, ...updatedSetting }));
  };

  const handleGenerateMenu = async () => {
    setIsGeneratingMenu(true);
    setMenuGenerationError('');
    setGeneratedMenu('');

    try {
      // Fix: Create new GoogleGenAI instance before each API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gerar um cardápio diário criativo para um restaurante. A marmita deve ter 5 ingredientes fixos, e uma breve descrição. O cardápio deve ser divertido e apetitoso. Exemplo: "O tempero caseiro que você já conhece. Com: Arroz Branco, Feijão Carioca, Bife Acebolado, Batata Doce Assada, Salada Verde". Formato JSON: {"description": "string", "ingredients": ["string", "string", ... ]}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: 'A brief, appetizing description for the daily menu.'
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: 'A list of 5 fixed ingredients for the daily menu.'
                }
              }
            },
            required: ["description", "ingredients"]
          }
        },
      });

      const text = response.text.trim();
      const parsedMenu = JSON.parse(text);

      if (parsedMenu.description && Array.isArray(parsedMenu.ingredients) && parsedMenu.ingredients.length === 5) {
        setGeneratedMenu(text);
        handleUpdateSettings({
          marmitaConfig: {
            ...settings.marmitaConfig,
            dailyMenu: parsedMenu.description,
            ingredients: parsedMenu.ingredients,
          },
        });
      } else {
        setMenuGenerationError('O formato do cardápio gerado não está correto. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Error generating menu:', error);
      // More robust error handling for API errors
      if (error.status && error.message) {
        setMenuGenerationError(`Erro da API (${error.status}): ${error.message}.`);
      } else {
        setMenuGenerationError('Ocorreu um erro ao gerar o cardápio. Verifique sua chave API e tente novamente.');
      }
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  // Kitchen Monitor Logic - moved here from KitchenDashboard.tsx
  const itemStatusOrder = [ItemStatus.NEW, ItemStatus.PREPARING, ItemStatus.READY, ItemStatus.DELIVERING, ItemStatus.COMPLETED];

  const getProductById = (productId: string) => products.find(p => p.id === productId);

  const getItemsByStatus = (status: ItemStatus) => itemsInPreparation.filter(item => item.status === status);

  const handleUpdateStatus = (tabId: string, itemId: string, currentStatus: ItemStatus) => {
    const currentIndex = itemStatusOrder.indexOf(currentStatus);
    if (currentIndex < itemStatusOrder.length - 1) {
      onUpdateItemStatus(tabId, itemId, itemStatusOrder[currentIndex + 1]);
    }
  };

  const handleReprint = (tabId: string, itemId: string) => {
    // Implement print logic here
    console.log(`Reprinting item ${itemId} from tab ${tabId}`);
    onReprintItem(tabId, itemId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="text-yellow-500" /> Gestão Completa
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <FilterBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Visão Geral" />
          <FilterBtn active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} label="Monitor Produção" />
          <FilterBtn active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} label="Cardápio" />
          <FilterBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Configurações" />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-start gap-4">
            <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600"><Users size={20}/></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesas Abertas</p>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{openTabs.length}</span>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><DollarSign size={20}/></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Vendido Hoje</p>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {closedTabs.reduce((acc, t) => acc + t.total, 0).toFixed(2)}</span>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600"><Utensils size={20}/></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens em Preparo</p>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{itemsInPreparation.filter(item => item.status === ItemStatus.PREPARING).length}</span>
          </div>
        </div>
      )}

      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Utensils className="text-yellow-500" /> Monitor de Produção
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {itemStatusOrder.map(status => (
              <div key={status} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full flex flex-col">
                <h4 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                  {statusIcons[status]} {status}
                </h4>
                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                  {getItemsByStatus(status).length === 0 && (
                    <p className="text-sm text-slate-400">Nenhum item em "{status}".</p>
                  )}
                  {getItemsByStatus(status).map(item => (
                    <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm">{item.quantity}x</span>
                          <div>
                            <p className="font-bold text-sm text-slate-800 leading-tight">{getProductById(item.productId)?.name}</p>
                            {item.marmitaSize && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Tamanho {item.marmitaSize}</span>}
                          </div>
                        </div>
                        <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${item.orderType === OrderType.DELIVERY ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {item.orderType}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{item.tabCustomerName} ({item.tabTentNumber || 'Delivery'})</span>
                        <span className="font-bold">Há {Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60))} min</span>
                      </div>
                      {item.note && <p className="text-[10px] text-rose-500 font-black italic">Obs: {item.note}</p>}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleUpdateStatus(item.tabId, item.id, item.status)} className="flex-1 bg-yellow-400 text-slate-950 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1">
                          {/* Updated icon usage */}
                          {status === ItemStatus.NEW && <Clock size={14} />} 
                          {status === ItemStatus.PREPARING && <Check size={14} />}
                          {status === ItemStatus.READY && <Bike size={14} />}
                          {status === ItemStatus.DELIVERING && <CheckCircle2 size={14} />}
                          {status === ItemStatus.COMPLETED && <Check size={14} />}
                          Avançar
                        </button>
                        <button onClick={() => handleReprint(item.tabId, item.id)} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Cardápio de Produtos ({products.length})</h3>
            <button onClick={() => setShowAddProductModal(true)} className="bg-yellow-400 text-slate-950 px-5 py-3 rounded-full text-xs font-black uppercase flex items-center gap-2">
              <PlusCircle size={16}/> Adicionar Produto
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                      {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-400" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-tight">{product.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{product.category}</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">R$ {product.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{product.description || 'Nenhuma descrição disponível.'}</p>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setEditingProduct(product)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1">
                    <Edit size={14}/> Editar
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                    <Trash size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-8 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Marmita do Dia</h3>
              <button
                onClick={handleGenerateMenu}
                disabled={isGeneratingMenu}
                className={`px-5 py-3 rounded-full text-xs font-black uppercase flex items-center gap-2 ${isGeneratingMenu ? 'bg-slate-400' : 'bg-emerald-600 text-white'}`}
              >
                {isGeneratingMenu ? <Loader2 className="animate-spin" size={16}/> : <CalendarDays size={16}/>}
                {isGeneratingMenu ? 'Gerando...' : 'Gerar Novo Cardápio'}
              </button>
            </div>
            {menuGenerationError && <div className="p-4 bg-rose-100 text-rose-700 rounded-xl mb-4 flex items-center gap-2 text-sm font-medium"><AlertTriangle size={18}/> {menuGenerationError}</div>}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Soup size={20}/></div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">Marmita do Dia</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Configurações</p>
                </div>
              </div>
              <p className="text-slate-800 font-bold mb-4">{settings.marmitaConfig.dailyMenu}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {settings.marmitaConfig.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.marmitaConfig.enabled}
                    onChange={(e) => handleUpdateSettings({ marmitaConfig: { ...settings.marmitaConfig, enabled: e.target.checked }})}
                    className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                  />
                  Habilitar Marmita do Dia
                </label>
                <div className="text-xs text-slate-500">
                  <span>Horário: {settings.marmitaConfig.startTime} - {settings.marmitaConfig.endTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Configurações Gerais</h3>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Empresa</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleUpdateSettings({ companyName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ</label>
              <input
                type="text"
                value={settings.cnpj}
                onChange={(e) => handleUpdateSettings({ cnpj: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Serviço (%)</label>
              <input
                type="number"
                value={settings.serviceFeePercent}
                onChange={(e) => handleUpdateSettings({ serviceFeePercent: parseFloat(e.target.value) })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Entrega</label>
              <input
                type="number"
                value={settings.deliveryFee}
                onChange={(e) => handleUpdateSettings({ deliveryFee: parseFloat(e.target.value) })}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.isOpen}
                  onChange={(e) => handleUpdateSettings({ isOpen: e.target.checked })}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                Loja Aberta para Pedidos
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.serviceFeeEnabled}
                  onChange={(e) => handleUpdateSettings({ serviceFeeEnabled: e.target.checked })}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                Habilitar Taxa de Serviço
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.autoPrintReceipt}
                  onChange={(e) => handleUpdateSettings({ autoPrintReceipt: e.target.checked })}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                Imprimir Recibo Automaticamente
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.printKitchenVia}
                  onChange={(e) => handleUpdateSettings({ printKitchenVia: e.target.checked })}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                Imprimir Via Cozinha
              </label>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 tracking-tight mb-4">Turnos de Operação</h4>
            <div className="space-y-4">
              {settings.operatingShifts.map(shift => (
                <div key={shift.id} className="flex items-center gap-4">
                  <label className="flex-1 block text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={shift.enabled}
                      onChange={(e) => handleUpdateSettings({
                        operatingShifts: settings.operatingShifts.map(s => s.id === shift.id ? { ...s, enabled: e.target.checked } : s)
                      })}
                      className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded mr-2"
                    />
                    {shift.label}
                  </label>
                  <input
                    type="time"
                    value={shift.startTime}
                    onChange={(e) => handleUpdateSettings({
                      operatingShifts: settings.operatingShifts.map(s => s.id === shift.id ? { ...s, startTime: e.target.value } : s)
                    })}
                    className="p-2 border border-slate-200 rounded-lg"
                    disabled={!shift.enabled}
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    value={shift.endTime}
                    onChange={(e) => handleUpdateSettings({
                      operatingShifts: settings.operatingShifts.map(s => s.id === shift.id ? { ...s, endTime: e.target.value } : s)
                    })}
                    className="p-2 border border-slate-200 rounded-lg"
                    disabled={!shift.enabled}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">Aberto agora: {isWithinShifts ? 'Sim' : 'Não'}</p>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-200">
            <button onClick={onResetData} className="bg-rose-500 text-white px-5 py-3 rounded-full text-xs font-black uppercase flex items-center gap-2">
              <AlertTriangle size={16}/> Resetar Todos os Dados (Atenção!)
            </button>
          </div>
        </div>
      )}

      {/* Product Editing Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Editar Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Preço</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as Category })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => handleUpdateProduct(editingProduct)} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs">Salvar</button>
              <button onClick={() => setEditingProduct(null)} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-black uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Adicionar Novo Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Preço</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={newProduct.category}
                  onChange={e => setNewProduct({ ...newProduct, category: e.target.value as Category })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={newProduct.description || ''}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={newProduct.image || ''}
                  onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddNewProduct} className="flex-1 bg-yellow-400 text-slate-950 py-4 rounded-xl font-black uppercase text-xs">Adicionar</button>
              <button onClick={() => setShowAddProductModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-black uppercase text-xs">Cancelar</button>
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

const statusIcons = {
  [ItemStatus.NEW]: <Bell size={18} className="text-yellow-500" />,
  [ItemStatus.PREPARING]: <Clock size={18} className="text-blue-500" />,
  [ItemStatus.READY]: <CheckCircle2 size={18} className="text-emerald-500" />,
  [ItemStatus.DELIVERING]: <Bike size={18} className="text-orange-500" />,
  [ItemStatus.COMPLETED]: <Check size={18} className="text-slate-500" />,
};
