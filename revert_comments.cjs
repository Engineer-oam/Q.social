const fs = require('fs');

const commentsCode = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getComments, addComment, deleteComment } from '../features/posts/interactionService';
import { Comment, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Send, X, MoreHorizontal, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentsProps {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}

export default function Comments({ postId, onClose, onCommentAdded }: CommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<(Comment & { author?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = async (isLoadMore = false) => {
    if (!hasMore && isLoadMore) return;
    
    try {
      const snapshot = await getComments(postId, isLoadMore ? lastDoc : undefined);
      
      const newComments: typeof comments = [];
      for (const d of snapshot.docs) {
        const data = { id: d.id, ...d.data() } as Comment;
        let author: UserProfile | undefined;
        try {
          const authorDoc = await getDoc(doc(db, 'profiles', data.userId));
          if (authorDoc.exists()) author = { id: authorDoc.id, ...authorDoc.data() } as UserProfile;
        } catch (e) {}
        newComments.push({ ...data, author });
      }
      
      if (isLoadMore) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < 20) setHasMore(false);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;
    setIsSubmitting(true);
    try {
      await addComment(postId, profile.id, newComment);
      setNewComment('');
      onCommentAdded();
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm("Delete this comment?")) {
      await deleteComment(commentId, postId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col md:rounded-2xl border border-q-surface-border overflow-hidden animate-in slide-in-from-bottom-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-q-surface-border bg-q-surface/50">
        <h3 className="font-bold text-white text-lg">Comments</h3>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-q-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-q-text-muted">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-q-panel overflow-hidden flex-shrink-0 mt-1">
                {comment.author?.photoURL ? (
                  <img src={comment.author.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">
                    {comment.author?.displayName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{comment.author?.displayName}</span>
                    <span className="text-xs text-q-text-muted">
                      {formatDistanceToNow(comment.createdAt)} ago
                    </span>
                  </div>
                  {comment.userId === profile?.id && (
                    <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-400 p-1">
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-q-text mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
        
        {hasMore && comments.length > 0 && (
          <button 
            onClick={() => fetchComments(true)}
            className="w-full py-2 text-sm text-q-primary font-medium hover:underline"
          >
            Load more comments
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-q-surface-border bg-q-panel/50">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-q-surface overflow-hidden flex-shrink-0">
             {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">
                  {profile?.displayName?.[0]}
                </div>
              )}
          </div>
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-q-text-muted outline-none text-sm"
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-2 text-q-primary disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/Comments.tsx', commentsCode);
