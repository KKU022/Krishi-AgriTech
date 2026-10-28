import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Layers,
  HelpCircle,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  EyeOff,
  Trash2,
  Send,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Consultation, Order, CommunityPost, UserAccount } from '../types.js';
import { Button } from '../components/common/Button.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';

interface AdminMetrics {
  totalFarmers: number;
  totalFarms: number;
  activeConsultations: number;
  pendingOrders: number;
  totalPosts: number;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'consultations' | 'orders' | 'moderation' | 'users'>('consultations');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Response modal
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState<boolean>(false);
  const [expertNote, setExpertNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const [metricsRes, cnsRes, ordRes, postsRes, usersRes] = await Promise.all([
        apiRequest<AdminMetrics>('/admin/metrics'),
        apiRequest<{ consultations: Consultation[] }>('/admin/consultations'),
        apiRequest<{ orders: Order[] }>('/admin/orders'),
        apiRequest<{ posts: CommunityPost[] }>('/community/posts'),
        apiRequest<{ users: UserAccount[] }>('/admin/users'),
      ]);

      setMetrics(metricsRes);
      setConsultations(cnsRes.consultations || []);
      setOrders(ordRes.orders || []);
      setPosts(postsRes.posts || []);
      setUsers(usersRes.users || []);
    } catch (err: any) {
      console.warn('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-[#0D3022]/90 backdrop-blur-2xl rounded-3xl p-12 text-center border border-emerald-500/20 shadow-sm max-w-xl mx-auto my-12 text-[#F4F7F1]">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-300 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#F4F7F1]">Administrator Access Restricted</h2>
        <p className="text-sm text-[#B6F5D9]/80 mt-2 mb-6 leading-relaxed">
          The AgriTech governance console is reserved for platform administrators and certified agronomist moderators. Log in with an authorized administrator account to manage queues.
        </p>
        <div className="text-xs text-[#B6F5D9]/50">
          Administrator access must be provisioned by the platform operator.
        </div>
      </div>
    );
  }

  const handleOpenResponse = (c: Consultation) => {
    setSelectedConsultation(c);
    setExpertNote(c.expertResponse || '');
    setResponseModalOpen(true);
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation || !expertNote.trim()) return;

