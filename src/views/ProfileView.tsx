
import React from 'react';
import { UiConfig } from '../types';
import { SimpleMarkdownRenderer } from '../components/ui/SimpleMarkdownRenderer';
import { HeartIcon, TwitcasIcon, YouTubeIcon, XSocialIcon } from '../components/ui/Icons';

interface ProfileViewProps {
    uiConfig: UiConfig;
    openSupportModal: () => void;
}

const SocialButton: React.FC<{ href: string; icon: React.ReactNode; label: string; colorClass: string }> = ({ href, icon, label, colorClass }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-white font-bold text-xs transition-all transform active:scale-95 shadow-md ${colorClass}`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
    >
        <div className="flex-shrink-0">{icon}</div>
        <span className="truncate">{label}</span>
    </a>
);

export const ProfileView: React.FC<ProfileViewProps> = ({ uiConfig, openSupportModal }) => {
    const { 
        profileName, profileTitle, profileBio, profileImageUrl, profileHeaderImageUrl,
        twitcastingUrl, youtubeUrl, xUrl,
        specialButtons
    } = uiConfig;

    const hasSocialLinks = twitcastingUrl || youtubeUrl || xUrl;

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in pb-12">
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-3xl shadow-xl overflow-hidden border border-border-light dark:border-border-dark flex flex-col">
                
                {/* 1. Header Decoration (Banner Area) */}
                <div className="h-32 sm:h-44 relative bg-gray-200 dark:bg-gray-800">
                    {profileHeaderImageUrl ? (
                        <img src={profileHeaderImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-90" />
                    )}
                </div>
                
                <div className="px-6 pb-10 -mt-12 sm:-mt-16 text-center z-10">
                    {/* 2. Profile Icon (Overlapping) */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-[#1e293b] bg-white dark:bg-[#1e293b] overflow-hidden shadow-lg mx-auto">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt={profileName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-3xl sm:text-4xl opacity-50">👤</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Name and Title */}
                    <div className="mt-4">
                        <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'var(--text-primary-dynamic)' }}>
                            {profileName || '配信者名未設定'}
                        </h2>
                        <p className="font-extrabold text-[10px] sm:text-xs tracking-widest uppercase" style={{ color: 'var(--primary-color)' }}>
                            {profileTitle || 'PIANIST / STREAMER'}
                        </p>
                    </div>

                    {/* 4. Bio Box (Matches the image box style) */}
                    <div className="mt-8 text-left bg-black/5 dark:bg-[#111827]/50 p-6 rounded-3xl border border-border-light dark:border-white/10">
                        {profileBio ? (
                            <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base prose-p:leading-relaxed prose-img:rounded-xl">
                                <SimpleMarkdownRenderer content={profileBio} />
                            </div>
                        ) : (
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-center italic py-4">
                                自己紹介文がまだ設定されていません。
                            </p>
                        )}
                    </div>

                    {/* Social Links Section */}
                    {hasSocialLinks && (
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center gap-3 justify-center">
                                <div className="h-px flex-1 bg-border-light dark:bg-border-dark opacity-50"></div>
                                <span className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Connect</span>
                                <div className="h-px flex-1 bg-border-light dark:bg-border-dark opacity-50"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {twitcastingUrl && (
                                    <SocialButton 
                                        href={twitcastingUrl} 
                                        icon={<TwitcasIcon className="w-4 h-4 sm:w-5 sm:h-5" />} 
                                        label={specialButtons?.twitcas?.label || 'ツイキャス'} 
                                        colorClass="bg-[#2190b8] hover:bg-[#1c7a9e]"
                                    />
                                )}
                                {youtubeUrl && (
                                    <SocialButton 
                                        href={youtubeUrl} 
                                        icon={<YouTubeIcon className="w-4 h-4 sm:w-5 sm:h-5" />} 
                                        label={specialButtons?.youtube?.label || 'YouTube'} 
                                        colorClass="bg-[#ff0000] hover:bg-[#cc0000]"
                                    />
                                )}
                                {xUrl && (
                                    <SocialButton 
                                        href={xUrl} 
                                        icon={<XSocialIcon className="w-4 h-4 sm:w-5 sm:h-5" />} 
                                        label={specialButtons?.x?.label || 'X (Twitter)'} 
                                        colorClass="bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Support Button */}
                    <div className="mt-10 pt-8 border-t border-border-light dark:border-border-dark">
                        <button
                            onClick={openSupportModal}
                            className="inline-flex items-center gap-2 px-10 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow-lg transform transition active:scale-95"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        >
                            <HeartIcon className="w-5 h-5" />
                            {specialButtons?.support?.label || '配信者をサポートする'}
                        </button>
                    </div>
                </div>
            </div>
            
            <p className="mt-12 text-center text-[10px] text-text-secondary-light dark:text-text-secondary-dark opacity-40 font-medium tracking-widest uppercase">
                Piano Live Streaming & Request App
            </p>
        </div>
    );
};
