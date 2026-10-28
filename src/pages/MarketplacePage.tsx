import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  IndianRupee,
  Truck,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Order, OrderItem } from '../types.js';
import { Button } from '../components/common/Button.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';

interface CatalogProduct {
  id: string;
  title: string;
  category: 'bio_fertilizer' | 'certified_seeds' | 'soil_testing' | 'irrigation';
  price: number;
  unit: string;
  manufacturer: string;
  description: string;
  certifiedBy: string;
}

const PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod_tricho_bio',
    title: 'Trichoderma Viride 1.5% WP Bio-Fungicide',
    category: 'bio_fertilizer',
    price: 320,
    unit: '1 kg pack',
    manufacturer: 'National Agro Bio-Tech',
    description: 'Biological control agent effective against root rot, damping off, and collar rot in pulses and oilseeds.',
    certifiedBy: 'Central Insecticides Board (CIB&RC)',
  },
  {
    id: 'prod_psb_bio',
    title: 'Phosphate Solubilizing Bacteria (PSB) Culture',
    category: 'bio_fertilizer',
    price: 180,
    unit: '1 Litre bottle',
    manufacturer: 'ICAR-IARI Bio-Culture Unit',
    description: 'Mobilizes fixed insoluble soil phosphorus into available orthophosphates for rapid root growth.',
    certifiedBy: 'Fertilizer Control Order (FCO) Approved',
  },
  {
    id: 'prod_wheat_seed_hd',
    title: 'Certified Wheat Seed HD-2967 (Breeder Class)',
    category: 'certified_seeds',
    price: 1450,
    unit: '40 kg bag',
    manufacturer: 'National Seeds Corporation (NSC)',
    description: 'High-yielding, rust-resistant bread wheat variety recommended for North-Western and Central plains.',
    certifiedBy: 'State Seed Certification Agency (SSCA)',
  },
  {
    id: 'prod_gram_seed_jaki',
    title: 'Certified Chickpea (Gram) Seed JAKI-9218',
    category: 'certified_seeds',
    price: 2100,
    unit: '30 kg bag',
    manufacturer: 'Madhya Pradesh State Seeds Dev Corp',
    description: 'Wilt tolerant, bold-seeded desi gram with high branching and 92% certified germination rate.',
    certifiedBy: 'SSCA Certified Blue Tag',
  },
  {
    id: 'prod_soil_digital_meter',
    title: 'Portable Digital Soil pH & EC Conductivity Meter',
    category: 'soil_testing',
    price: 1850,
    unit: '1 complete kit',
    manufacturer: 'AgriSens Instruments',
    description: 'Direct soil insertion probe with LCD screen and automatic temperature compensation for on-field testing.',
    certifiedBy: 'ISO 9001:2015 Tested',
  },
  {
    id: 'prod_drip_repair_kit',
    title: 'Micro-Irrigation Pressure Compensating Emitters (4 LPH)',
    category: 'irrigation',
    price: 490,
    unit: 'Pack of 100 pcs',
    manufacturer: 'Jain Irrigation Systems Authorized',
    description: 'Uniform water distribution on undulating fields with self-flushing clog-resistant silicone diaphragm.',
    certifiedBy: 'BIS ISI Certified',
  },
];

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Checkout form
  const [address, setAddress] = useState<string>(
    user?.profile?.district ? `${user.profile.district}, ${user.profile.state || 'India'}` : ''
  );
  const [phone, setPhone] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<Order['paymentMode']>('cash_on_delivery');

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await apiRequest<{ orders: Order[] }>('/orders');
      setOrders(res.orders || []);
    } catch (err: any) {
      console.warn('Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    addToast({ title: 'Added to Inquiry', message: 'Item added to your input cart.', type: 'info' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartItems: OrderItem[] = Object.entries(cart).map(([id, qty]) => {
    const prod = PRODUCTS.find((p) => p.id === id)!;
    return {
      productId: prod.id,
      title: prod.title,
      quantity: qty,
      unitPrice: prod.price,
      unit: prod.unit,
    };
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !phone.trim() || cartItems.length === 0) {
      addToast({ title: 'Validation', message: 'Delivery address and contact phone are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await apiRequest<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          farmerName: user?.fullName || 'Farmer',
          items: cartItems,
          totalAmount: cartTotal,
          deliveryAddress: address.trim(),
          phone: phone.trim(),
          paymentMode,
        }),
      });

      addToast({
        title: lang === 'hi' ? 'ऑर्डर पूछताछ दर्ज की गई' : 'Order Inquiry Placed',
        message: `Order #${order.id.slice(-6)} recorded. Our regional coordinator will verify dispatch.`,
        type: 'success',
      });

      setOrders((prev) => [order, ...prev]);
      setCart({});
      setCheckoutOpen(false);
      setActiveTab('orders');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to place order inquiry.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatched / In Transit</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Processing Stock</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Confirmation</span>
          </span>
        );
    }
  };

  const filteredProducts = PRODUCTS.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <PageHeader
        badge={lang === 'hi' ? 'प्रमाणित कृषि इनपुट व उपकरण' : 'Certified Agricultural Inputs & Hardware'}
        title={lang === 'hi' ? 'कृषि इनपुट व ऑर्डर ट्रैकर' : 'Agri Inputs & Marketplace'}
        description={
          lang === 'hi'
            ? 'प्रमाणित बीज, जैविक जैव-उर्वरक एवं मृदा परीक्षण उपकरणों की पारदर्शी खरीद पूछताछ।'
            : 'Direct inquiry tracking for certified bio-fertilizers, breeder seeds, and diagnostic instruments.'
        }
        action={
          cartItems.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCheckoutOpen(true)}
              icon={<ShoppingBag className="w-4 h-4 text-[#071B13]" />}
            >
              <span>
                Inquiry Cart ({cartItems.length}) • ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-emerald-500/20 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'catalog'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          {lang === 'hi' ? 'इनपुट सूची (कैटलॉग)' : 'Certified Input Catalog'} ({PRODUCTS.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          {lang === 'hi' ? 'मेरे ऑर्डर व पूछताछ' : 'My Inquiries & Orders'} ({orders.length})
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Inputs' },
              { id: 'bio_fertilizer', label: 'Bio-Fertilizers & IPM' },
              { id: 'certified_seeds', label: 'Certified Seeds (ICAR/NSC)' },
              { id: 'soil_testing', label: 'Soil Testing Kits' },
              { id: 'irrigation', label: 'Micro-Irrigation Hardware' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#00B879] text-[#071B13] font-bold shadow-[0_0_15px_rgba(0,184,121,0.3)]'
                    : 'bg-black/40 text-[#B6F5D9] border border-emerald-500/20 hover:border-emerald-400/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const qtyInCart = cart[prod.id] || 0;

              return (
                <div
                  key={prod.id}
                  className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs hover:border-emerald-400/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-[#B6F5D9] uppercase border border-emerald-500/20">
                        {prod.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-[#54F5BC] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#54F5BC]" />
                        <span>Certified</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#F4F7F1] tracking-tight">{prod.title}</h3>
                    <div className="text-xs text-[#B6F5D9]/60 mt-0.5">{prod.manufacturer}</div>

                    <p className="text-xs text-[#B6F5D9]/80 my-3 leading-relaxed">{prod.description}</p>

                    <div className="bg-black/35 p-2.5 rounded-xl border border-emerald-500/15 text-[11px] text-[#B6F5D9]/70 mb-4">
                      <span className="font-bold text-[#F4F7F1]">Standards: </span>
                      {prod.certifiedBy}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-[#54F5BC] flex items-center gap-0.5">
                        <IndianRupee className="w-4 h-4" />
                        <span>{prod.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[10px] text-[#B6F5D9]/60 font-medium">{prod.unit}</div>
                    </div>

                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2 bg-black/50 border border-emerald-500/25 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(prod.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#F4F7F1] hover:bg-white/20 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-[#F4F7F1] px-1">{qtyInCart}</span>
                        <button
                          onClick={() => updateQuantity(prod.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#00B879] flex items-center justify-center text-[#071B13] font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => addToCart(prod.id)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Inquire</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-black/35 rounded-2xl p-12 text-center border border-dashed border-emerald-500/25">
              <Package className="w-12 h-12 text-[#54F5BC]/60 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#F4F7F1]">
                {lang === 'hi' ? 'कोई सक्रिय ऑर्डर पूछताछ नहीं है' : 'No Order Inquiries Placed Yet'}
              </h3>
              <p className="text-xs text-[#B6F5D9]/80 max-w-md mx-auto mt-1 mb-4">
                {lang === 'hi'
                  ? 'कैटलॉग से अपनी पसंद के बीज या जैव-उर्वरक चुनें और ऑर्डर इंक्वायरी सबमिट करें।'
                  : 'Add certified inputs from our catalog to place an order inquiry.'}
              </p>
              <Button variant="primary" onClick={() => setActiveTab('catalog')}>
                {lang === 'hi' ? 'कैटलॉग देखें' : 'Browse Input Catalog'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-500/20 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#F4F7F1]">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-emerald-500/30">•</span>
                        <span className="text-xs text-[#B6F5D9]/60">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-[#B6F5D9]/70 mt-0.5">
                        Destination: {order.deliveryAddress}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-base text-[#54F5BC]">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#B6F5D9]/60 capitalize">
                          {order.paymentMode.replace(/_/g, ' ')}
                        </div>
                      </div>
                      {getOrderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-black/35 border border-emerald-500/15"
                      >
                        <span className="font-medium text-[#F4F7F1]">
                          {item.title} <span className="text-[#B6F5D9]/60">× {item.quantity}</span>
                        </span>
                        <span className="font-bold text-[#54F5BC]">
                          ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Checkout */}
      <Modal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title={lang === 'hi' ? 'ऑर्डर पूछताछ पुष्टि' : 'Confirm Input Inquiry Order'}
      >
        <form onSubmit={handleCheckout} className="space-y-4 pt-2">
          {/* Summary */}
          <div className="bg-black/40 p-4 rounded-xl border border-emerald-500/20 space-y-2 text-xs">
            <span className="font-bold text-[#54F5BC] block uppercase tracking-wider">
              Selected Inquiries ({cartItems.length})
            </span>
            {cartItems.map((item) => (
              <div key={item.productId} className="flex justify-between text-[#F4F7F1]">
                <span>
                  {item.title} ({item.quantity} {item.unit})
                </span>
                <span className="font-semibold text-[#54F5BC]">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-black text-sm text-[#F4F7F1]">
              <span>Total Estimated Amount</span>
              <span className="text-[#54F5BC]">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Input
            label={lang === 'hi' ? 'डिलीवरी का पता / गांव' : 'Delivery Address / Village'}
            placeholder="e.g. Near Primary School, Vill. Sanwer, Dist. Indore"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <Input
            label={lang === 'hi' ? 'संपर्क मोबाइल नंबर' : 'Contact Phone for Dispatch Verification'}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('cash_on_delivery')}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                paymentMode === 'cash_on_delivery'
                  ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] ring-1 ring-[#00B879]'
                  : 'border-emerald-500/20 bg-black/40 text-[#B6F5D9]'
              }`}
            >
              Cash on Delivery (COD)
              <span className="block text-[10px] font-normal text-[#B6F5D9]/70 mt-0.5">Pay when stock arrives</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('direct_bank_transfer')}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                paymentMode === 'direct_bank_transfer'
                  ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] ring-1 ring-[#00B879]'
                  : 'border-emerald-500/20 bg-black/40 text-[#B6F5D9]'
              }`}
            >
              Bank / UPI Transfer
              <span className="block text-[10px] font-normal text-[#B6F5D9]/70 mt-0.5">Direct to cooperative</span>
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-500/20">
            <Button type="button" variant="glass" onClick={() => setCheckoutOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {lang === 'hi' ? 'ऑर्डर दर्ज करें' : 'Place Inquiry Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
