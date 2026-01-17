
export enum Category {
  BEBIDAS = 'Bebidas',
  PORCOES = 'Porções',
  PRATOS = 'Pratos',
  SOBREMESAS = 'Sombremesas',
  COMBOS = 'Combos',
  PIZZAS = 'Pizzas',
  MARMITAS = 'Marmitas',
  ACAI = 'Açaí'
}

export enum ItemStatus {
  NEW = 'Novo',
  PREPARING = 'Em preparo',
  READY = 'Pronto',
  DELIVERING = 'Em Rota',
  COMPLETED = 'Entregue'
}

export enum TabStatus {
  OPEN = 'Aberta',
  CLOSED = 'Fechada',
  CANCELLED = 'Cancelada'
}

export enum PaymentStatus {
  PENDING = 'Pendente',
  AWAITING_PAYMENT = 'Aguardando Pagamento',
  PAID = 'Pago',
  FAILED = 'Falhou'
}

export enum PaymentMethod {
  CASH = 'Dinheiro',
  PIX = 'Pix',
  CARD = 'Cartão',
  ONLINE = 'Pagamento Online',
  MERCADO_PAGO_PIX = 'Pix Mercado Pago'
}

export enum OrderType {
  BEACH = 'Praia',
  INDOOR = 'Salão',
  DELIVERY = 'Entrega',
  TAKEAWAY = 'Retirada'
}

export enum TransactionType {
  INCOME = 'Receita',
  EXPENSE = 'Despesa'
}

export interface Transaction {
  id: string;
  companyId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  quantity: number;
  unit: string; // kg, un, l, etc
  minQuantity: number;
}

export interface Closure {
  id: string;
  companyId: string;
  startDate: string;
  endDate: string;
  type: 'shift' | 'daily' | 'weekly' | 'monthly';
  label: string;
  totalSales: number;
  totalExpenses: number;
  netAmount: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  price: number;
  category: Category;
  description?: string;
  image?: string;
  modifierGroups?: ModifierGroup[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  note?: string;
  status: ItemStatus;
  timestamp: string;
  priceAtOrder: number;
  isCombo?: boolean;
  selectedModifiers?: SelectedModifier[];
  marmitaSize?: string;
}

export interface PaymentLog {
  id: string;
  amount: number;
  method: PaymentMethod;
  timestamp: string;
}

export interface Tab {
  id: string;
  companyId: string;
  orderType: OrderType;
  tentNumber?: string;
  deliveryInfo?: DeliveryInfo;
  customerName: string;
  waiterName?: string;
  items: OrderItem[];
  status: TabStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  closedAt?: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  amountPaid: number; 
  paymentLogs: PaymentLog[];
  paymentMethod?: PaymentMethod;
  peopleCount?: number;
  observation?: string;
  wantsCondiments?: boolean;
  wantsCutlery?: boolean;
}

export interface Settings {
  companyId: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  logo?: string;
  operatingShifts: OperatingShift[];
  marmitaConfig: MarmitaConfig;
  serviceFeePercent: number;
  serviceFeeEnabled: boolean;
  deliveryFee: number;
  autoPrintReceipt: boolean;
  printKitchenVia: boolean;
  companyName: string;
  cnpj: string;
  whatsapp?: string;
  address?: string;
  enabledPaymentMethods: PaymentMethod[];
  enabledOrderTypes: OrderType[];
}

export interface DeliveryInfo {
  address: string;
  phone: string;
  complement?: string;
  postalCode?: string;
}

export interface OperatingShift {
  id: string;
  label: string;
  startTime: string; 
  endTime: string;   
  enabled: boolean;
}

export interface MarmitaSize {
  id: string;
  label: string; 
  price: number;
}

export interface MarmitaConfig {
  enabled: boolean;
  dailyMenu: string; 
  ingredients: string[];
  image?: string;
  startTime: string;
  endTime: string;
  sizes: MarmitaSize[];
  modifierGroups?: ModifierGroup[];
}

export interface Combo {
  id: string;
  companyId: string;
  name: string;
  description: string;
  price: number;
  productIds: string[];
  image?: string;
}

export type PromotionSchedule = 'always' | 'daily' | 'monthly' | 'yearly';
export type PromotionType = 'percentage' | 'fixed' | 'badge_only';

export interface Promotion {
  id: string;
  companyId: string;
  title: string;
  description: string;
  badge: string;
  color: string;
  targetType: 'product' | 'category';
  targetId: string; // ID do produto ou nome da categoria
  scheduleType: PromotionSchedule;
  scheduleValue?: string; // Dia da semana (0-6), Dia do mês (1-31), ou Data (MM-DD)
  promoType: PromotionType;
  discountValue: number;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  slug: string;
  deliveryFee: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  companyId: string;
  tabId: string;
  itemId: string;
  productName: string;
  tentNumber?: string;
  customerName: string;
  orderType: OrderType;
  timestamp: string;
  read: boolean;
}
