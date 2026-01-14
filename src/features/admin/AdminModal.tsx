
import React, { useState } from 'react';
import { Song, BlogPost, UiConfig, SetlistSuggestion, RequestRankingItem } from '../../types';
import { XIcon, MusicNoteIcon, NewspaperIcon, CogIcon, MenuAltIcon, CloudUploadIcon } from '../../components/ui/Icons';
import { SongListTab } from './SongListTab';
import { BlogTab } from './BlogTab';
import { SettingsTab } from './SettingsTab';
import { SetlistSuggestionsTab } from './SetlistSuggestionsTab';
import { RequestListTab } from './RequestListTab';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    posts: BlogPost[];
    uiConfig: UiConfig;
    setlistSuggestions: SetlistSuggestion[];
    recentRequests: RequestRankingItem[];
    onSaveSongs: (newSongList: string) => Promise<boolean>;
    onSavePost: (post: Partial<BlogPost>) => Promise<boolean>;
    onDeletePost: (id: string, imageUrl?: string) => Promise<boolean>;
    onSaveUiConfig: (config: UiConfig) => Promise<boolean>;
}

type AdminTab = 'songs' | 'blog' | 'settings' | 'setlists' | 'requests';

const TabIcon = ({ tab, className }: { tab: AdminTab; className?: string }) => {
    switch (tab) {
        case 'songs': return <MusicNoteIcon className={className} />;
        case 'blog': return <NewspaperIcon className={className} />;
        case 'setlists': return <MenuAltIcon className={className} />;
        case 'requests': return <CloudUploadIcon className={className} />;
        case 'settings': return <CogIcon className={className} />;
    }
};

export const AdminModal: React.FC<AdminModalProps> = (props) => {
    const { isOpen, onClose } = props;
    const [activeTab, setActiveTab] = useState<AdminTab>('songs');

    if (!isOpen) return null;

    const TabButton: React.FC<{ tab: AdminTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap flex-shrink-0 min-w-[70px] sm:min-w-0 ${
                activeTab === tab 
                ? 'bg-[var(--primary-color)] text-white shadow-lg scale-105' 
                : 'bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
            <TabIcon tab={tab} className="w-5 h-5 sm:w-5 sm:h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-none sm:rounded-2xl shadow-2xl w-full max-w-5xl h-full sm:h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border-light dark:border-border-dark flex-shrink-0 bg-white dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">管理パネル</h2>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark hidden sm:block">配信の設定や曲リストを編集できます</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark">
                        <XIcon className="w-8 h-8 sm:w-6 sm:h-6" />
                    </button>
                </header>

                <div className="p-3 sm:p-4 bg-background-light dark:bg-card-background-dark/50 overflow-x-auto custom-scrollbar flex-shrink-0 border-b border-border-light dark:border-border-dark no-scrollbar">
                    <nav className="flex items-center gap-2 sm:gap-3">
                        <TabButton tab="songs" label="曲リスト" />
                        <TabButton tab="blog" label="お知らせ" />
                        <TabButton tab="setlists" label="セトリ提案" />
                        <TabButton tab="requests" label="リクエスト" />
                        <TabButton tab="settings" label="アプリ設定" />
                    </nav>
                </div>

                <main className="flex-grow p-4 sm:p-8 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark">
                    <div className="max-w-4xl mx-auto">
                        {activeTab === 'songs' && <SongListTab onSaveSongs={props.onSaveSongs} />}
                        {activeTab === 'blog' && <BlogTab posts={props.posts} onSavePost={props.onSavePost} onDeletePost={props.onDeletePost} />}
                        {activeTab === 'setlists' && <SetlistSuggestionsTab suggestions={props.setlistSuggestions} />}
                        {activeTab === 'requests' && <RequestListTab requests={props.recentRequests} />}
                        {activeTab === 'settings' && <SettingsTab uiConfig={props.uiConfig} onSaveUiConfig={props.onSaveUiConfig} />}
                    </div>
                </main>
            </div>
        </div>
    );
};
