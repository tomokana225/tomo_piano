
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/Icons';

interface BlogTabProps {
    posts: BlogPost[];
    onSavePost: (post: Partial<BlogPost>) => Promise<boolean>;
    onDeletePost: (id: string) => Promise<boolean>;
}

const formatTimestampForInput = (ts?: number): string => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
};

const parseInputToTimestamp = (str: string): number => {
    return new Date(str).getTime();
};

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onSavePost, onDeletePost }) => {
    const [selectedPost, setSelectedPost] = useState<Partial<BlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // スマホ表示での「編集モード」かどうかを判定（selectedPostがある場合に編集画面を出す）
    const isEditing = !!selectedPost;

    const handleSelectPost = (post: BlogPost) => {
        setSelectedPost({ ...post });
        setSaveStatus('idle');
    };

    const handleNewPost = () => {
        setSelectedPost({ title: '', content: '', isPublished: true, imageUrl: '', createdAt: Date.now() });
        setSaveStatus('idle');
    };

    const handleBackToList = () => {
        setSelectedPost(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!selectedPost) return;
        const { name, value } = e.target;
        setSelectedPost(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedPost) return;
        const { name, checked } = e.target;
        setSelectedPost(prev => ({ ...prev, [name]: checked }));
    };

    const handleSave = async () => {
        if (!selectedPost || !selectedPost.title) {
            alert('タイトルを入力してください。');
            return;
        }
        setIsSaving(true);
        setSaveStatus('idle');
        const success = await onSavePost(selectedPost);
        setSaveStatus(success ? 'success' : 'error');
        if (success) {
            setTimeout(() => setSelectedPost(null), 1500);
        }
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 4000);
    };

    const handleDelete = async () => {
        if (!selectedPost || !selectedPost.id) return;
        if (window.confirm('本当にこの記事を削除しますか？')) {
            setIsDeleting(true);
            const success = await onDeletePost(selectedPost.id);
            if (success) setSelectedPost(null);
            else alert('削除に失敗しました。');
            setIsDeleting(false);
        }
    };
    
    const formatDate = (timestamp?: number) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full">
            {!isEditing ? (
                /* リスト表示 */
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold">投稿済みのお知らせ ({posts.length})</h3>
                        <button onClick={handleNewPost} className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition shadow-md">
                            <PlusIcon className="w-4 h-4" />
                            新規作成
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {posts.map(post => (
                            <button 
                                key={post.id} 
                                onClick={() => handleSelectPost(post)} 
                                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-border-light dark:border-border-dark text-left hover:border-[var(--primary-color)] transition-all shadow-sm flex items-center justify-between group"
                            >
                                <div className="min-w-0 flex-grow">
                                    <p className="font-bold truncate text-base mb-1">{post.title}</p>
                                    <div className="flex items-center gap-2">
                                        {post.isPublished ? 
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">公開中</span> : 
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">下書き</span>
                                        }
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatDate(post.createdAt)}</span>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary-color)] group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                    
                    {posts.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <p className="text-text-secondary-light dark:text-text-secondary-dark">記事がありません。右上のボタンから作成してください。</p>
                        </div>
                    )}
                </div>
            ) : (
                /* 編集画面 */
                <div className="animate-fade-in max-w-2xl mx-auto pb-10">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-6 hover:translate-x-[-4px] transition-transform">
                        <ChevronLeftIcon className="w-5 h-5" />
                        記事一覧に戻る
                    </button>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-6">
                        <h3 className="text-xl font-bold">{selectedPost.id ? '記事を編集' : '新規お知らせ作成'}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">タイトル</label>
                                <input type="text" name="title" value={selectedPost.title || ''} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" placeholder="例: 今後の配信予定について" />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">公開日時</label>
                                    <input
                                        type="datetime-local"
                                        name="createdAt"
                                        value={formatTimestampForInput(selectedPost.createdAt)}
                                        onChange={(e) => setSelectedPost(prev => ({ ...prev, createdAt: parseInputToTimestamp(e.target.value) }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                    />
                                </div>
                                <div className="flex items-center sm:pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-xl w-full">
                                        <input type="checkbox" name="isPublished" checked={selectedPost.isPublished || false} onChange={handleCheckboxChange} className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                                        <span className="text-sm font-bold">記事を公開する</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">内容 (Markdown)</label>
                                <textarea name="content" value={selectedPost.content || ''} onChange={handleInputChange} rows={12} className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar" placeholder="**太字** や [リンク](https://...) が使えます" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">画像URL</label>
                                <input type="text" name="imageUrl" value={selectedPost.imageUrl || ''} onChange={handleInputChange} placeholder="https://..." className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                                {selectedPost.imageUrl && (
                                    <img src={selectedPost.imageUrl} alt="preview" className="mt-4 max-h-48 w-full object-cover rounded-xl border border-border-light dark:border-border-dark" />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                            <div className="w-full sm:w-auto">
                                {selectedPost.id && (
                                    <button onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto px-6 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex items-center justify-center gap-2">
                                        {isDeleting ? <LoadingSpinner className="w-4 h-4" /> : null}
                                        この記事を削除
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                {saveStatus === 'success' && <span className="text-green-500 font-bold text-sm">保存しました！</span>}
                                {saveStatus === 'error' && <span className="text-red-500 font-bold text-sm">保存失敗</span>}
                                <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                                    {isSaving ? '保存中...' : '変更を保存する'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
