

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
    LightBulbIcon, MenuIcon, SunIcon, MoonIcon, 
    DocumentTextIcon, CloudUploadIcon, HeartIcon, XSocialIcon, TwitcasIcon,
    UserGroupIcon, ChevronLeftIcon, XIcon, InformationCircleIcon,
    ChevronDownIcon, ChevronUpIcon
} from './components/ui/Icons';


const App: React.FC = () => {
    const { 
        rawSongList, songs, songRankingList, artistRankingList, songLikeRankingList, posts, adminPosts, uiConfig, setlistSuggestions, recentRequests,
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
    const [isInfoBannerVisible, setIsInfoBannerVisible] = useState(true);
    const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

    useEffect(() => {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInfoBannerVisible(false);
        }, 4000); // Hide after 4 seconds
        return () => clearTimeout(timer);
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newIsDark = !prev;
            if (newIsDark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            return newIsDark;
        });
    };
    
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', uiConfig.primaryColor);
        // This is a simple way to get a secondary color. A more complex function could derive it.
        // For pink, a nice pair is sky blue.
        if (uiConfig.primaryColor.includes('ec4899')) { // Default Pink
             root.style.setProperty('--secondary-color', '#38bdf8'); // sky-400
        } else {
            // A generic brighter version or a fixed alternative
             root.style.setProperty('--secondary-color', '#67e8f9'); // cyan-300
        }
        root.style.setProperty('--heading-font', uiConfig.headingFontFamily || "'Kiwi Maru', serif");
        root.style.setProperty('--body-font', uiConfig.bodyFontFamily || "'Noto Sans JP', sans-serif");
        root.style.setProperty('--heading-font-scale', String(uiConfig.headingFontScale || 1));
        root.style.setProperty('--body-font-scale', String(uiConfig.bodyFontScale || 1));

        if (uiConfig.backgroundType === 'color') {
            root.style.setProperty('--background-light', uiConfig.backgroundColor);
            root.style.setProperty('--background-dark', uiConfig.darkBackgroundColor);
        } else {
            root.style.setProperty('--background-light', 'transparent');
            root.style.setProperty('--background-dark', 'transparent');
        }
    }, [uiConfig]);

    const handleSuggestSelect = useCallback((text: string) => {
        setSearchTerm(text);
        setMode('search');
        setIsSuggestModalOpen(false);
    }, []);

    const handleSetlistSuccess = useCallback(() => {
        setMode('search');
    }, []);

    const handleAdminLogin = useCallback(() => {
        setIsAdminAuthenticated(true);
        setIsAdminModalOpen(true);
    }, []);

    const renderView = () => {
        if (isLoading && songs.length === 0) {
            return (
                <div className="flex flex-col justify-center items-center h-full">
                    <LoadingSpinner className="w-12 h-12" />
                    <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">読み込み中...</p>
                </div>
            );
        }

        switch (mode) {
            case 'search':
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} setMode={setMode} uiConfig={uiConfig} setIsSuggestModalOpen={setIsSuggestModalOpen} songRankingList={songRankingList} />;
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
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} setMode={setMode} uiConfig={uiConfig} setIsSuggestModalOpen={setIsSuggestModalOpen} songRankingList={songRankingList} />;
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
            printGakufu: { href: 'https://www.print-gakufu.com/search/result/score___subscription/', icon: DocumentTextIcon, config: uiConfig.navButtons.printGakufu },
        };
        const buttonOrder: (keyof typeof buttonConfigs)[] = ['search', 'list', 'suggest', 'news', 'ranking', 'requests', 'setlist', 'printGakufu'];
        return buttonOrder.map(key => buttonConfigs[key]).filter(btn => btn && btn.config?.enabled);
    }, [uiConfig.navButtons]);

    const backgroundStyle: React.CSSProperties =
        uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl
            ? { backgroundImage: `url(${uiConfig.backgroundImageUrl})` }
            : {};
    
    const backgroundFallbackColor = useMemo(() => {
        const isDark = document.documentElement.classList.contains('dark');
        if (uiConfig.backgroundType === 'color') {
            return isDark ? uiConfig.darkBackgroundColor : uiConfig.backgroundColor;
        }
        return isDark ? '#020617' : '#f1f5f9';
    }, [uiConfig.backgroundType, uiConfig.backgroundColor, uiConfig.darkBackgroundColor, isDarkMode]);
    
    if (isLoading && !rawSongList) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background-light dark:bg-background-dark">
                <LoadingSpinner className="w-12 h-12" style={{color: 'var(--primary-color)'}}/>
                <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">読み込み中...</p>
            </div>
        );
    }

    const SidebarContent = () => (
        <>
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                <h2 className="font-bold text-lg whitespace-nowrap overflow-hidden">メニュー</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {navButtons.map((button) => {
                    if ('href' in button && button.href) {
                        return <NavButton key={button.href} href={button.href} onClick={() => {}} IconComponent={button.icon} label={button.config.label} />;
                    }
                    if ('mode' in button) {
                        if (button.mode === 'suggest') {
                            return <NavButton key={button.mode} onClick={() => { setIsSuggestModalOpen(true); setIsMenuOpen(false); }} isActive={false} IconComponent={button.icon} label={button.config.label} />;
                        }
                        return <NavButton key={button.mode} onClick={() => { setMode(button.mode as Mode); setIsMenuOpen(false); }} isActive={mode === button.mode} IconComponent={button.icon} label={button.config.label} />;
                    }
                    return null;
                })}
            </nav>
        </>
    );

    return (
        <>
            <div className="flex h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
                {/* Overlay for slide-out menu */}
                <div className={`fixed inset-0 bg-black/95 z-30 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />

                {/* Slide-out Menu */}
                <aside className={`fixed z-40 h-full bg-card-background-light dark:bg-card-background-dark border-r border-border-light dark:border-border-dark flex flex-col transition-transform duration-300 w-64 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </aside>
                
                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    <header className="flex-shrink-0 bg-card-background-light dark:bg-card-background-dark shadow-lg px-4 sm:px-6 py-4 border-b-2" style={{ borderColor: 'var(--primary-color)' }}>
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-3">
                            {/* Left Section: Menu Button */}
                            <div className="flex-1 flex justify-start order-2 sm:order-1">
                                <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                    <MenuIcon className="w-6 h-6" />
                                    <span className="font-semibold">メニュー</span>
                                </button>
                            </div>

                            {/* Center Section: Title */}
                            <div className="w-full sm:w-auto flex-shrink-0 px-2 text-center order-1 sm:order-2">
                                 <h1 className="text-2xl sm:text-3xl font-bold whitespace-nowrap truncate" title={uiConfig.mainTitle}>{uiConfig.mainTitle}</h1>
                                 <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark hidden sm:block">配信で演奏できる曲を調べることができます。</p>
                            </div>

                            {/* Right Section: Icons */}
                            <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2 order-3 sm:order-3">
                               <div className="flex items-center gap-1 sm:gap-2 bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-full" title="現在の訪問者数">
                                    <UserGroupIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                                    <span className="text-sm font-semibold hidden sm:inline">{activeUserCount}</span>
                                </div>
                                <button onClick={toggleDarkMode} className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle dark mode">
                                    {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                         {error && (
                            <div 
                                className="mb-4 bg-yellow-100 dark:bg-yellow-900/80 border border-yellow-500 text-yellow-800 dark:text-yellow-200 p-2 text-center text-sm z-20 shadow-md rounded-lg"
                                role="alert"
                            >
                                <strong>開発者向け情報:</strong> {error}
                            </div>
                        )}
                        
                        <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isInfoBannerVisible ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-500/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3 text-sm shadow-md">
                                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>URLをコピペするか、ツイキャスアプリの右上にある共有ボタンから、ブラウザでサイトを読み込むと大きな画面で閲覧できます。</span>
                            </div>
                        </div>
                        
                        {uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl && (
                            <div className="fixed inset-0 bg-cover bg-center bg-fixed z-[-1]" style={{ ...backgroundStyle, opacity: uiConfig.backgroundOpacity }} />
                        )}
                        <div className="fixed inset-0 z-[-2]" style={{ backgroundColor: backgroundFallbackColor }}/>

                        {mode !== 'search' && (
                            <button
                                onClick={() => setMode('search')}
                                className="flex items-center gap-2 mb-6 text-sm font-semibold transition-opacity hover:opacity-75"
                                style={{ color: 'var(--primary-color)' }}
                                aria-label="検索画面に戻る"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                                <span>検索画面に戻る</span>
                            </button>
                        )}
                        {renderView()}
                    </main>
                     <footer className="flex-shrink-0 bg-card-background-light dark:bg-card-background-dark border-t border-border-light dark:border-border-dark relative">
                        <button
                            onClick={() => setIsFooterCollapsed(prev => !prev)}
                            className={`absolute ${isFooterCollapsed ? '-top-5 right-3' : 'top-2 right-2'} bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark rounded-full p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 ease-in-out shadow-lg z-10`}
                            aria-label={isFooterCollapsed ? 'フッターを開く' : 'フッターを閉じる'}
                        >
                            {isFooterCollapsed ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFooterCollapsed ? 'max-h-0' : 'max-h-48'}`}>
                            <div className="p-4 pt-6 pb-4 flex flex-col sm:flex-row sm:justify-center items-center gap-y-3 sm:gap-x-4">
                                {/* Top Row: Support Button */}
                                {uiConfig.specialButtons?.support?.enabled && (
                                    <div className="flex justify-center">
                                        <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 shadow-md">
                                            {uiConfig.supportIconUrl ? <img src={uiConfig.supportIconUrl} alt="Support" className="w-5 h-5" /> : <HeartIcon className="w-5 h-5"/>}
                                            <span>{uiConfig.specialButtons.support.label}</span>
                                        </button>
                                    </div>
                                )}
                                {/* Bottom Row: Other Buttons */}
                                <div className="flex justify-center items-center gap-4">
                                    {uiConfig.specialButtons?.twitcas?.enabled && uiConfig.twitcastingUrl && uiConfig.twitcastingUrl.trim() !== '' && (
                                        <a href={uiConfig.twitcastingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm whitespace-nowrap bg-gradient-to-r from-[#179BF1] to-[#4ab3f3] hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 shadow-md">
                                            {uiConfig.twitcastingIconUrl ? <img src={uiConfig.twitcastingIconUrl} alt="TwitCasting" className="w-5 h-5" /> : <TwitcasIcon className="w-5 h-5"/>}
                                            <span>{uiConfig.specialButtons.twitcas.label}</span>
                                        </a>
                                    )}
                                    {uiConfig.specialButtons?.x?.enabled && uiConfig.xUrl && uiConfig.xUrl.trim() !== '' && (
                                         <a href={uiConfig.xUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap bg-gradient-to-r from-gray-800 to-black dark:from-gray-200 dark:to-white text-white dark:text-black hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 shadow-md">
                                            {uiConfig.xIconUrl ? <img src={uiConfig.xIconUrl} alt="X" className="w-5 h-5" /> : <XSocialIcon className="w-5 h-5" />}
                                            <span>{uiConfig.specialButtons.x.label}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </footer>
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