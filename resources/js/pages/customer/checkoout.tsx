import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { formatRupiah } from '@/lib/format';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function Checkout({ notifications }: PageProps<{ notifications: any[] }>) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const deliveryFee = 13000;

  const { data, setData, post, processing, errors } = useForm({
    address: '',
    items: [] as CartItem[],
  });

  useEffect(() => {
    const items = localStorage.getItem('cartItems');
    if (items) {
      const parsed = JSON.parse(items);
      setCartItems(parsed);
      setData('items', parsed);
    }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('checkout.store'), {
      onSuccess: () => {
        localStorage.removeItem('cartItems');
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Alamat"
          value={data.address}
          onChange={(e) => setData('address', e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />
        {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}

        {cartItems.map((item, i) => (
          <div key={i} className="flex justify-between p-2 border mb-2">
            <div>
              <p>{item.name}</p>
              <p className="text-sm text-gray-500">{item.quantity} x {formatRupiah(item.price)}</p>
            </div>
            <div>{formatRupiah(item.price * item.quantity)}</div>
          </div>
        ))}

        <div className="mt-4 border-t pt-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkir</span>
            <span>{formatRupiah(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="mt-4 w-full bg-blue-600 text-white p-2 rounded"
        >
          {processing ? 'Memproses...' : 'Bayar Sekarang'}
        </button>
      </form>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Notifikasi</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {notifications.map((n, i) => (
            <li key={i}>{n.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
