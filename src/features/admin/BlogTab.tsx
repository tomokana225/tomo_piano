import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PlusIcon } from '../../components/ui/Icons';

interface BlogTabProps {
    posts: BlogPost[];
    onSavePost: (post: Partial<BlogPost>) => Promise<boolean>;
    onDeletePost: (id: string) => Promise<boolean>;
}

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onSavePost, onDeletePost }) => {
    const [selectedPost, setSelectedPost] = useState<Partial<BlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        // If the selected post is being edited, refresh its data from the main posts list
        // This ensures the editor has the latest data if it's updated in the background
        if (selectedPost?.id) {
            const updatedPost = posts.find(p => p.id === selectedPost.id);
            if (updatedPost) {
                // Keep local unsaved changes by merging
                setSelectedPost(prev => ({...updatedPost, ...prev}));
            } else {
                // The post was deleted, so deselect it
                setSelectedPost(null);
            }
        }
    }, [posts, selectedPost?.id]);

    const handleSelectPost = (post: BlogPost) => {
        setSelectedPost({ ...post });
        setSaveStatus('idle');
    };

    const handleNewPost = () => {
        setSelectedPost({ title: '', content: '', isPublished: false, imageUrl: '' });
        setSaveStatus('idle');
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

        if (success && !selectedPost.id) {
            setSelectedPost(null); // Clear form after new post creation
        }

        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const handleDelete = async () => {
        if (!selectedPost || !selectedPost.id) return;
        if (window.confirm('本当にこの記事を削除しますか？')) {
            setIsDeleting(true);
            
            // The logic to delete the image from storage is now removed.
            // We only need to delete the Firestore document.
            const success = await onDeletePost(selectedPost.id);

            if (success) {
                setSelectedPost(null);
            } else {
                alert('削除に失敗しました。');
            }
            setIsDeleting(false);
        }
    };
    
    const formatDate = (timestamp?: number) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">お知らせ一覧</h3>
                    <button onClick={handleNewPost} className="flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md">
                        <PlusIcon className="w-4 h-4" />
                        新規作成
                    </button>
                </div>
                <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-md p-2 overflow-y-auto custom-scrollbar">
                    {posts.length > 0 ? (
                        <ul className="space-y-2">
                            {posts.map(post => (
                                <li key={post.id}>
                                    <button onClick={() => handleSelectPost(post)} className={`w-full text-left p-3 rounded-md transition ${selectedPost?.id === post.id ? 'bg-cyan-100 dark:bg-cyan-600/50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        <p className="font-semibold truncate">{post.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {post.isPublished ? <span className="text-green-600 dark:text-green-400">公開済み</span> : <span className="text-yellow-600 dark:text-yellow-400">下書き</span>}
                                            {' - '}{formatDate(post.createdAt)}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : ( <p className="text-gray-500 dark:text-gray-400 text-center py-4">記事がありません。</p> )}
                </div>
            </div>

            <div className="md:col-span-2 flex flex-col min-h-0">
                {selectedPost ? (
                    <>
                        <h3 className="text-lg font-semibold mb-4">{selectedPost.id ? '記事を編集' : '新規記事を作成'}</h3>
                        <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">タイトル</label>
                                <input type="text" name="title" value={selectedPost.title || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">内容 (Markdown対応)</label>
                                <textarea name="content" value={selectedPost.content || ''} onChange={handleInputChange} rows={10} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 custom-scrollbar focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">アイキャッチ画像URL</label>
                                <input type="text" name="imageUrl" value={selectedPost.imageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/image.png" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                                {selectedPost.imageUrl && (
                                    <div className="mt-2 relative">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">プレビュー:</p>
                                        <img src={selectedPost.imageUrl} alt="preview" className="max-h-40 rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} onLoad={(e) => e.currentTarget.style.display = 'block'}/>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center gap-2">
                                <input id="isPublished" name="isPublished" type="checkbox" checked={selectedPost.isPublished || false} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 text-cyan-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-cyan-500" />
                                <label htmlFor="isPublished" className="font-medium text-gray-700 dark:text-gray-300">公開する</label>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between flex-shrink-0">
                             <div>
                                {selectedPost.id && (
                                    <button onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 flex items-center gap-2">
                                        {isDeleting ? <LoadingSpinner className="w-5 h-5" /> : null}
                                        削除
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {saveStatus === 'success' && <p className="text-green-500 dark:text-green-400">保存しました！</p>}
                                {saveStatus === 'error' && <p className="text-red-500 dark:text-red-400">保存に失敗しました。</p>}
                                <button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 flex items-center gap-2">
                                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                                    {isSaving ? '保存中...' : '保存する'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">記事を選択するか、新規作成してください。</p>
                    </div>
                )}
            </div>
        </div>
    );
};