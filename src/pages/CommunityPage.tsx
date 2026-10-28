import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Flag,
  Plus,
  Send,
  MapPin,
  Tag,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { CommunityPost, CommunityComment } from '../types.js';
import { Button } from '../components/common/Button.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [cropTag, setCropTag] = useState<string>('General');
  const [state, setState] = useState<string>(user?.profile?.state || 'Madhya Pradesh');

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ posts: CommunityPost[] }>('/community/posts');
      setPosts(res.posts || []);
    } catch (err: any) {
      console.warn('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      addToast({ title: 'Validation', message: 'Title and content are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newPost = await apiRequest<CommunityPost>('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          cropTag: cropTag.trim() || 'General',
          state: state.trim() || 'India',
        }),
      });

      addToast({
        title: lang === 'hi' ? 'पोस्ट प्रकाशित हुई' : 'Discussion Published',
        message: 'Your topic is now active in the community feed.',
        type: 'success',
      });

      setPosts((prev) => [newPost, ...prev]);
      setModalOpen(false);
      setTitle('');
      setBody('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to publish post.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const updated = await apiRequest<CommunityPost>(`/community/posts/${postId}/upvote`, {
        method: 'POST',
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch {
      addToast({ title: 'Error', message: 'Failed to upvote.', type: 'error' });
    }
  };

  const handleReport = async (postId: string) => {
    if (!window.confirm('Report this post for review by platform moderators?')) return;
    try {
      await apiRequest(`/community/posts/${postId}/report`, { method: 'POST' });
      addToast({
        title: 'Report Submitted',
        message: 'Thank you. Our moderation team will audit this post.',
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Failed to report post.', type: 'error' });
    }
  };

  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));

    if (nextState && !commentsMap[postId]) {
      try {
        const res = await apiRequest<{ comments: CommunityComment[] }>(`/community/posts/${postId}/comments`);
        setCommentsMap((prev) => ({ ...prev, [postId]: res.comments || [] }));
      } catch (err) {
        console.warn('Failed to load comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (newCommentText[postId] || '').trim();
    if (!text) return;

    try {
      const newComment = await apiRequest<CommunityComment>(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      });

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
      );

      setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      addToast({ title: 'Error', message: 'Failed to submit comment.', type: 'error' });
    }
  };

  const filteredPosts = posts.filter((p) => selectedTag === 'all' || p.cropTag.toLowerCase() === selectedTag.toLowerCase());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <PageHeader
        badge={lang === 'hi' ? 'किसान समुदाय व अनुभव विनिमय' : 'Peer Farmer Knowledge Exchange'}
        title={lang === 'hi' ? 'किसान चर्चा मंच' : 'Farmer Community'}
        description={
          lang === 'hi'
            ? 'क्षेत्रीय किसानों के साथ जैविक उपचार, मौसम अनुभव और मंडी की वास्तविक स्थिति साझा करें।'
            : 'Share verified practical techniques, IPM observations, and regional crop experiences.'
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#071B13]" />}
          >
            <span>{lang === 'hi' ? 'नया विषय शुरू करें' : 'Start Discussion'}</span>
          </Button>
        }
      />

      {/* Filter Tags */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {['all', 'Cotton', 'Wheat', 'Soybean', 'Paddy', 'Mustard', 'Organic', 'Irrigation'].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              selectedTag.toLowerCase() === tag.toLowerCase()
                ? 'bg-[#00B879] text-[#071B13] font-bold shadow-[0_0_15px_rgba(0,184,121,0.3)]'
                : 'bg-black/40 text-[#B6F5D9] border border-emerald-500/20 hover:border-emerald-400/40'
            }`}
          >
            {tag === 'all' ? (lang === 'hi' ? 'सभी विषय' : 'All Topics') : tag}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-black/35 rounded-2xl p-12 text-center border border-dashed border-emerald-500/25">
          <MessageSquare className="w-12 h-12 text-[#54F5BC]/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F4F7F1]">
            {lang === 'hi' ? 'इस श्रेणी में कोई चर्चा नहीं मिली' : 'No Discussions Found'}
          </h3>
          <p className="text-xs text-[#B6F5D9]/80 max-w-md mx-auto mt-1 mb-4">
            {lang === 'hi'
              ? 'पहला प्रश्न या अनुभव साझा करके अपने साथी किसानों की सहायता करें।'
              : 'Be the first to share your field experience or ask a question to fellow cultivators.'}
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {lang === 'hi' ? 'चर्चा शुरू करें' : 'Start Discussion'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const comments = commentsMap[post.id] || [];

            return (
              <div
                key={post.id}
                className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-4 hover:border-emerald-400/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#B6F5D9]/60 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F4F7F1]">{post.authorName}</span>
                      <span className="text-emerald-500/30">•</span>
                      <span className="flex items-center gap-1 text-[#B6F5D9]/70">
                        <MapPin className="w-3 h-3 text-[#54F5BC]" />
                        <span>{post.state}</span>
                      </span>
                      <span className="text-emerald-500/30">•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[#54F5BC] font-semibold text-[10px] uppercase border border-emerald-500/20">
                      {post.cropTag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#F4F7F1] tracking-tight">{post.title}</h3>
                  <p className="text-xs text-[#B6F5D9]/80 mt-2 leading-relaxed">{post.body}</p>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-[#00B879]/20 hover:text-[#54F5BC] text-[#B6F5D9] font-semibold border border-emerald-500/15 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#54F5BC]" />
                      <span>{post.upvotes || 0} Useful</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-[#B6F5D9] font-semibold border border-emerald-500/15 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#54F5BC]" />
                      <span>{post.commentCount || 0} Replies</span>
                      {isCommentsOpen ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleReport(post.id)}
                    className="text-[#B6F5D9]/40 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Report post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Comment Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-emerald-500/20 space-y-3 bg-black/30 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-[#54F5BC] uppercase tracking-wider">
                      Replies ({comments.length})
                    </h4>

                    {comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="bg-black/40 p-3 rounded-xl border border-emerald-500/15 text-xs space-y-1 shadow-2xs text-[#F4F7F1]"
                          >
                            <div className="flex items-center justify-between text-[#B6F5D9]/70 font-medium">
                              <span className="font-bold text-[#F4F7F1]">{comm.authorName}</span>
                              <span className="text-[10px] text-[#B6F5D9]/50">{new Date(comm.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[#B6F5D9]/90 leading-relaxed">{comm.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#B6F5D9]/60 italic">No comments yet. Share your thoughts!</p>
                    )}

                    {/* Add reply input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a helpful response..."
                        value={newCommentText[post.id] || ''}
                        onChange={(e) =>
                          setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        className="flex-1 bg-[#071B13]/80 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-[#F4F7F1] placeholder:text-[#B6F5D9]/40 focus:outline-none focus:ring-2 focus:ring-[#00B879]"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAddComment(post.id)}
                      >
                        <Send className="w-3.5 h-3.5 text-[#071B13]" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Start Discussion */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === 'hi' ? 'नया चर्चा विषय शुरू करें' : 'Start Community Discussion'}
      >
        <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
          <Input
            label={lang === 'hi' ? 'विषय का शीर्षक' : 'Discussion Title'}
            placeholder="e.g. Best bio-fertilizers for Wheat in Black Soil?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'फसल टैग' : 'Crop / Category Tag'}
              placeholder="e.g. Wheat, Cotton, Bio-Fertilizer"
              value={cropTag}
              onChange={(e) => setCropTag(e.target.value)}
            />
            <Input
              label={lang === 'hi' ? 'राज्य' : 'State / Region'}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#B6F5D9] uppercase tracking-wider mb-1.5">
              {lang === 'hi' ? 'चर्चा का विवरण' : 'Topic Description & Observations'}
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share details of your experience, dosages applied, or specific questions for other cultivators..."
              className="w-full rounded-xl border border-emerald-500/30 bg-[#071B13]/80 p-3 text-xs text-[#F4F7F1] placeholder:text-[#B6F5D9]/40 focus:outline-none focus:ring-2 focus:ring-[#00B879]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-500/20">
            <Button type="button" variant="glass" onClick={() => setModalOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {lang === 'hi' ? 'प्रकाशित करें' : 'Publish Topic'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
