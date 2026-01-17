
import { Product, Category } from './types';

export const MOCK_PRODUCTS: Product[] = [
  // BEBIDAS
  { 
    id: '1', companyId: '1', name: 'Cerveja Lata (Heineken)', price: 12.00, category: Category.BEBIDAS,
    modifierGroups: [
      {
        id: 'bg1', name: 'Temperatura', min: 1, max: 1,
        options: [
          { id: 'bo1', name: 'Gelada', extraPrice: 0 },
          { id: 'bo2', name: 'Natural', extraPrice: 0 }
        ]
      }
    ]
  },
  { 
    id: 'sj1', companyId: '1', name: 'Suco de Laranja Natural', price: 10.00, category: Category.BEBIDAS,
    description: 'Suco extraído da fruta na hora.',
    modifierGroups: [
      {
        id: 'sc1', name: 'Opção de Adoçamento', min: 1, max: 1,
        options: [
          { id: 'opt3', name: 'Com Açúcar', extraPrice: 0 },
          { id: 'opt4', name: 'Com Adoçante', extraPrice: 0 },
          { id: 'opt5', name: 'Natural (Sem nada)', extraPrice: 0 }
        ]
      }
    ]
  },
  { 
    id: 'sj2', companyId: '1', name: 'Suco de Morango', price: 14.00, category: Category.BEBIDAS,
    description: 'Morango fresco selecionado.',
    modifierGroups: [
      {
        id: 'sc1_morango', name: 'Base do Suco', min: 1, max: 1,
        options: [
          { id: 'opt1', name: 'Com Água', extraPrice: 0 },
          { id: 'opt2', name: 'Com Leite', extraPrice: 3.50 }
        ]
      },
      {
        id: 'sc2_morango', name: 'Opção de Adoçamento', min: 1, max: 1,
        options: [
          { id: 'opt3', name: 'Com Açúcar', extraPrice: 0 },
          { id: 'opt4', name: 'Com Adoçante', extraPrice: 0 },
          { id: 'opt5', name: 'Natural (Sem nada)', extraPrice: 0 }
        ]
      }
    ]
  },
  { 
    id: '3', companyId: '1', name: 'Caipirinha Limão', price: 22.00, category: Category.BEBIDAS,
    modifierGroups: [
      {
        id: 'bg2', name: 'Adoçante/Açúcar', min: 1, max: 1,
        options: [
          { id: 'bo3', name: 'Com Açúcar', extraPrice: 0 },
          { id: 'bo4', name: 'Com Adoçante', extraPrice: 0 },
          { id: 'bo5', name: 'Sem nada', extraPrice: 0 }
        ]
      },
      {
        id: 'bg3', name: 'Extras', min: 0, max: 1,
        options: [
          { id: 'bo6', name: 'Dose Dupla de Álcool', extraPrice: 12.00 }
        ]
      }
    ]
  },
  
  // PORÇÕES
  { 
    id: '7', companyId: '1', name: 'Batata Frita', price: 35.00, category: Category.PORCOES,
    modifierGroups: [
      {
        id: 'pg1', name: 'Adicionais', min: 0, max: 3,
        options: [
          { id: 'po1', name: 'Queijo Cheddar', extraPrice: 8.00 },
          { id: 'po2', name: 'Bacon Picado', extraPrice: 6.00 },
          { id: 'po3', name: 'Maionese da Casa', extraPrice: 3.50 }
        ]
      },
      {
        id: 'pg2', name: 'Remover Ingredientes', min: 0, max: 1,
        options: [
          { id: 'po4', name: 'Sem Sal', extraPrice: 0 }
        ]
      }
    ]
  },
  
  // PRATOS
  { 
    id: '11', companyId: '1', name: 'PF de Frango Grelhado', price: 38.00, category: Category.PRATOS,
    modifierGroups: [
      {
        id: 'dg1', name: 'Ponto do Frango', min: 1, max: 1,
        options: [
          { id: 'do1', name: 'Ao Ponto (Suculento)', extraPrice: 0 },
          { id: 'do2', name: 'Bem Passado', extraPrice: 0 }
        ]
      },
      {
        id: 'dg2', name: 'Trocar Acompanhamento', min: 0, max: 1,
        options: [
          { id: 'do3', name: 'Trocar Arroz por Integral', extraPrice: 4.00 },
          { id: 'do4', name: 'Trocar Fritas por Salada', extraPrice: 0 }
        ]
      }
    ]
  },

  // PIZZAS
  {
    id: 'piz1', companyId: '1', name: 'Pizza Gigante (12 fatias)', price: 65.00, category: Category.PIZZAS,
    description: 'Escolha até 2 sabores para sua pizza meio-a-meio.',
    modifierGroups: [
      {
        id: 'pz_g1', name: 'Escolha os Sabores (Até 2)', min: 1, max: 2,
        options: [
          { id: 'pzo1', name: 'Calabresa Tradicional', extraPrice: 0 },
          { id: 'pzo2', name: 'Portuguesa Especial', extraPrice: 5.00 },
          { id: 'pzo3', name: 'Frango com Catupiry', extraPrice: 3.00 },
          { id: 'pzo4', name: 'Quatro Queijos Premium', extraPrice: 7.00 },
          { id: 'pzo5', name: 'Marguerita Gourmet', extraPrice: 0 }
        ]
      },
      {
        id: 'pz_g2', name: 'Borda Recheada', min: 0, max: 1,
        options: [
          { id: 'pzo6', name: 'Borda de Catupiry', extraPrice: 12.00 },
          { id: 'pzo7', name: 'Borda de Chocolate', extraPrice: 15.00 }
        ]
      }
    ]
  },

  // AÇAÍ
  {
    id: 'acai_p', companyId: '2', name: 'Açaí Pequeno (300ml)', price: 15.00, category: Category.ACAI,
    description: 'Comece com nosso açaí puro e adicione seus complementos favoritos!',
    modifierGroups: [
      {
        id: 'acai_frutas', name: 'Escolha suas Frutas', min: 0, max: 3,
        options: [
          { id: 'fruta_banana', name: 'Banana Fatiada', extraPrice: 2.00 },
          { id: 'fruta_morango', name: 'Morango Fresco', extraPrice: 3.00 },
          { id: 'fruta_kiwi', name: 'Kiwi Picado', extraPrice: 3.50 }
        ]
      },
      {
        id: 'acai_cremes', name: 'Cremes e Caldas', min: 0, max: 2,
        options: [
          { id: 'creme_leite_ninho', name: 'Creme de Leite Ninho', extraPrice: 4.00 },
          { id: 'creme_paçoca', name: 'Creme de Paçoca', extraPrice: 4.00 }
        ]
      }
    ]
  }
];

export const CATEGORIES = Object.values(Category);
