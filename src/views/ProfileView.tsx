import React from 'react';
import { UiConfig } from '../types';
import { SimpleMarkdownRenderer } from '../components/ui/SimpleMarkdownRenderer';
import { HeartIcon } from '../components/ui/Icons';

interface ProfileViewProps {
    uiConfig: UiConfig;
    openSupportModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ uiConfig, openSupportModal }) => {
    const { profileName, profileTitle, profileBio, profileImageUrl } = uiConfig;

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-3xl shadow-xl overflow-hidden fancy-card border border-border-light dark:border-border-dark">
                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] opacity-80" />
                
                <div className="px-6 pb-8 -mt-16 text-center">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white overflow-hidden shadow-lg mx-auto">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt={profileName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-4xl text-gray-400">👤</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-3xl font-bold mb-1">{profileName || '配信者名未設定'}</h2>
                        <p className="text-[var(--primary-color)] font-bold text-sm tracking-widest uppercase">
                            {profileTitle || 'Broadcaster / Pianist'}
                        </p>
                    </div>

                    <div className="mt-8 text-left bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-border-light dark:border-border-dark">
                        {profileBio ? (
                            <SimpleMarkdownRenderer content={profileBio} />
                        ) : (
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-center italic py-4">
                                自己紹介文がまだ設定されていません。
                            </p>
                        )}
                    </div>

                    <button
                        onClick={openSupportModal}
                        className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow-lg transform transition active:scale-95"
                    >
                        <HeartIcon className="w-5 h-5" />
                        配信者をサポートする
                    </button>
                </div>
            </div>
            
            <p className="mt-10 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark opacity-50 font-medium">
                ピアノ配信を聴きながら、リクエストをお楽しみください。
            </p>
        </div>
    );
};