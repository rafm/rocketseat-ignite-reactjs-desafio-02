import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      let product = newCart.find(product => product.id === productId)
      if (!product) {
        const response = await api.get(`/products/${productId}`)
        product = response.data
        if (product) {
          product.amount = 0
          newCart.push(product)
        }
      }
      if (!product) {
        toast.error('Erro na adição do produto')
        return
      }
      const response = await api.get(`/stock/${productId}`)
      const stock: Stock = response.data
      if (product.amount >= stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      product.amount++
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId)
      if (cart.length === newCart.length) {
        toast.error('Erro na remoção do produto')
        return
      }
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }
      const response = await api.get(`/stock/${productId}`)
      const stock: Stock = response.data
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      const newCart = [...cart]
      const product = newCart.find(product => product.id === productId)
      if (!product) {
        return
      }
      product.amount = amount
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
