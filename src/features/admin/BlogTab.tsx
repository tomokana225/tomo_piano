import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PlusIcon, XIcon } from '../../components/ui/Icons';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface BlogTabProps {
    posts: BlogPost[];
    onSavePost: (post: Partial<BlogPost>) => Promise<boolean>;
    onDeletePost: (id: string, imageUrl?: string) => Promise<boolean>;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onSavePost, onDeletePost }) => {
    const [selectedPost, setSelectedPost] = useState<Partial<BlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedPost?.id) {
            const updatedPost = posts.find(p => p.id === selectedPost.id);
            if (updatedPost) {
                // Keep local changes if they exist (e.g., a selected image file)
                setSelectedPost(prev => ({...updatedPost, ...prev, id: updatedPost.id}));
            } else {
                setSelectedPost(null);
            }
        }
    }, [posts, selectedPost?.id]);

    const handleSelectPost = (post: BlogPost) => {
        setSelectedPost({ ...post });
        setSaveStatus('idle');
    };

    const handleNewPost = () => {
        setSelectedPost({ title: '', content: '', isPublished: false });
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedPost) return;
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                alert(`画像ファイルが大きすぎます。${MAX_IMAGE_SIZE_MB}MB以下のファイルを選択してください。`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setSelectedPost(prev => ({ ...prev, imageFile: file, imageUrl: URL.createObjectURL(file) }));
        }
    };

    const handleRemoveImage = () => {
        if (!selectedPost) return;
        setSelectedPost(prev => ({ ...prev, imageFile: undefined, imageUrl: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        if (!selectedPost || !selectedPost.title) {
            alert('タイトルを入力してください。');
            return;
        }
        setIsSaving(true);
        setSaveStatus('idle');
        setUploadProgress(0);

        let postToSave = { ...selectedPost };

        try {
            // 1. Handle image upload if a new file is selected
            if (postToSave.imageFile) {
                 // Delete old image if it exists and we're replacing it.
                const originalPost = posts.find(p => p.id === postToSave.id);
                if (originalPost?.imageUrl) {
                    try {
                        const oldImageRef = ref(storage, originalPost.imageUrl);
                        await deleteObject(oldImageRef);
                    } catch (e) {
                        console.warn("Old image deletion failed, might not exist:", e);
                    }
                }
                
                const imageRef = ref(storage, `blog_images/${postToSave.id || Date.now()}/${postToSave.imageFile.name}`);
                await uploadBytes(imageRef, postToSave.imageFile);
                postToSave.imageUrl = await getDownloadURL(imageRef);
            } 
            // 2. Handle image removal if no file is selected and the URL has been cleared
            else if (!postToSave.imageUrl) {
                const originalPost = posts.find(p => p.id === postToSave.id);
                if (originalPost?.imageUrl) {
                     try {
                        const oldImageRef = ref(storage, originalPost.imageUrl);
                        await deleteObject(oldImageRef);
                    } catch (e) {
                        console.warn("Old image deletion failed:", e);
                    }
                }
            }
            
            // 3. Clean up client-side properties before saving to Firestore
            delete postToSave.imageFile;
            delete postToSave.isUploading;

            // 4. Save post metadata to Firestore
            const success = await onSavePost(postToSave);
            setSaveStatus(success ? 'success' : 'error');
            if (success && !selectedPost.id) {
                setSelectedPost(null); // Clear form after new post creation
            }
        } catch (error) {
            console.error("Save process failed:", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleDelete = async () => {
        if (!selectedPost || !selectedPost.id) return;
        if (window.confirm('本当にこの記事を削除しますか？')) {
            setIsDeleting(true);
            const originalPost = posts.find(p => p.id === selectedPost.id);
            const success = await onDeletePost(selectedPost.id, originalPost?.imageUrl);
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
                    <h3 className="text-lg font-semibold">ブログ記事一覧</h3>
                    <button onClick={handleNewPost} className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 font-semibold p-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                        <PlusIcon className="w-4 h-4" />
                        新規作成
                    </button>
                </div>
                <div className="flex-grow bg-gray-800 rounded-md p-2 overflow-y-auto custom-scrollbar">
                    {posts.length > 0 ? (
                        <ul className="space-y-2">
                            {posts.map(post => (
                                <li key={post.id}>
                                    <button onClick={() => handleSelectPost(post)} className={`w-full text-left p-3 rounded-md transition ${selectedPost?.id === post.id ? 'bg-cyan-600/50' : 'hover:bg-gray-700'}`}>
                                        <p className="font-semibold truncate">{post.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {post.isPublished ? <span className="text-green-400">公開済み</span> : <span className="text-yellow-400">下書き</span>}
                                            {' - '}{formatDate(post.createdAt)}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : ( <p className="text-gray-400 text-center py-4">記事がありません。</p> )}
                </div>
            </div>

            <div className="md:col-span-2 flex flex-col min-h-0">
                {selectedPost ? (
                    <>
                        <h3 className="text-lg font-semibold mb-4">{selectedPost.id ? '記事を編集' : '新規記事を作成'}</h3>
                        <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">タイトル</label>
                                <input type="text" name="title" value={selectedPost.title || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">内容 (Markdown対応)</label>
                                <textarea name="content" value={selectedPost.content || ''} onChange={handleInputChange} rows={10} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2 custom-scrollbar focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">アイキャッチ画像 ({MAX_IMAGE_SIZE_MB}MBまで)</label>
                                {selectedPost.imageUrl && (
                                    <div className="mb-2 relative w-fit">
                                        <img src={selectedPost.imageUrl} alt="preview" className="max-h-40 rounded-md" />
                                        <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/80">
                                            <XIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
                            </div>
                             <div className="flex items-center gap-2">
                                <input id="isPublished" name="isPublished" type="checkbox" checked={selectedPost.isPublished || false} onChange={handleCheckboxChange} className="form-checkbox h-5 w-5 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
                                <label htmlFor="isPublished" className="font-medium text-gray-300">公開する</label>
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
                                {saveStatus === 'success' && <p className="text-green-400">保存しました！</p>}
                                {saveStatus === 'error' && <p className="text-red-400">保存に失敗しました。</p>}
                                <button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 flex items-center gap-2">
                                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                                    {isSaving ? '保存中...' : '保存する'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800 rounded-md">
                        <p className="text-gray-400">記事を選択するか、新規作成してください。</p>
                    </div>
                )}
            </div>
        </div>
    );
};