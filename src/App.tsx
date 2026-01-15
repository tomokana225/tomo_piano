
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
import { ProfileView } from './views/ProfileView';
import { NavButton } from './components/ui/NavButton';
import { AdminModal } from './features/admin/AdminModal';
import { SuggestSongModal } from './features/suggest/SuggestSongModal';
import { SupportModal } from './features/support/SupportModal';
import { 
    SearchIcon, MusicNoteIcon, ChartBarIcon, NewspaperIcon, 
    LightBulbIcon, MenuIcon, SunIcon, MoonIcon, 
    DocumentTextIcon, CloudUploadIcon, HeartIcon,
    ChevronLeftIcon, XIcon, InformationCircleIcon,
    CheckCircleIcon, UserGroupIcon, UserIcon
} from './components/ui/Icons';


// --- Helper for dynamic contrast ---
const getContrastColor = (hexColor: string) => {
    if (!hexColor || hexColor.length < 6) return '#ffffff';
    const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? '#000000' : '#ffffff';
};

// --- Tutorial Modal Component ---
const tutorialSteps = [
    {
        icon: LightBulbIcon,
        title: "ようこそ！",
        text: "このアプリは、ピアノ配信でリクエストできる曲を簡単に検索・管理するためのツールです。基本的な使い方を簡単にご紹介します。"
    },
    {
        icon: SearchIcon,
        title: "曲を検索する",
        text: "メイン画面の検索バーに曲名やアーティスト名を入力して、レパートリーにあるかすぐに確認できます。入力中に候補も表示されます。"
    },
    {
        icon: CloudUploadIcon,
        title: "曲をリクエストする",
        text: "検索して見つからなかった曲は、その場で簡単にリクエストできます。あなたのリクエストが次の演奏曲になるかもしれません！"
    },
    {
        icon: HeartIcon,
        title: "「いいね！」で応援",
        text: "曲の詳細カードにあるハートマークを押すと「いいね」ができます。たくさん「いいね」された曲は、配信者が練習する際の参考になります。"
    },
    {
        icon: MenuIcon,
        title: "いろんな機能を探そう",
        text: "「メニュー」ボタンから、全曲リスト、人気ランキング、お知らせなど、さまざまな機能にアクセスできます。おまかせ選曲ルーレットも試してみてくださいね！"
    },
    {
        icon: CheckCircleIcon,
        title: "準備完了！",
        text: "これで基本的な使い方はバッチリです。さっそくアプリを使ってみましょう！"
    }
];

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < tutorialSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            onClose();
        }
    };
    
    const handlePrev = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };

    const currentStep = tutorialSteps[step];
    const Icon = currentStep.icon;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-2xl shadow-2xl w-full max-md text-center p-6 sm:p-8 relative flex flex-col justify-between min-h-[380px]">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                    <XIcon className="w-6 h-6" />
                </button>

                <div>
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}>
                        <Icon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{currentStep.title}</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">{currentStep.text}</p>
                </div>

                <div className="mt-6">
                    <div className="flex justify-center gap-2 mb-6">
                        {tutorialSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${step === index ? 'bg-[var(--primary-color)]' : 'bg-border-light dark:bg-border-dark'}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        {step > 0 && (
                            <button onClick={handlePrev} className="w-full font-semibold py-3 px-6 rounded-lg transition-colors bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-primary-light dark:text-text-primary-dark">
                                戻る
                            </button>
                        )}
                        <button onClick={handleNext} className="w-full font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary)' }}>
                            {step === tutorialSteps.length - 1 ? '完了' : '次へ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const { 
        songs, songRankingList, artistRankingList, songLikeRankingList, posts, adminPosts, uiConfig, setlistSuggestions, recentRequests,
        isLoading, error, activeUserCount,
        rankingPeriod, setRankingPeriod: setPeriod,
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
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

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
        }, 6000);
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
        
        // --- Calculate contrast color for text on primary background ---
        const primaryContrast = getContrastColor(uiConfig.primaryColor);
        root.style.setProperty('--text-on-primary', primaryContrast);
        
        // 角の丸み設定
        const radiusMap = {
            none: '0px',
            small: '4px',
            medium: '12px',
            large: '24px',
            full: '9999px'
        };
        root.style.setProperty('--app-radius', radiusMap[uiConfig.borderRadius || 'medium']);

        // 影のスタイル設定
        const shadowOpacity = uiConfig.shadowIntensity ?? 0.1;
        const shadowStyle = uiConfig.cardStyle === 'elevated' 
            ? `0 10px 25px -5px rgba(0, 0, 0, ${shadowOpacity * 2}), 0 8px 10px -6px rgba(0, 0, 0, ${shadowOpacity})`
            : `0 4px 6px -1px rgba(0, 0, 0, ${shadowOpacity}), 0 2px 4px -1px rgba(0, 0, 0, ${shadowOpacity / 2})`;
        root.style.setProperty('--card-shadow', shadowStyle);

        // グラスモーフィズム対応
        if (uiConfig.cardStyle === 'glass') {
            root.style.setProperty('--card-bg-opacity', '0.6');
            root.style.setProperty('--card-blur', '12px');
        } else {
            root.style.setProperty('--card-bg-opacity', '1');
            root.style.setProperty('--card-blur', '0px');
        }

        if (uiConfig.primaryColor.includes('ec4899')) {
             root.style.setProperty('--secondary-color', '#38bdf8');
        } else {
             root.style.setProperty('--secondary-color', '#67e8f9');
        }
        
        const secondaryColor = getComputedStyle(root).getPropertyValue('--secondary-color');
        root.style.setProperty('--text-on-secondary', getContrastColor(secondaryColor.trim()));

        root.style.setProperty('--heading-font', uiConfig.headingFontFamily || "'Kiwi Maru', serif");
        root.style.setProperty('--body-font', uiConfig.bodyFontFamily || "'Noto Sans JP', sans-serif");
        root.style.setProperty('--heading-font-scale', String(uiConfig.headingFontScale || 1));
        // FIXED: Corrected 'uiApi' typo to 'uiConfig'
        root.style.setProperty('--body-font-scale', String(uiConfig.bodyFontScale || 1));

        // 背景色の設定 (画像モードでも色は維持する)
        root.style.setProperty('--background-light', uiConfig.backgroundColor);
        root.style.setProperty('--background-dark', uiConfig.darkBackgroundColor);
        
    }, [uiConfig]);

    const handleSuggestSelect = useCallback((text: string) => {
        setSearchTerm(text);
        setMode('search');
        setIsSuggestModalOpen(false);
    }, []);

    const handleSetlistSuccessRedirect = useCallback(() => {
        setMode('search');
    }, []);

    // 管理者ログイン要求
    const handleAdminLogin = useCallback(() => {
        if (isAdminAuthenticated) {
            setIsAdminModalOpen(true);
            setIsMenuOpen(false);
            return;
        }

        const password = prompt("管理者パスワードを入力してください:");
        const expectedPassword = uiConfig.adminPassword || 'admin225';
        
        if (password === expectedPassword) {
            setIsAdminAuthenticated(true);
            setIsAdminModalOpen(true);
            setIsMenuOpen(false);
        } else if (password !== null) {
            alert("パスワードが違います。");
        }
    }, [uiConfig.adminPassword, isAdminAuthenticated]);

    const renderView = () => {
        switch (mode) {
            case 'search':
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} uiConfig={uiConfig} songRankingList={songRankingList} setMode={setMode} openSuggestModal={() => setIsSuggestModalOpen(true)} openSupportModal={() => setIsSupportModalOpen(true)} />;
            case 'list':
                return <ListView songs={songs} logLike={logLike} refreshRankings={refreshRankings} />;
            case 'ranking':
                return <RankingView songs={songs} songRanking={songRankingList} artistRanking={artistRankingList} songLikeRanking={songLikeRankingList} period={rankingPeriod} setPeriod={setPeriod} />;
            case 'requests':
                return <RequestRankingView recentRequests={recentRequests} logRequest={logRequest} refreshRankings={refreshRankings} uiConfig={uiConfig} />;
            case 'news':
                return <BlogView posts={posts} />;
            case 'setlist':
                 return <SetlistSuggestionView songs={songs} onSave={saveSetlistSuggestion} onSuccessRedirect={handleSetlistSuccessRedirect}/>;
            case 'profile':
                 return <ProfileView uiConfig={uiConfig} openSupportModal={() => setIsSupportModalOpen(true)} />;
            default:
                return <SearchView songs={songs} logSearch={logSearch} logLike={logLike} logRequest={logRequest} refreshRankings={refreshRankings} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAdminLogin={handleAdminLogin} uiConfig={uiConfig} songRankingList={songRankingList} setMode={setMode} openSuggestModal={() => setIsSuggestModalOpen(true)} openSupportModal={() => setIsSupportModalOpen(true)} />;
        }
    };

    const navButtons = useMemo(() => {
        if (!uiConfig.navButtons) return [];
        const buttonConfigs = {
            search: { mode: 'search', icon: SearchIcon, config: uiConfig.navButtons.search },
            profile: { mode: 'profile', icon: UserIcon, config: uiConfig.navButtons.profile || { label: 'プロフィール', enabled: true } },
            list: { mode: 'list', icon: MusicNoteIcon, config: uiConfig.navButtons.list },
            suggest: { mode: 'suggest', icon: LightBulbIcon, config: uiConfig.navButtons.suggest },
            news: { mode: 'news', icon: NewspaperIcon, config: uiConfig.navButtons.news },
            ranking: { mode: 'ranking', icon: ChartBarIcon, config: uiConfig.navButtons.ranking },
            requests: { mode: 'requests', icon: CloudUploadIcon, config: uiConfig.navButtons.requests },
            setlist: { mode: 'setlist', icon: MenuIcon, config: uiConfig.navButtons.setlist },
            tutorial: { mode: 'tutorial', icon: InformationCircleIcon, config: uiConfig.navButtons.tutorial },
            printGakufu: { 
                href: uiConfig.printGakufuUrl || '#', 
                icon: DocumentTextIcon, 
                config: uiConfig.navButtons.printGakufu 
            },
        };
        const buttonOrder: (keyof typeof buttonConfigs)[] = ['search', 'profile', 'list', 'suggest', 'news', 'ranking', 'requests', 'setlist', 'tutorial', 'printGakufu'];
        return buttonOrder.map(key => buttonConfigs[key]).filter(btn => btn && btn.config?.enabled);
    }, [uiConfig.navButtons, uiConfig.printGakufuUrl]);

    const backgroundStyle: React.CSSProperties =
        uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl
            ? { backgroundImage: `url(${uiConfig.backgroundImageUrl})` }
            : {};
    
    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                <h2 className="font-bold text-lg whitespace-nowrap overflow-hidden text-text-primary-light dark:text-text-primary-dark">メニュー</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-primary-light dark:text-text-primary-dark">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {navButtons.map((button) => {
                    if ('href' in button && button.href) {
                        return <NavButton key={button.href as string} onClick={() => setIsMenuOpen(false)} href={button.href as string} IconComponent={button.icon} label={button.config.label} />;
                    }
                    if ('mode' in button) {
                        if (button.mode === 'suggest') {
                            return <NavButton key={button.mode} onClick={() => { setIsSuggestModalOpen(true); setIsMenuOpen(false); }} isActive={false} IconComponent={button.icon} label={button.config.label} />;
                        }
                        if (button.mode === 'tutorial') {
                            return <NavButton key={button.mode} onClick={() => { setIsTutorialOpen(true); setIsMenuOpen(false); }} isActive={false} IconComponent={button.icon} label={button.config.label} />;
                        }
                        return <NavButton key={button.mode} onClick={() => { setMode(button.mode as Mode); setIsMenuOpen(false); }} isActive={mode === button.mode} IconComponent={button.icon} label={button.config.label} />;
                    }
                    return null;
                })}
            </nav>
        </div>
    );

    // ヘッダーに配置された要素があるかチェック（コンテンツのオフセット計算用）
    const hasHeaderDecorations = useMemo(() => {
        if (!uiConfig.visualElements) return false;
        return uiConfig.visualElements.some(el => (el.page === mode || el.page === 'all') && el.placement === 'header');
    }, [uiConfig.visualElements, mode]);

    // ビジュアル要素のレンダリング
    const renderVisualElements = () => {
        if (!uiConfig.visualElements) return null;
        return uiConfig.visualElements
            .filter(el => el.page === mode || el.page === 'all')
            .map(el => {
                const style: React.CSSProperties = {
                    position: 'absolute',
                    left: `${el.x}%`,
                    width: `${el.width}%`,
                    opacity: el.opacity,
                    transform: `translate(-50%, 0) rotate(${el.rotation}deg)`,
                    zIndex: el.zIndex ?? 0,
                    pointerEvents: 'none',
                    transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
                };

                if (el.placement === 'header') {
                    style.top = '0px';
                    if (el.type === 'image') {
                        style.maskImage = 'linear-gradient(to bottom, black 70%, transparent 100%)';
                        style.WebkitMaskImage = 'linear-gradient(to bottom, black 70%, transparent 100%)';
                    }
                } else {
                    style.bottom = '0px';
                    if (el.type === 'image') {
                        style.maskImage = 'linear-gradient(to top, black 70%, transparent 100%)';
                        style.WebkitMaskImage = 'linear-gradient(to top, black 70%, transparent 100%)';
                    }
                }

                return (
                    <div key={el.id} style={style}>
                        {el.type === 'image' && el.url && (
                            <img src={el.url} alt="" className="w-full h-auto drop-shadow-xl" />
                        )}
                        {el.type === 'text' && el.content && (
                            <p style={{ fontSize: `${el.fontSize}px`, color: el.color }} className="whitespace-pre-wrap font-bold drop-shadow-lg text-center p-4">
                                {el.content}
                            </p>
                        )}
                    </div>
                );
            });
    };

    if (isLoading && songs.length === 0) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 z-[9999]">
                <LoadingSpinner className="w-16 h-16 text-pink-500" />
                <p className="mt-6 font-bold text-slate-500 dark:text-slate-400 text-lg animate-pulse">データを読み込み中...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-[100dvh] bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark overflow-hidden transition-colors duration-300">
                <div className={`fixed inset-0 bg-black/95 z-30 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />

                <aside className={`fixed z-40 h-full bg-card-background-light dark:bg-card-background-dark border-r border-border-light dark:border-border-dark flex flex-col transition-transform duration-300 w-64 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </aside>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex-shrink-0 bg-card-background-light dark:bg-card-background-dark shadow-lg h-14 sm:h-20 border-b-2 z-20" style={{ borderColor: 'var(--primary-color)' }}>
                        <div className="h-full flex items-center justify-between px-4 sm:px-6">
                            {/* Left: Menu Toggle */}
                            <div className="flex-1 flex justify-start">
                                <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-primary-light dark:text-text-primary-dark">
                                    <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                                    <span className="font-semibold hidden sm:inline">メニュー</span>
                                </button>
                            </div>

                            {/* Center: Title */}
                            <div className="flex-[4] sm:flex-[3] text-center px-2 flex items-center justify-center h-full">
                                 <h1 className="text-sm sm:text-2xl lg:text-3xl font-bold truncate leading-tight w-full" title={uiConfig.mainTitle}>
                                     {uiConfig.mainTitle}
                                 </h1>
                            </div>

                            {/* Right: Visitor & Theme */}
                            <div className="flex-1 flex justify-end items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full" title="現在の訪問者数">
                                        <UserGroupIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                                        <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">{activeUserCount}</span>
                                    </div>
                                    <button onClick={toggleDarkMode} className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle dark mode">
                                        {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                                    </button>
                                </div>
                                <button onClick={toggleDarkMode} className="sm:hidden p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle dark mode">
                                    {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar relative">
                         {error && (
                            <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/80 border border-yellow-500 text-yellow-800 dark:text-yellow-200 p-2 text-center text-sm z-20 shadow-md rounded-lg">
                                <strong>開発用情報:</strong> {error}
                            </div>
                        )}
                        
                        <div className={`transition-all duration-700 ease-in-out overflow-hidden relative z-20 ${isInfoBannerVisible ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-500/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3 text-sm shadow-md">
                                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>URLをコピペするか、ツイキャスアプリの右上にある共有ボタンから、ブラウザでサイトを読み込むと大きな画面で閲覧できます。</span>
                            </div>
                        </div>
                        
                        {uiConfig.backgroundType === 'image' && uiConfig.backgroundImageUrl && (
                            <div className="fixed inset-0 bg-cover bg-center bg-fixed z-[-1]" style={{ ...backgroundStyle, opacity: uiConfig.backgroundOpacity }} />
                        )}

                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                            {renderVisualElements()}
                        </div>

                        {mode !== 'search' && (
                            <button
                                onClick={() => setMode('search')}
                                className="flex items-center gap-2 mb-6 text-sm font-semibold transition-opacity hover:opacity-75 relative z-10"
                                style={{ color: 'var(--primary-color)' }}
                                aria-label="検索画面に戻る"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                                <span>検索画面に戻る</span>
                            </button>
                        )}
                        {/* 
                            ヘッダー装飾がある場合、被らないように pt-32 (または状況に応じた余白) を追加
                            ここでは hasHeaderDecorations に基づいて動的にクラスを付与
                        */}
                        <div className={`relative z-10 min-h-full ${uiConfig.backgroundType === 'image' ? 'content-glass' : ''} ${hasHeaderDecorations ? 'pt-24 sm:pt-40' : ''}`}>
                            {renderView()}
                        </div>
                    </main>
                    <footer className="sm:hidden flex-shrink-0 bg-card-background-light dark:bg-card-background-dark shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t border-border-light dark:border-border-dark p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around items-center z-20">
                        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full" title="現在の訪問者数">
                            <UserGroupIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">{activeUserCount}</span>
                        </div>
                        
                        <button onClick={() => setMode('search')} className={`p-3 rounded-full transition-colors ${mode === 'search' ? 'text-white shadow-md' : 'text-text-secondary-light dark:text-text-secondary-dark'}`} style={{backgroundColor: mode === 'search' ? 'var(--primary-color)' : '', color: mode === 'search' ? 'var(--text-on-primary)' : ''}} aria-label="検索">
                            <SearchIcon className="w-6 h-6" />
                        </button>
                        
                        <button onClick={() => setMode('list')} className={`p-3 rounded-full transition-colors ${mode === 'list' ? 'text-white shadow-md' : 'text-text-secondary-light dark:text-text-secondary-dark'}`} style={{backgroundColor: mode === 'list' ? 'var(--primary-color)' : '', color: mode === 'list' ? 'var(--text-on-primary)' : ''}} aria-label="曲リスト">
                            <MusicNoteIcon className="w-6 h-6" />
                        </button>

                        <button onClick={toggleDarkMode} className="p-3 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10" aria-label="ダークモード切替">
                            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                        </button>
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
                    currentMode={mode}
                    setMode={setMode}
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
            
            <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
        </>
    );
};

export default App;
