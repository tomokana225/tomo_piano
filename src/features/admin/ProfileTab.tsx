import React, { useState } from 'react';
import { UiConfig } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

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

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    プロフィール編集
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">キャッチコピー / 肩書き</label>
                            <input
                                type="text"
                                name="profileTitle"
                                value={config.profileTitle || ''}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                placeholder="例: ピアノを弾く人"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">プロフィール画像URL</label>
                            <input
                                type="text"
                                name="profileImageUrl"
                                value={config.profileImageUrl || ''}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                placeholder="https://..."
                            />
                            {config.profileImageUrl && (
                                <div className="mt-3 w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                                    <img src={config.profileImageUrl} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">自己紹介文 (Markdown対応)</label>
                            <textarea
                                name="profileBio"
                                value={config.profileBio || ''}
                                onChange={handleInputChange}
                                rows={10}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"
                                placeholder="自己紹介や配信スタイルなどを自由に書いてください"
                            />
                        </div>
                    </div>
                </div>
            </section>

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