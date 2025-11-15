

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
    SearchIcon, MusicNoteIcon, ChartBarIcon, NewspaperIcon, 
    LightBulbIcon, MenuIcon, SunIcon, MoonIcon, XIcon,
    DocumentTextIcon, CloudUploadIcon, HeartIcon, XSocialIcon, TwitcasIcon,
    UserGroupIcon
} from './components/ui/Icons';


const App: React.FC = () => {
    // FIX: Destructure `rawSongList` from the `useApi` hook to fix a 'Cannot find name' error.
    const { 
        rawSongList,
        songs, songRankingList, artistRankingList, songLikeRankingList, posts, adminPosts, uiConfig, setlistSuggestions, recentRequests,
        isLoading, error, activeUserCount,
        rankingPeriod, setRankingPeriod,
        onSaveSongs, onSaveUiConfig, onSavePost, onDeletePost,
        logSearch, logRequest, logLike, saveSetlistSuggestion, refreshRankings
    } = useApi();
    
    const [mode, setMode] = useState<Mode>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        const root = document.documentElement;
        root.style.setProperty('--primary-color', uiConfig.primaryColor);
        root.style.setProperty('--heading-font', uiConfig.headingFontFamily || "'Kiwi Maru', serif");
        root.style.setProperty('--body-font', uiConfig.bodyFontFamily || "'Noto Sans JP', sans-serif");
        root.style.setProperty('--heading-font-scale', String(uiConfig.headingFontScale || 1));
        root.style.setProperty('--body-font-scale', String(uiConfig.bodyFontScale || 1));

        if (uiConfig.backgroundType === 'color') {
            root.style.setProperty('--background-light', uiConfig.backgroundColor);
            root.style.setProperty('--background-dark', uiConfig.darkBackgroundColor);
        } else {
             // Reset to default if switching back to image
            root.style.setProperty('--background-light', '#f1f5f9');
            root.style.setProperty('--background-dark', '#020617');
        }

    }, [uiConfig]);

    const handleSuggestSelect = useCallback((text: string) => {
        setSearchTerm(text);
        setMode('search');
        setIsSuggestModalOpen(false);
    }, []);

    const handleSetlistSuccess = useCallback(() => {
        // After success, go to the search page.
        setMode('search');
    }, []);

    const handleAdminLogin = useCallback(() => {
        setIsAdminAuthenticated(true);
        setIsAdminModalOpen(true);
    }, []);

    const renderView = () => {
        if (isLoading && songs.length === 0) {
            return (
                <div className="flex flex-col justify-center items-center h-64">
                    <LoadingSpinner className="w-12 h-12" />
                    <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">読み込み中...</p>
                </div>
            );
        }

        switch (mode) {
            case 'search':
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} setMode={setMode} uiConfig={uiConfig} />;
            case 'list':
                return <ListView songs={songs} logLike={logLike} refreshRankings={refreshRankings} />;
            case 'ranking':
                return <RankingView songs={songs} songRanking={songRankingList} artistRanking={artistRankingList} songLikeRanking={songLikeRankingList} period={rankingPeriod} setPeriod={setRankingPeriod} />;
            case 'requests':
                return <RequestRankingView recentRequests={recentRequests} logRequest={logRequest} refreshRankings={refreshRankings} />;
            case 'news':
                return <BlogView posts={posts} />;
            case 'setlist':
                 return <SetlistSuggestionView songs={songs} onSave={saveSetlistSuggestion} onSuccessRedirect={handleSetlistSuccess}/>;
            default:
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} setMode={setMode} uiConfig={uiConfig} />;
        }
    };

    const navButtons = useMemo(() => {
        if (!uiConfig.navButtons) return [];
        
        const buttonConfigs = {
            search: { mode: 'search', icon: SearchIcon, config: uiConfig.navButtons.search },
            list: { mode: 'list', icon: MusicNoteIcon, config: uiConfig.navButtons.list },
            suggest: { mode: 'suggest', icon: LightBulbIcon, config: uiConfig.navButtons.suggest },
            news: { mode: 'news', icon: NewspaperIcon, config: uiConfig.navButtons.news },
            ranking: { mode: 'ranking', icon: ChartBarIcon, config: uiConfig.navButtons.ranking },
            requests: { mode: 'requests', icon: CloudUploadIcon, config: uiConfig.navButtons.requests },
            setlist: { mode: 'setlist', icon: MenuIcon, config: uiConfig.navButtons.setlist },
            printGakufu: { 
                href: 'https://www.print-gakufu.com/search/result/score___subscription/', 
                icon: DocumentTextIcon, 
                config: uiConfig.navButtons.printGakufu 
            },
        };

        const buttonOrder: (keyof typeof buttonConfigs)[] = [
            'search', 'list', 'suggest', 'news', 'ranking', 'requests', 'setlist', 'printGakufu'
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
    
    if (isLoading && !rawSongList) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background-light dark:bg-background-dark">
                <LoadingSpinner className="w-12 h-12" style={{color: 'var(--primary-color)'}}/>
                <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">読み込み中...</p>
            </div>
        )
    }

    return (
        <>
            {error && (
                <div 
                    className="fixed top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900/80 border-b-2 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-2 text-center text-sm z-[100] shadow-lg"
                    role="alert"
                >
                    <strong>開発者向け情報:</strong> {error}
                </div>
            )}
            
            <div 
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!isMenuOpen}
            >
                <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
                <div className={`relative w-72 h-full bg-card-background-light dark:bg-card-background-dark shadow-xl flex flex-col transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark">
                        <h2 className="text-lg font-bold">メニュー</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {navButtons.map((button) => {
                            if ('href' in button && button.href) {
                                return (
                                    <NavButton
                                        key={button.href}
                                        href={button.href}
                                        onClick={() => {}}
                                        IconComponent={button.icon}
                                        label={button.config.label}
                                    />
                                );
                            }

                            if ('mode' in button) {
                                if (button.mode === 'suggest') {
                                    return (
                                        <NavButton
                                            key={button.mode}
                                            onClick={() => { setIsSuggestModalOpen(true); setIsMenuOpen(false); }}
                                            isActive={false}
                                            IconComponent={button.icon}
                                            label={button.config.label}
                                        />
                                    );
                                }
                                
                                return (
                                    <NavButton
                                        key={button.mode}
                                        onClick={() => { setMode(button.mode as Mode); setIsMenuOpen(false); }}
                                        isActive={mode === button.mode}
                                        IconComponent={button.icon}
                                        label={button.config.label}
                                    />
                                );
                            }
                            return null;
                        })}
                    </nav>
                </div>
            </div>
            
            <div 
                className={`min-h-screen w-full transition-colors duration-300 ${error ? 'pt-12' : ''}`}
            >
                {uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl && (
                    <div 
                        className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
                        style={{ ...backgroundStyle, opacity: uiConfig.backgroundOpacity }}
                    />
                )}
                 <div className="fixed inset-0 bg-background-light dark:bg-background-dark" style={{ opacity: uiConfig.backgroundType === 'image' ? 1 - uiConfig.backgroundOpacity : 1 }}/>

                <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
                    
                    <div className="w-full max-w-5xl bg-card-background-light dark:bg-card-background-dark rounded-2xl shadow-2xl border border-border-light dark:border-border-dark flex flex-col">
                        <header className="w-full flex justify-between items-center p-4 sm:p-6 border-b border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-background-light dark:focus:ring-offset-card-background-dark"
                                    style={{ backgroundColor: 'var(--primary-color)', '--tw-ring-color': 'var(--primary-color)' } as React.CSSProperties}
                                    aria-label="メニューを開く"
                                >
                                    <MenuIcon className="w-5 h-5" />
                                    <span>メニュー</span>
                                </button>
                                <div className="text-left">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{uiConfig.mainTitle}</h1>
                                    <p className="text-xs sm:text-sm md:text-base mt-1 text-text-secondary-light dark:text-text-secondary-dark">{uiConfig.subtitle}</p>

                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-2 sm:px-3 py-1.5 rounded-full" title="現在の訪問者数">
                                    <UserGroupIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                                    <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">{activeUserCount}</span>
                                </div>
                                <button onClick={toggleDarkMode} className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle dark mode">
                                    {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                                </button>
                            </div>
                        </header>
                        
                        <main className="p-6 flex-grow">
                            {renderView()}
                        </main>

                        <footer className="p-6 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-center gap-4">
                            {uiConfig.specialButtons?.twitcas?.enabled && uiConfig.twitcastingUrl && (
                                <a href={uiConfig.twitcastingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 shadow-lg" style={{backgroundColor: 'var(--primary-color)'}}>
                                    {uiConfig.twitcastingIconUrl ? <img src={uiConfig.twitcastingIconUrl} alt="TwitCasting" className="w-6 h-6" /> : <TwitcasIcon className="w-6 h-6"/>}
                                    {uiConfig.specialButtons.twitcas.label}
                                </a>
                            )}
                            {uiConfig.specialButtons?.x?.enabled && uiConfig.xUrl && (
                                <a href={uiConfig.xUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-black rounded-lg font-semibold text-white transition-transform transform hover:scale-105 shadow-lg">
                                    {uiConfig.xIconUrl ? <img src={uiConfig.xIconUrl} alt="X" className="w-5 h-5" /> : <XSocialIcon className="w-5 h-5"/>}
                                    {uiConfig.specialButtons.x.label}
                                </a>
                            )}
                            {uiConfig.specialButtons?.support?.enabled && (
                                <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 shadow-lg">
                                    {uiConfig.supportIconUrl ? <img src={uiConfig.supportIconUrl} alt="Support" className="w-6 h-6" /> : <HeartIcon className="w-6 h-6" />}
                                    {uiConfig.specialButtons.support.label}
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            </div>

            {isAdminAuthenticated && (
                <AdminModal
                    isOpen={isAdminModalOpen}
                    onClose={() => setIsAdminModalOpen(false)}
                    songs={songs}
                    posts={adminPosts}
                    uiConfig={uiConfig}
                    setlistSuggestions={setlistSuggestions}
                    recentRequests={recentRequests}
                    onSaveSongs={onSaveSongs}
                    onSavePost={onSavePost}
                    onDeletePost={onDeletePost}
                    onSaveUiConfig={onSaveUiConfig}
                />
            )}

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