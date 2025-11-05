

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './hooks/useApi';
import { Mode } from './types';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { SearchView } from './views/SearchView';
import { ListView } from './views/ListView';
import { RankingView } from './views/RankingView';
import { RequestRankingView } from './views/RequestRankingView';
import { BlogView } from './views/BlogView';
import { SetlistSuggestionView } from './views/SetlistSuggestionView';
import { NavButton } from './components/ui/NavButton';
import { AdminModal } from './features/admin/AdminModal';
import { SuggestSongModal } from './features/suggest/SuggestSongModal';
import { SupportModal } from './features/support/SupportModal';
import { 
    SearchIcon, MusicNoteIcon, ChartBarIcon, HeartIcon, NewspaperIcon, 
    LightBulbIcon, MenuIcon, SunIcon, MoonIcon
} from './components/ui/Icons';


const App: React.FC = () => {
    const { 
        songs, songRankingList, artistRankingList, requestRankingList, posts, adminPosts, uiConfig, setlistSuggestions,
        isLoading, error, rankingPeriod, setRankingPeriod,
        onSaveSongs, onSaveUiConfig, onSavePost, onDeletePost,
        logSearch, logRequest, saveSetlistSuggestion, refreshRankings
    } = useApi();
    
    const [mode, setMode] = useState<Mode>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newIsDark = !prev;
            if (newIsDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newIsDark;
        });
    };
    
    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', uiConfig.primaryColor);
    }, [uiConfig.primaryColor]);

    const handleSuggestSelect = useCallback((text: string) => {
        setSearchTerm(text);
        setMode('search');
        setIsSuggestModalOpen(false);
    }, []);

    const handleSetlistSuccess = useCallback(() => {
        // After success, go to the search page.
        setMode('search');
    }, []);

    const renderView = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><LoadingSpinner className="w-12 h-12" /></div>;
        }
        if (error) {
            return <div className="text-center text-red-500">エラーが発生しました: {error}</div>;
        }

        switch (mode) {
            case 'search':
                return <SearchView songs={songs} logSearch={logSearch} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsAdminModalOpen={setIsAdminModalOpen} />;
            case 'list':
                return <ListView songs={songs} />;
            case 'ranking':
                // FIX: Removed `songs` and `requestRanking` props as they are not defined in RankingViewProps.
                return <RankingView songRanking={songRankingList} artistRanking={artistRankingList} period={rankingPeriod} setPeriod={setRankingPeriod} />;
            case 'requests':
                return <RequestRankingView rankingList={requestRankingList} logRequest={logRequest} refreshRankings={refreshRankings} />;
            case 'blog':
                return <BlogView posts={posts} />;
            case 'setlist':
                 return <SetlistSuggestionView songs={songs} onSave={saveSetlistSuggestion} onSuccessRedirect={handleSetlistSuccess}/>;
            default:
                return <SearchView songs={songs} logSearch={logSearch} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsAdminModalOpen={setIsAdminModalOpen} />;
        }
    };

    const navButtons = useMemo(() => [
        { mode: 'search', icon: SearchIcon, config: uiConfig.navButtons.search },
        { mode: 'list', icon: MusicNoteIcon, config: uiConfig.navButtons.list },
        { mode: 'ranking', icon: ChartBarIcon, config: uiConfig.navButtons.ranking },
        { mode: 'requests', icon: HeartIcon, config: uiConfig.navButtons.requests },
        { mode: 'blog', icon: NewspaperIcon, config: uiConfig.navButtons.blog },
        { mode: 'suggest', icon: LightBulbIcon, config: uiConfig.navButtons.suggest },
        { mode: 'setlist', icon: MenuIcon, config: uiConfig.navButtons.setlist },
    ].filter(btn => btn.config?.enabled), [uiConfig.navButtons]);

    const backgroundStyle: React.CSSProperties =
        uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl
            ? {
                backgroundImage: `url(${uiConfig.backgroundImageUrl})`,
              }
            : {};
    const backgroundColorStyle: React.CSSProperties =
        uiConfig.backgroundType === 'color'
            ? { backgroundColor: isDarkMode ? uiConfig.darkBackgroundColor : uiConfig.backgroundColor }
            : {};

    return (
        <>
            <div 
                className="min-h-screen font-sans text-gray-900 dark:text-white transition-colors duration-300"
                style={backgroundColorStyle}
            >
                {uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl && (
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
                        style={{ ...backgroundStyle, opacity: uiConfig.backgroundOpacity }}
                    />
                )}
                <div 
                    className="absolute inset-0 bg-gradient-to-t from-gray-100/30 via-transparent to-transparent dark:from-black/30 dark:via-transparent dark:to-transparent z-0"
                />

                <div className="relative z-10 min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
                    <header className="text-center w-full max-w-4xl mb-8">
                        <div className="flex justify-end items-center mb-2">
                            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-500/20">
                                {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold" style={{color: 'var(--primary-color)'}}>{uiConfig.mainTitle}</h1>
                        <p className="text-md md:text-lg mt-2 text-gray-600 dark:text-gray-300">{uiConfig.subtitle}</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {uiConfig.twitcastingUrl && <a href={uiConfig.twitcastingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-cyan-500 dark:text-cyan-400 hover:underline">ツイキャス</a>}
                            {uiConfig.xUrl && <a href={uiConfig.xUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-500 dark:text-blue-400 hover:underline">Xはこちらから</a>}
                            { (uiConfig.ofuseUrl || uiConfig.doneruUrl || uiConfig.amazonWishlistUrl) &&
                                <button onClick={() => setIsSupportModalOpen(true)} className="text-sm font-semibold text-pink-500 dark:text-pink-400 hover:underline">サポート</button>
                            }
                        </div>
                    </header>
                    
                    <nav className="w-full max-w-4xl mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {navButtons.map(button => (
                                <NavButton
                                    key={button.mode}
                                    onClick={() => button.mode === 'suggest' ? setIsSuggestModalOpen(true) : setMode(button.mode as Mode)}
                                    isActive={mode === button.mode}
                                    IconComponent={button.icon}
                                    label={button.config.label}
                                />
                            ))}
                        </div>
                    </nav>

                    <main className="w-full">
                        {renderView()}
                    </main>

                    <footer className="text-center mt-12 text-xs text-gray-500 dark:text-gray-400 w-full">
                        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
                    </footer>
                </div>
            </div>

            <AdminModal 
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                songs={songs}
                posts={adminPosts}
                uiConfig={uiConfig}
                setlistSuggestions={setlistSuggestions}
                onSaveSongs={onSaveSongs}
                onSavePost={onSavePost}
                onDeletePost={onDeletePost}
                onSaveUiConfig={onSaveUiConfig}
            />
            <SuggestSongModal 
                isOpen={isSuggestModalOpen}
                onClose={() => setIsSuggestModalOpen(false)}
                songs={songs}
                onSelect={handleSuggestSelect}
            />
            <SupportModal 
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                uiConfig={uiConfig}
            />
        </>
    );
};

export default App;