    try {
      setIsSubmitting(true);
      const updated = await apiRequest<Consultation>(`/admin/consultations/${selectedConsultation.id}/respond`, {
        method: 'PUT',
        body: JSON.stringify({
          expertResponse: expertNote.trim(),
          status: 'resolved',
        }),
      });

      addToast({
        title: 'Advisory Published',
        message: `Response dispatched to ${selectedConsultation.farmerName} for ${selectedConsultation.crop}.`,
        type: 'success',
      });

      setConsultations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setResponseModalOpen(false);
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to dispatch expert response.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await apiRequest<Order>(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      addToast({
        title: 'Status Updated',
        message: `Order #${orderId.slice(-6)} set to ${status}.`,
        type: 'info',
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      addToast({ title: 'Error', message: 'Failed to update order status.', type: 'error' });
    }
  };

  const handleModeratePost = async (postId: string, status: CommunityPost['status']) => {
    try {
      const updated = await apiRequest<CommunityPost>(`/admin/posts/${postId}/moderate`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      addToast({
        title: 'Post Moderated',
        message: `Status updated to ${status}.`,
        type: 'info',
      });

      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      addToast({ title: 'Error', message: 'Failed to moderate post.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <PageHeader
        badge="Platform Governance & Agronomy Operations"
        title="Administrator Console"
        description="Supervise expert consultation inquiries, order logistics, and farmer community moderation."
        action={
          <div className="flex items-center gap-2 bg-[#00B879]/20 px-3 py-1.5 rounded-xl border border-[#00B879]/40 text-xs font-bold text-[#54F5BC]">
            <span className="w-2 h-2 rounded-full bg-[#54F5BC] animate-pulse" />
            <span>Admin: {user?.email}</span>
          </div>
        }
      />

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <div className="text-[10px] font-bold text-[#B6F5D9]/70 uppercase tracking-wider">Farmers</div>
          <div className="text-2xl font-black text-[#54F5BC] mt-0.5">{metrics?.totalFarmers || users.length}</div>
        </div>

        <div className="bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <div className="text-[10px] font-bold text-[#B6F5D9]/70 uppercase tracking-wider">Parcels</div>
          <div className="text-2xl font-black text-[#54F5BC] mt-0.5">{metrics?.totalFarms || 0}</div>
        </div>

        <div className="bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <div className="text-[10px] font-bold text-[#B6F5D9]/70 uppercase tracking-wider">Inquiries</div>
          <div className="text-2xl font-black text-[#FFC76A] mt-0.5">
            {consultations.filter((c) => c.status !== 'resolved').length}
          </div>
        </div>

        <div className="bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <div className="text-[10px] font-bold text-[#B6F5D9]/70 uppercase tracking-wider">Open Orders</div>
          <div className="text-2xl font-black text-sky-400 mt-0.5">
            {orders.filter((o) => o.status === 'pending_confirmation' || o.status === 'processing').length}
          </div>
        </div>

        <div className="bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <div className="text-[10px] font-bold text-[#B6F5D9]/70 uppercase tracking-wider">Posts</div>
          <div className="text-2xl font-black text-[#54F5BC] mt-0.5">{posts.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-500/20 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'consultations'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          Consultation Queue ({consultations.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          Order Inquiries ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'moderation'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          Community Moderation ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'text-[#54F5BC] border-b-2 border-[#54F5BC]'
              : 'text-[#B6F5D9]/60 hover:text-[#F4F7F1]'
          }`}
        >
          Farmer Registry ({users.length})
        </button>
      </div>

      {/* TAB 1: Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {consultations.length === 0 ? (
            <div className="bg-black/35 rounded-2xl p-8 text-center text-[#B6F5D9]/60 text-xs border border-emerald-500/20">
              No consultation requests in queue.
            </div>
          ) : (
            consultations.map((c) => (
              <div
                key={c.id}
                className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-500/20 gap-2">
                  <div>
                    <span className="font-bold text-sm text-[#F4F7F1]">{c.farmerName}</span>
                    <span className="text-emerald-500/30 mx-1.5">•</span>
                    <span className="text-xs font-semibold text-[#54F5BC]">{c.crop}</span>
                    <span className="text-emerald-500/30 mx-1.5">•</span>
                    <span className="text-xs text-[#B6F5D9]/70">{c.district}, {c.state}</span>
                    {c.farmerPhone && (
                      <span className="text-xs text-[#B6F5D9]/50 ml-2">({c.farmerPhone})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        c.status === 'resolved'
                          ? 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                          : 'bg-amber-500/20 text-[#FFC76A] border-amber-500/30'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenResponse(c)}
                      className="text-xs"
                    >
                      {c.status === 'resolved' ? 'Edit Advisory' : 'Provide Advisory'}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-[#F4F7F1] leading-relaxed bg-black/40 p-3 rounded-xl border border-emerald-500/15">
                  <span className="font-bold text-[#54F5BC] block mb-0.5">Symptom Query:</span>
                  {c.question}
                </p>

                {c.expertResponse && (
                  <div className="text-xs text-[#F4F7F1] bg-[#00B879]/15 p-3 rounded-xl border border-[#00B879]/30">
                    <span className="font-bold text-[#54F5BC] block mb-0.5">
                      Agronomist Response ({c.assignedExpert || 'Admin Specialist'}):
                    </span>
                    {c.expertResponse}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-black/35 rounded-2xl p-8 text-center text-[#B6F5D9]/60 text-xs border border-emerald-500/20">
              No order inquiries received.
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-500/20 gap-2">
                  <div>
                    <span className="font-bold text-sm text-[#F4F7F1]">
                      Order #{o.id.slice(-6).toUpperCase()} • {o.farmerName}
                    </span>
                    <div className="text-xs text-[#B6F5D9]/70 mt-0.5">
                      Phone: {o.phone} • Address: {o.deliveryAddress}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-sm text-[#54F5BC]">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#B6F5D9]/60 uppercase">{o.paymentMode.replace(/_/g, ' ')}</div>
                    </div>

                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                      className="bg-[#071B13] border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#F4F7F1] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00B879]"
                    >
                      <option value="pending_confirmation" className="bg-[#071B13]">Pending Confirmation</option>
                      <option value="processing" className="bg-[#071B13]">Processing Stock</option>
                      <option value="shipped" className="bg-[#071B13]">Shipped</option>
                      <option value="delivered" className="bg-[#071B13]">Delivered</option>
                      <option value="cancelled" className="bg-[#071B13]">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {o.items.map((item, i) => (
                    <div key={i} className="text-xs text-[#F4F7F1] flex justify-between bg-black/35 px-3 py-1.5 rounded-lg border border-emerald-500/15">
                      <span>{item.title} × {item.quantity}</span>
                      <span className="font-bold text-[#54F5BC]">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Community Moderation */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#F4F7F1]">{post.authorName}</span>
                  <span className="text-emerald-500/30">•</span>
                  <span className="text-[#B6F5D9]/70">{post.state}</span>
                  <span className="text-emerald-500/30">•</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[#54F5BC] font-semibold text-[10px] border border-emerald-500/20">
                    {post.cropTag}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      post.status === 'hidden'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : post.status === 'flagged'
                        ? 'bg-amber-500/20 text-[#FFC76A] border-amber-500/30'
                        : 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                    }`}
                  >
                    {post.status} ({post.reportCount || 0} reports)
                  </span>

                  {post.status === 'hidden' ? (
                    <Button
                      size="sm"
                      variant="glass"
                      onClick={() => handleModeratePost(post.id, 'active')}
                      className="text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Unhide
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModeratePost(post.id, 'hidden')}
                      className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-950/30"
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Hide Post
                    </Button>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-sm text-[#F4F7F1]">{post.title}</h4>
              <p className="text-xs text-[#B6F5D9]/80 leading-relaxed">{post.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Farmer Registry */}
      {activeTab === 'users' && (
        <div className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl border border-emerald-500/20 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/50 border-b border-emerald-500/20 text-[#54F5BC] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Farmer Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Onboarding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/15 text-[#F4F7F1] font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 font-bold text-[#F4F7F1]">{u.fullName}</td>
                  <td className="p-3.5 text-[#B6F5D9]/80">{u.email}</td>
                  <td className="p-3.5 text-[#B6F5D9]/70">
                    {u.profile?.district || 'Central'}, {u.profile?.state || 'India'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                      }`}
                    >
                      {u.role || 'farmer'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {u.profile?.onboardingCompleted ? (
                      <span className="text-[#54F5BC] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-[#FFC76A] font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Step {u.profile?.onboardingStep || 1}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Agronomist Response */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        title={`Advisory Recommendation: ${selectedConsultation?.crop}`}
      >
        <form onSubmit={handleSendResponse} className="space-y-4 pt-2">
          <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20 text-xs text-[#F4F7F1]">
            <span className="font-bold text-[#54F5BC] block mb-1">
              Farmer Query ({selectedConsultation?.farmerName}):
            </span>
            {selectedConsultation?.question}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#B6F5D9] uppercase tracking-wider mb-1.5">
              Verified Agronomist Guidance
            </label>
            <textarea
              rows={5}
              value={expertNote}
              onChange={(e) => setExpertNote(e.target.value)}
              placeholder="Provide evidence-based biological, cultural, or organic management advice. Include dosage caution and laboratory testing instructions..."
              className="w-full rounded-xl border border-emerald-500/30 bg-[#071B13]/80 p-3 text-xs text-[#F4F7F1] placeholder:text-[#B6F5D9]/40 focus:outline-none focus:ring-2 focus:ring-[#00B879]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-500/20">
            <Button type="button" variant="glass" onClick={() => setResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Send Advisory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
