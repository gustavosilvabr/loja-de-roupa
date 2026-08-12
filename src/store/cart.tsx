import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { markSession } from '../lib/tracking';
import type { CartLine } from '../types';

const STORAGE_KEY = 'xingsun:cart';

type Action =
  | { type: 'add'; line: CartLine }
  | { type: 'remove'; key: string }
  | { type: 'setQty'; key: string; quantity: number }
  | { type: 'clear' }
  | { type: 'hydrate'; lines: CartLine[] };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'hydrate':
      return action.lines;
    case 'add': {
      const existing = state.find((l) => l.key === action.line.key);
      if (existing) {
        return state.map((l) =>
          l.key === action.line.key
            ? { ...l, quantity: l.quantity + action.line.quantity }
            : l
        );
      }
      return [...state, action.line];
    }
    case 'remove':
      return state.filter((l) => l.key !== action.key);
    case 'setQty':
      if (action.quantity <= 0) return state.filter((l) => l.key !== action.key);
      return state.map((l) =>
        l.key === action.key ? { ...l, quantity: action.quantity } : l
      );
    case 'clear':
      return [];
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, 'key'>) => void;
  remove: (key: string) => void;
  setQty: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Uma linha é única por variante + propriedades de personalização. */
const lineKey = (line: Omit<CartLine, 'key'>) =>
  `${line.variantId}::${JSON.stringify(line.properties ?? {})}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'hydrate', lines: JSON.parse(raw) as CartLine[] });
    } catch {
      /* carrinho corrompido — começa vazio */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage cheio ou bloqueado — segue sem persistir */
    }
  }, [lines]);

  const add = useCallback((line: Omit<CartLine, 'key'>) => {
    dispatch({ type: 'add', line: { ...line, key: lineKey(line) } });
    markSession('addedToCart');
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      remove: (key) => dispatch({ type: 'remove', key }),
      setQty: (key, quantity) => dispatch({ type: 'setQty', key, quantity }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [lines, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
