
import React, { useState } from 'react';
import { UiConfig } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ImageIcon, PlusIcon } from '../../components/ui/Icons';

interface ProfileTabProps {
    uiConfig: UiConfig;
    onSave: (config: UiConfig) => Promise<boolean>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ uiConfig, onSave }) => {
    const [config, setConfig] = useState<UiConfig>(uiConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        const success = await onSave(config);
        setSaveStatus(success ? 'success' : 'error');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 4000);
    };

    const insertImageIntoBio = () => {
        const url = prompt('挿入したい画像のURLを入力してください:');
        if (url) {
            const markdownImage = `\n\n![image](${url})\n\n`;
            setConfig(prev => ({
                ...prev,
                profileBio: (prev.profileBio || '') + markdownImage
            }));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側: 基本情報 */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            プロフィール基本設定
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">配信者名</label>
                                <input
                                    type="text"
                                    name="profileName"
                                    value={config.profileName || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                    placeholder="例: ともかな"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">肩書き</label>
                                <input
                                    type="text"
                                    name="profileTitle"
                                    value={config.profileTitle || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                    placeholder="例: ピアノを弾く人"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">自己紹介文 (Markdown対応)</label>
                                <button 
                                    onClick={insertImageIntoBio}
                                    className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold px-2 py-1 rounded-md flex items-center gap-1 hover:bg-purple-200"
                                >
                                    <ImageIcon className="w-3 h-3" />
                                    画像を本文に差し込む
                                </button>
                            </div>
                            <textarea
                                name="profileBio"
                                value={config.profileBio || ''}
                                onChange={handleInputChange}
                                rows={10}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"
                                placeholder="自己紹介を自由に書いてください。Markdownでリンクや画像も貼れます。"
                            />
                        </div>
                    </section>
                </div>

                {/* 右側: 画像設定 */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            ビジュアル設定
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">アイコン画像URL</label>
                                <input
                                    type="text"
                                    name="profileImageUrl"
                                    value={config.profileImageUrl || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                    placeholder="https://..."
                                />
                                {config.profileImageUrl && (
                                    <div className="mt-3 flex justify-center">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500 shadow-md">
                                            <img src={config.profileImageUrl} alt="icon preview" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ヘッダー画像URL</label>
                                <input
                                    type="text"
                                    name="profileHeaderImageUrl"
                                    value={config.profileHeaderImageUrl || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                    placeholder="https://..."
                                />
                                {config.profileHeaderImageUrl && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-border-light dark:border-border-dark h-20 bg-gray-100">
                                        <img src={config.profileHeaderImageUrl} alt="header preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">推奨: 横長の画像</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-border-light dark:border-border-dark flex justify-center z-50">
                <div className="flex items-center gap-4">
                    {saveStatus === 'success' && <span className="text-green-500 font-bold">保存しました！</span>}
                    {saveStatus === 'error' && <span className="text-red-500 font-bold">保存に失敗しました</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-16 rounded-full shadow-xl disabled:opacity-50 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                        プロフィールを保存する
                    </button>
                </div>
            </div>
        </div>
    );
};
