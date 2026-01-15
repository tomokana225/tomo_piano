
import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from './hooks/useApi';
import { Mode } from './types';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { SearchView } from './views/SearchView';
import { ListView } from './views/ListView';
import { RankingView } from './views/RankingView';
import { RequestRankingView } from './views/RequestRankingView';
import { BlogView } from './views/BlogView';
import { ProfileView } from './views/ProfileView';
import { NavButton } from './components/ui/NavButton';
import { AdminModal } from './features/admin/AdminModal';
import { SuggestSongModal } from './features/suggest/SuggestSongModal';
import { SupportModal } from './features/support/SupportModal';
import { 
    SearchIcon, MusicNoteIcon, NewspaperIcon, 
    MenuIcon, SunIcon, MoonIcon, 
    CloudUploadIcon, HeartIcon,
    XIcon, InformationCircleIcon,
    UserIcon, LightBulbIcon
} from './components/ui/Icons';

const getContrastColor = (hexColor: string) => {
    if (!hexColor || hexColor.length < 6) return '#ffffff';
    const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? '#000000' : '#ffffff';
};

const tutorialSteps = [
    { icon: LightBulbIcon, title: "ようこそ！", text: "このアプリは、ピアノ配信でリクエストできる曲を簡単に検索・管理するためのツールです。" },
    { icon: SearchIcon, title: "曲を検索する", text: "メイン画面の検索バーに曲名やアーティスト名を入力して、レパートリーにあるか確認できます。" },
    { icon: CloudUploadIcon, title: "曲をリクエストする", text: "見つからなかった曲は、その場でリクエストできます。" },
    { icon: HeartIcon, title: "応援", text: "「いいね」された曲は、配信者が練習する際の参考になります。" }
];

const TutorialModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);
    if (!isOpen) return null;
    const currentStep = tutorialSteps[step];
    const Icon = currentStep.icon;
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-2xl shadow-2xl w-full max-w-md text-center p-8 relative flex flex-col min-h-[380px]">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary-light dark:text-text-secondary-dark"><XIcon className="w-6 h-6" /></button>
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-pink-500/10"><Icon className="w-8 h-8 text-pink-500" /></div>
                    <h2 className="text-2xl font-bold mb-3">{currentStep.title}</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">{currentStep.text}</p>
                </div>
                <div className="mt-6">
                    <div className="flex justify-center gap-2 mb-6">
                        {tutorialSteps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${step === i ? 'bg-pink-500' : 'bg-gray-300'}`} />)}
                    </div>
                    <div className="flex gap-4">
                        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="w-full py-3 bg-gray-100 dark:bg-white/10 rounded-lg">戻る</button>}
                        <button onClick={() => step < tutorialSteps.length - 1 ? setStep(s => s + 1) : onClose()} className="w-full py-3 bg-pink-500 text-white rounded-lg font-bold">
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
        songs, posts, adminPosts, uiConfig, isLoading,
        setAdminPassword, onSaveSongs, onSaveUiConfig, onSavePost, onDeletePost,
        logSearch, logRequest, logLike, refreshRankings
    } = useApi();
    
    const [mode, setMode] = useState<Mode>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isInfoBannerVisible, setIsInfoBannerVisible] = useState(true);

    useEffect(() => {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
        setTimeout(() => setIsInfoBannerVisible(false), 6000);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', uiConfig.primaryColor);
        root.style.setProperty('--text-on-primary', getContrastColor(uiConfig.primaryColor));
        root.style.setProperty('--background-light', uiConfig.backgroundColor);
        root.style.setProperty('--background-dark', uiConfig.darkBackgroundColor);
        
        const currentBg = isDarkMode ? uiConfig.darkBackgroundColor : uiConfig.backgroundColor;
        const dynText = getContrastColor(currentBg);
        root.style.setProperty('--text-primary-dynamic', dynText);
        root.style.setProperty('--text-secondary-dynamic', dynText === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)');
    }, [uiConfig, isDarkMode]);

    const handleAdminLogin = useCallback(async () => {
        if (isAdminAuthenticated) {
            setIsAdminModalOpen(true);
            return;
        }
        const password = prompt("管理者パスワードを入力してください:");
        if (!password) return;

        // サーバーサイドでパスワードを検証
        const testRes = await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
            body: JSON.stringify({ ping: true })
        });

        if (testRes.ok) {
            setAdminPassword(password);
            setIsAdminAuthenticated(true);
            setIsAdminModalOpen(true);
        } else {
            alert("パスワードが違います。");
        }
    }, [isAdminAuthenticated, setAdminPassword]);

    const renderView = () => {
        switch (mode) {
            case 'list': return <ListView songs={songs} logLike={logLike} refreshRankings={refreshRankings} />;
            case 'ranking': return <RankingView songs={songs} songRanking={[]} artistRanking={[]} songLikeRanking={[]} period="all" setPeriod={() => {}} />;
            case 'requests': return <RequestRankingView recentRequests={[]} logRequest={logRequest} refreshRankings={refreshRankings} uiConfig={uiConfig} />;
            case 'news': return <BlogView posts={posts} />;
            case 'profile': return <ProfileView uiConfig={uiConfig} openSupportModal={() => setIsSupportModalOpen(true)} />;
            default: return <SearchView 
                songs={songs} 
                logSearch={logSearch} 
                logLike={logLike} 
                logRequest={logRequest} 
                refreshRankings={refreshRankings} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onAdminLogin={handleAdminLogin} 
                uiConfig={uiConfig} 
                songRankingList={[]} 
                setMode={setMode} 
                openSuggestModal={() => setIsSuggestModalOpen(true)} 
                openSupportModal={() => setIsSupportModalOpen(true)} 
            />;
        }
    };

    if (isLoading && songs.length === 0) return <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950"><LoadingSpinner className="w-12 h-12 text-pink-500" /></div>;

    return (
        <div className="flex h-[100dvh] overflow-hidden transition-colors duration-300" style={{ backgroundColor: isDarkMode ? 'var(--background-dark)' : 'var(--background-light)', color: 'var(--text-primary-dynamic)' }}>
            <div className={`fixed inset-0 bg-black/50 z-30 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <aside className={`fixed z-40 h-full border-r border-border-light dark:border-border-dark bg-card-background-light dark:bg-card-background-dark w-64 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold">メニュー</h2>
                    <button onClick={() => setIsMenuOpen(false)}><XIcon className="w-6 h-6"/></button>
                </div>
                <nav className="p-2 space-y-1">
                    <NavButton onClick={() => { setMode('search'); setIsMenuOpen(false); }} isActive={mode === 'search'} IconComponent={SearchIcon} label="曲を検索" />
                    <NavButton onClick={() => { setMode('list'); setIsMenuOpen(false); }} isActive={mode === 'list'} IconComponent={MusicNoteIcon} label="曲リスト" />
                    <NavButton onClick={() => { setMode('news'); setIsMenuOpen(false); }} isActive={mode === 'news'} IconComponent={NewspaperIcon} label="お知らせ" />
                    <NavButton onClick={() => { setMode('profile'); setIsMenuOpen(false); }} isActive={mode === 'profile'} IconComponent={UserIcon} label="プロフィール" />
                    <NavButton onClick={() => { setIsTutorialOpen(true); setIsMenuOpen(false); }} isActive={false} IconComponent={InformationCircleIcon} label="ガイド" />
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 sm:h-16 border-b-2 flex items-center justify-between px-4 sm:px-6 bg-card-background-light dark:bg-card-background-dark z-20" style={{ borderColor: 'var(--primary-color)' }}>
                    <button onClick={() => setIsMenuOpen(true)} className="p-2"><MenuIcon className="w-6 h-6" /></button>
                    <h1 className="font-bold truncate text-xl" style={{ color: uiConfig.mainTitleColor || 'var(--primary-color)' }}>{uiConfig.mainTitle}</h1>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2">{isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}</button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
                    {isInfoBannerVisible && (
                        <div className="mb-6 bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg flex gap-3 text-sm animate-fade-in">
                            <InformationCircleIcon className="w-5 h-5" />
                            <span>ブラウザで閲覧すると大画面で操作可能です。</span>
                        </div>
                    )}
                    <div className="relative z-10">{renderView()}</div>
                </main>
            </div>

            {isAdminAuthenticated && (
                <AdminModal 
                    isOpen={isAdminModalOpen} 
                    onClose={() => setIsAdminModalOpen(false)} 
                    songs={songs} 
                    posts={adminPosts} 
                    uiConfig={uiConfig} 
                    setlistSuggestions={[]} 
                    recentRequests={[]} 
                    onSaveSongs={onSaveSongs} 
                    onDeletePost={onDeletePost} 
                    onSavePost={onSavePost} 
                    onSaveUiConfig={onSaveUiConfig} 
                    currentMode={mode} 
                    setMode={setMode} 
                />
            )}
            
            <SuggestSongModal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} songs={songs} onSelect={(t) => { setSearchTerm(t); setMode('search'); setIsSuggestModalOpen(false); }} />
            <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} uiConfig={uiConfig} />
            <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
        </div>
    );
};

export default App;
