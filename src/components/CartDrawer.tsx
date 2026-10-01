import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  totalAmount: number;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalAmount
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingBag className="text-primary" />
            Giỏ Hàng Của Bạn ({items.length})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <ShoppingBag size={64} className="text-gray-300" />
              <p className="text-lg">Giỏ hàng trống</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.productId} className="flex gap-4 p-3 border rounded-xl shadow-sm">
                <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-primary font-semibold mt-1">{formatVND(item.price)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => onRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Tổng tiền:</span>
            <span className="text-xl font-bold text-primary">{formatVND(totalAmount)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={onCheckout}
              disabled={items.length === 0}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Đặt Mua
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all"
            >
              Tiếp Tục Mua
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
