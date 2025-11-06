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
    LightBulbIcon, MenuIcon, SunIcon, MoonIcon, TwitcasIcon, XSocialIcon,
    DocumentTextIcon
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
            return (
                <div className="flex flex-col justify-center items-center h-64">
                    <LoadingSpinner className="w-12 h-12" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
                </div>
            );
        }
        if (error) {
            return <div className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">エラーが発生しました: {error}</div>;
        }

        switch (mode) {
            case 'search':
                return <SearchView songs={songs} logSearch={logSearch} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsAdminModalOpen={setIsAdminModalOpen} />;
            case 'list':
                return <ListView songs={songs} />;
            case 'ranking':
                return <RankingView songs={songs} songRanking={songRankingList} artistRanking={artistRankingList} requestRanking={requestRankingList} period={rankingPeriod} setPeriod={setRankingPeriod} />;
            case 'requests':
                return <RequestRankingView logRequest={logRequest} refreshRankings={refreshRankings} />;
            case 'news':
                return <BlogView posts={posts} />;
            case 'setlist':
                 return <SetlistSuggestionView songs={songs} onSave={saveSetlistSuggestion} onSuccessRedirect={handleSetlistSuccess}/>;
            default:
                return <SearchView songs={songs} logSearch={logSearch} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsAdminModalOpen={setIsAdminModalOpen} />;
        }
    };

    const navButtons = useMemo(() => {
        if (!uiConfig.navButtons) return [];
        
        const buttonConfigs: { [key: string]: any } = {
            search: { mode: 'search', icon: SearchIcon, config: uiConfig.navButtons.search },
            printGakufu: { 
                href: 'https://www.print-gakufu.com/search/result/score___subscription/', 
                icon: DocumentTextIcon, 
                config: uiConfig.navButtons.printGakufu 
            },
            list: { mode: 'list', icon: MusicNoteIcon, config: uiConfig.navButtons.list },
            ranking: { mode: 'ranking', icon: ChartBarIcon, config: uiConfig.navButtons.ranking },
            news: { mode: 'news', icon: NewspaperIcon, config: uiConfig.navButtons.news },
            requests: { mode: 'requests', icon: HeartIcon, config: uiConfig.navButtons.requests },
            suggest: { mode: 'suggest', icon: LightBulbIcon, config: uiConfig.navButtons.suggest },
            setlist: { mode: 'setlist', icon: MenuIcon, config: uiConfig.navButtons.setlist },
        };

        const buttonOrder: (keyof typeof uiConfig.navButtons)[] = [
            'search', 'printGakufu', 'list', 'ranking', 'news', 'requests', 'suggest', 'setlist'
        ];

        return buttonOrder
            .map(key => buttonConfigs[key])
            .filter(btn => btn && btn.config?.enabled);
    }, [uiConfig.navButtons]);

    const backgroundStyle: React.CSSProperties =
        uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl
            ? {
                backgroundImage: `url(${uiConfig.backgroundImageUrl})`,
              }
            : {};
    
    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner className="w-12 h-12 text-cyan-500" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
            </div>
        )
    }
     if (error) {
        return (
             <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
                <div className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <h2 className="text-xl font-bold mb-2">エラー</h2>
                    <p>データの読み込みに失敗しました。時間をおいて再度お試しください。</p>
                    <p className="text-sm mt-2 font-mono">{error}</p>
                </div>
            </div>
        );
    }


    return (
        <>
            <div 
                className="min-h-screen font-sans text-gray-900 dark:text-white transition-colors duration-300"
                style={{
                    backgroundColor: uiConfig.backgroundType === 'color' 
                        ? (isDarkMode ? uiConfig.darkBackgroundColor : uiConfig.backgroundColor)
                        : 'transparent'
                }}
            >
                {uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl && (
                    <div 
                        className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
                        style={{ ...backgroundStyle, opacity: uiConfig.backgroundOpacity }}
                    />
                )}
                <div className="relative z-10 min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
                    <header className="text-center w-full max-w-4xl mb-8">
                        <div className="flex justify-end items-center mb-2">
                            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-500/20">
                                {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold" style={{color: 'var(--primary-color)'}}>{uiConfig.mainTitle}</h1>
                        <p className="text-md md:text-lg mt-2 text-gray-600 dark:text-gray-300">{uiConfig.subtitle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 max-w-md mx-auto">
                            URLをコピペするか、ツイキャスアプリの右上にある共有ボタンから、ブラウザでサイトを読み込むと大きな画面で閲覧できます。
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
                            {uiConfig.twitcastingUrl && (
                                <a 
                                    href={uiConfig.twitcastingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold transition-transform transform hover:scale-105 shadow-md"
                                >
                                    {uiConfig.twitcastingIconUrl ? (
                                        <img src={uiConfig.twitcastingIconUrl} alt="Twitcasting" className="w-6 h-6" />
                                    ) : (
                                        <TwitcasIcon className="w-6 h-6" />
                                    )}
                                    <span>ツイキャスはこちらから</span>
                                </a>
                            )}
                            {uiConfig.xUrl && (
                                <a 
                                    href={uiConfig.xUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-gray-800 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold transition-transform transform hover:scale-105 shadow-md"
                                >
                                    {uiConfig.xIconUrl ? (
                                        <img src={uiConfig.xIconUrl} alt="X" className="w-5 h-5" />
                                    ) : (
                                        <XSocialIcon className="w-5 h-5" />
                                    )}
                                    <span>Xはこちらから</span>
                                </a>
                            )}
                            {(uiConfig.ofuseUrl || uiConfig.doneruUrl || uiConfig.amazonWishlistUrl) && (
                                <button 
                                    onClick={() => setIsSupportModalOpen(true)} 
                                    className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold transition-transform transform hover:scale-105 shadow-md"
                                >
                                     {uiConfig.supportIconUrl ? (
                                        <img src={uiConfig.supportIconUrl} alt="Support" className="w-6 h-6" />
                                    ) : (
                                        <HeartIcon className="w-6 h-6" />
                                    )}
                                    <span>配信者を支援</span>
                                </button>
                            )}
                        </div>
                    </header>
                    
                    <nav className="w-full max-w-4xl mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
                            {navButtons.map(button => {
                                if (!button.config) return null;
                                const isExternal = 'href' in button;
                                return (
                                    <NavButton
                                        key={button.config.label}
                                        onClick={isExternal ? () => {} : () => {
                                            if (button.mode === 'suggest') {
                                                setIsSuggestModalOpen(true);
                                            } else if (button.mode) {
                                                setMode(button.mode as Mode);
                                            }
                                        }}
                                        href={isExternal ? (button as any).href : undefined}
                                        isActive={!isExternal && mode === (button as any).mode}
                                        IconComponent={button.icon}
                                        label={button.config.label}
                                    />
                                );
                            })}
                        </div>
                    </nav>

                    <main className="w-full max-w-5xl">
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
