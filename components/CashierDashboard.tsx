
import React, { useState, useMemo, useEffect } from 'react';
import { Tab, TabStatus, PaymentMethod, Settings, Product, OrderType, PaymentStatus } from '../types';
import { 
  Receipt, Check, X, CreditCard, Wallet, QrCode, ArrowRight, Printer, 
  Umbrella, Utensils, History, AlertCircle, ChevronLeft, Bike, Info, HelpCircle, Users, Plus, Minus, DollarSign
} from 'lucide-react';

interface Props {
  tabs: Tab[];
  products: Product[];
  onAddPayment: (tabId: string, amount: number, method: PaymentMethod) => void;
  onUpdatePeopleCount: (tabId: string, count: number) => void;
  onCloseTab: (tabId: string, payment: PaymentMethod) => void;
  settings: Settings;
}

const CashierDashboard: React.FC<Props> = ({ tabs, products, onAddPayment, onUpdatePeopleCount, settings }) => {
  const [activeTabType, setActiveTabType] = useState<'open' | 'closed'>('open');
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showKioskHelp, setShowKioskHelp] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('0');
  const [lastClosedTab, setLastClosedTab] = useState<Tab | null>(null);

  const filteredTabs = useMemo(() => {
    return tabs.filter(t => t.status === (activeTabType === 'open' ? TabStatus.OPEN : TabStatus.CLOSED))
      .sort((a, b) => {
        if (activeTabType === 'closed') return new Date(b.closedAt!).getTime() - new Date(a.createdAt).getTime();
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [tabs, activeTabType]);

  const remainingBalance = useMemo(() => {
    if (!selectedTab) return 0;
    return selectedTab.total - selectedTab.amountPaid;
  }, [selectedTab]);

  const initiatePayment = (method: PaymentMethod) => {
    setPendingPayment(method);
    setPaymentAmount(remainingBalance.toFixed(2));
  };

  const handleConfirmPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (selectedTab && pendingPayment && amount > 0) {
      onAddPayment(selectedTab.id, amount, pendingPayment);
      
      // Se pagou tudo, preparamos o recibo final
      if (amount >= remainingBalance - 0.01) {
        setLastClosedTab({...selectedTab, amountPaid: selectedTab.amountPaid + amount, status: TabStatus.CLOSED});
        setSelectedTab(null);
      } else {
        // Se pagou parcial, apenas atualizamos o estado local para exibir o feedback
        setLastClosedTab({...selectedTab, amountPaid: selectedTab.amountPaid + amount, status: TabStatus.OPEN});
      }
      
      setPendingPayment(null);
      setShowSuccessModal(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (showSuccessModal && settings.autoPrintReceipt && lastClosedTab && lastClosedTab.status === TabStatus.CLOSED) {
      const timer = setTimeout(() => handlePrint(), 500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, settings.autoPrintReceipt, lastClosedTab]);

  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Caixa Central</h2>
          <button onClick={() => setShowKioskHelp(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><HelpCircle size={20}/></button>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button onClick={() => { setActiveTabType('open'); setSelectedTab(null); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTabType === 'open' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500'}`}>
            <Receipt size={16} /> ABERTAS ({tabs.filter(t => t.status === TabStatus.OPEN).length})
          </button>
          <button onClick={() => { setActiveTabType('closed'); setSelectedTab(null); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTabType === 'closed' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500'}`}>
            <History size={16} /> HISTÓRICO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
        <div className={`space-y-4 ${selectedTab ? 'hidden md:block' : 'block'}`}>
          {filteredTabs.map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab)} className={`w-full text-left p-5 rounded-[32px] border-2 transition-all flex justify-between items-center ${selectedTab?.id === tab.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-transparent shadow-sm'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${selectedTab?.id === tab.id ? 'bg-yellow-400 text-slate-900' : 'bg-slate-50 text-slate-500'}`}>
                  {tab.orderType === OrderType.BEACH ? <Umbrella size={20}/> : tab.orderType === OrderType.DELIVERY ? <Bike size={20}/> : <Utensils size={20}/>}
                </div>
                <div>
                  <h4 className="font-black tracking-tight">{tab.customerName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{tab.orderType} • {tab.tentNumber || 'Delivery'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black tracking-tighter">R$ {(tab.total - tab.amountPaid).toFixed(2)}</p>
                {tab.amountPaid > 0 && <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded">Parcial Pago</span>}
              </div>
            </button>
          ))}
        </div>

        <div className={`bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 h-fit sticky top-20 ${!selectedTab ? 'hidden md:block' : 'block'}`}>
          {selectedTab ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-slate-900">{selectedTab.customerName}</h3>
                <button onClick={() => setSelectedTab(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><X size={20}/></button>
              </div>

              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Remanescente</span>
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {remainingBalance.toFixed(2)}</span>
                 {selectedTab.amountPaid > 0 && (
                   <div className="mt-4 pt-4 border-t border-slate-200 w-full flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                     <span>Total Conta: R$ {selectedTab.total.toFixed(2)}</span>
                     <span className="text-emerald-600">Já Pago: R$ {selectedTab.amountPaid.toFixed(2)}</span>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <PaymentButton onClick={() => initiatePayment(PaymentMethod.PIX)} icon={<QrCode size={20}/>} label="RECEBER VIA PIX" />
                <PaymentButton onClick={() => initiatePayment(PaymentMethod.CARD)} icon={<CreditCard size={20}/>} label="DÉBITO / CRÉDITO" />
                <PaymentButton onClick={() => initiatePayment(PaymentMethod.CASH)} icon={<Wallet size={20}/>} label="DINHEIRO" />
              </div>
            </div>
          ) : (
            <div className="text-center py-24 flex flex-col items-center justify-center opacity-40">
              <Receipt size={64} className="mb-6 text-slate-200" />
              <p className="font-black text-xs uppercase tracking-[0.2em]">Selecione um cliente</p>
            </div>
          )}
        </div>
      </div>

      {pendingPayment && selectedTab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Valor do Pagamento</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase mb-8">Recebimento em {pendingPayment}</p>
            
            <div className="relative mb-8">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</div>
               <input 
                 type="number" 
                 value={paymentAmount} 
                 onChange={e => setPaymentAmount(e.target.value)}
                 className="w-full bg-slate-50 p-6 pl-14 rounded-3xl text-3xl font-black focus:ring-2 focus:ring-yellow-400 outline-none"
                 autoFocus
               />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <button onClick={() => setPaymentAmount((remainingBalance / 2).toFixed(2))} className="bg-slate-100 py-3 rounded-xl font-bold text-xs uppercase text-slate-600">Metade (1/2)</button>
               <button onClick={() => setPaymentAmount(remainingBalance.toFixed(2))} className="bg-slate-100 py-3 rounded-xl font-bold text-xs uppercase text-slate-600">Total</button>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmPayment} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">CONFIRMAR RECEBIMENTO</button>
              <button onClick={() => setPendingPayment(null)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && lastClosedTab && (
        <>
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4 no-print">
            <div className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-2xl text-center relative">
               <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Check size={40} strokeWidth={4} /></div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">
                 {lastClosedTab.status === TabStatus.CLOSED ? 'Conta Finalizada' : 'Pagamento Parcial'}
               </h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">O cupom térmico foi gerado</p>
               <div className="flex flex-col gap-3">
                 <button onClick={handlePrint} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 uppercase tracking-widest text-xs"><Printer size={18} /> Imprimir Comprovante</button>
                 <button onClick={() => setShowSuccessModal(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Ok, Continuar</button>
               </div>
            </div>
          </div>

          <div id="printable-receipt" className="hidden font-mono text-[11px] text-black">
            <div className="text-center mb-4">
              <h1 className="text-lg font-black uppercase mb-1">{settings.companyName}</h1>
              <p className="text-[9px] font-bold">CNPJ: {settings.cnpj}</p>
              <div className="border-b border-black border-dashed my-2" />
              <p className="text-[12px] font-black">{lastClosedTab.status === TabStatus.CLOSED ? 'CUPOM FINAL' : 'COMPROVANTE PARCIAL'}</p>
              <div className="border-b border-black border-dashed my-2" />
            </div>
            <div className="mb-4 text-[10px] space-y-1">
              <div className="flex justify-between"><span>PEDIDO:</span><span className="font-bold">#{lastClosedTab.id.slice(-6).toUpperCase()}</span></div>
              <div className="flex justify-between"><span>DATA:</span><span>{new Date().toLocaleString('pt-BR')}</span></div>
              <div className="flex justify-between"><span>CLIENTE:</span><span>{lastClosedTab.customerName.toUpperCase()}</span></div>
            </div>
            <div className="border-b border-black border-dashed my-3" />
            <table className="w-full text-[10px]">
              <thead><tr className="border-b border-black"><th className="text-left py-1">QTD ITEM</th><th className="text-right py-1">VALOR</th></tr></thead>
              <tbody>
                {lastClosedTab.items.map(item => (
                  <tr key={item.id}><td className="py-1">{item.quantity}x {getProduct(item.productId)?.name.substring(0, 20)}</td><td className="text-right">R${(item.priceAtOrder * item.quantity).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="border-b border-black border-dashed my-3" />
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span>TOTAL CONTA:</span><span>R$ {lastClosedTab.total.toFixed(2)}</span></div>
              <div className="flex justify-between font-black pt-2 border-t border-black"><span>JÁ PAGO:</span><span>R$ {lastClosedTab.amountPaid.toFixed(2)}</span></div>
              <div className="flex justify-between text-[14px] font-black pt-1">
                <span>SALDO DEVEDOR:</span><span>R$ {Math.max(0, lastClosedTab.total - lastClosedTab.amountPaid).toFixed(2)}</span>
              </div>
            </div>
            <div className="border-b border-black border-dashed my-4" />
            <div className="text-center text-[9px] font-bold"><p>OBRIGADO PELA PREFERÊNCIA!</p><p>MULTIFOOD POS</p></div>
            <div className="h-20" />
          </div>
        </>
      )}
    </div>
  );
};

const PaymentButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({ onClick, icon, label }) => (
  <button onClick={onClick} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between font-black text-[10px] tracking-widest text-slate-700 hover:bg-slate-100 active:scale-95 transition-all">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
      {label}
    </div>
    <ArrowRight size={18} />
  </button>
);

export default CashierDashboard;
