
export enum Category {
  BEBIDAS = 'Bebidas',
  PORCOES = 'Porções',
  PRATOS = 'Pratos',
  SOBREMESAS = 'Sombremesas',
  COMBOS = 'Combos',
  PIZZAS = 'Pizzas',
  MARMITAS = 'Marmitas',
  ACAI = 'Açaí' // Nova categoria para açaí
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
  ingredients: string[]; // Lista de itens legíveis
  image?: string;
  startTime: string;
  endTime: string;
  sizes: MarmitaSize[];
  modifierGroups?: ModifierGroup[]; // Opcionais como ovo extra, etc.
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

export interface Promotion {
  id: string;
  companyId: string;
  title: string;
  description: string;
  badge: string;
  color: string;
  targetId?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  slug: string;
  deliveryFee: number;
}

export interface DeliveryInfo {
  address: string;
  phone: string;
  complement?: string;
  postalCode?: string;
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
  paymentMethod?: PaymentMethod;
  peopleCount?: number;
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

export interface Settings {
  companyId: string;
  isOpen: boolean;
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
  enabledPaymentMethods: PaymentMethod[];
  enabledOrderTypes: OrderType[];
}
