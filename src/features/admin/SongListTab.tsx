import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Song } from '../../types';
import { parseSongs, songsToString } from '../../utils/parser';
import { XIcon, PlusIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '../../components/ui/Icons';


export const SongListTab: React.FC<{onSaveSongs: (newSongList: string) => Promise<boolean>;}> = ({ onSaveSongs }) => {
    const { rawSongList, isLoading } = useApi();
    const [songString, setSongString] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [processState, setProcessState] = useState<{ status: 'idle' | 'processing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

    useEffect(() => {
        if (rawSongList) {
            setSongString(rawSongList);
        }
    }, [rawSongList]);

    useEffect(() => {
        setSongs(parseSongs(songString));
    }, [songString]);

    useEffect(() => {
        if (processState.status === 'success' || processState.status === 'error') {
            const timer = setTimeout(() => {
                setProcessState({ status: 'idle', message: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [processState.status]);

    const updateSong = useCallback((index: number, updatedSong: Partial<Song>) => {
        const newSongs = [...songs];
        newSongs[index] = { ...newSongs[index], ...updatedSong };
        setSongString(songsToString(newSongs));
    }, [songs]);

    const addSong = useCallback(() => {
        const newSong: Song = { title: '', artist: '', genre: '', isNew: false, status: 'playable' };
        const newSongs = [...songs, newSong];
        setSongString(songsToString(newSongs));
    }, [songs]);

    const deleteSong = useCallback((index: number) => {
        const newSongs = songs.filter((_, i) => i !== index);
        setSongString(songsToString(newSongs));
    }, [songs]);

    const handleSave = async () => {
        setProcessState({ status: 'processing', message: '準備中...' });

        try {
            const songsToProcess = parseSongs(songString);
            const songsWithoutKana = songsToProcess.filter(song => {
                const hasKanaInTitle = /\(.+?\)|（.+?）/.test(song.title);
                const hasKanaInArtist = /\(.+?\)|（.+?）/.test(song.artist);
                const needsKana = (str: string) => !/^[ぁ-んァ-ヶー\s()（）]+$/.test(str) && str.trim() !== '';
                return (!hasKanaInTitle && needsKana(song.title)) || (!hasKanaInArtist && needsKana(song.artist));
            });

            let processedSongs = [...songsToProcess];
            let kanaSkipped = false;

            if (songsWithoutKana.length > 0) {
                 setProcessState({
                    status: 'processing',
                    message: `${songsWithoutKana.length}曲のふりがなを生成中です...`
                });

                try {
                    const response = await fetch('/api/generate-kana', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ songs: songsWithoutKana.map(s => ({ title: s.title, artist: s.artist })) }),
                    });

                    if (response.ok) {
                        const kanaResults = await response.json();
                        const kanaMap = new Map<string, { title: string, artist: string }>();
                        if (Array.isArray(kanaResults)) {
                            kanaResults.forEach((res: any) => {
                                kanaMap.set(`${res.originalTitle}|${res.originalArtist}`, { title: res.updatedTitle, artist: res.updatedArtist });
                            });
                        }

                        processedSongs = songsToProcess.map(song => {
                            const key = `${song.title}|${song.artist}`;
                            if (kanaMap.has(key)) {
                                const updated = kanaMap.get(key)!;
                                return { ...song, title: updated.title, artist: updated.artist };
                            }
                            return song;
                        });
                    } else {
                        kanaSkipped = true;
                    }
                } catch (apiError) {
                    kanaSkipped = true;
                }
            }

            const newSongString = songsToString(processedSongs);
            setSongString(newSongString);
            
            setProcessState({ status: 'processing', message: 'データベースに保存中です...' });
            const success = await onSaveSongs(newSongString);

            if (success) {
                 setProcessState({ 
                    status: 'success', 
                    message: kanaSkipped ? '保存が完了しました（ふりがな生成はスキップされました）' : '保存が完了しました！' 
                });
            } else {
                 throw new Error("データベースへの保存に失敗しました。");
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            setProcessState({ status: 'error', message: `エラー: ${errorMessage}` });
        }
    };
    
    if (isLoading && !rawSongList) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-8 h-8"/></div>
    }

    const renderProcessBanner = () => {
        if (processState.status === 'idle') return null;
        let IconComponent: React.FC<{ className?: string }> = LoadingSpinner;
        let specificClasses = '';

        switch (processState.status) {
            case 'processing':
                specificClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200';
                IconComponent = InformationCircleIcon;
                break;
            case 'success':
                specificClasses = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
                IconComponent = CheckCircleIcon;
                break;
            case 'error':
                specificClasses = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
                IconComponent = XCircleIcon;
                break;
        }

        return (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm ${specificClasses}`} role="alert">
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${processState.status === 'processing' ? 'animate-spin' : ''}`} />
                <p className="font-bold">{processState.message}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-3">一括編集 (エクセル・CSV)</h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-4 leading-relaxed">
                    エクセルのデータを直接貼り付け可能です。<br/>形式: <code>アーティスト,曲名,ジャンル,練習中,new,季節(春/夏/秋/冬)</code>
                </p>
                <textarea
                    value={songString}
                    onChange={(e) => setSongString(e.target.value)}
                    className="w-full h-48 sm:h-64 bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"
                    placeholder="YOASOBI	夜に駆ける	J-Pop	playable	new	夏"
                />
            </section>
            
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">個別編集</h3>
                    <button onClick={addSong} className="flex items-center gap-2 text-xs font-bold py-2 px-4 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition shadow-md">
                        <PlusIcon className="w-4 h-4" />
                        曲を追加
                    </button>
                </div>
                
                <div className="space-y-3">
                    {songs.map((song, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-border-light dark:border-border-dark shadow-sm relative group">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start sm:items-center">
                                <div className="sm:col-span-3 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">アーティスト</label>
                                    <input type="text" value={song.artist} onChange={(e) => updateSong(index, { artist: e.target.value })} placeholder="アーティスト" className="w-full bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"/>
                                </div>
                                <div className="sm:col-span-4 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">曲名</label>
                                    <input type="text" value={song.title} onChange={(e) => updateSong(index, { title: e.target.value })} placeholder="曲名" className="w-full bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"/>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">季節</label>
                                    <select 
                                        value={song.season || ''} 
                                        onChange={(e) => updateSong(index, { season: e.target.value || undefined })}
                                        className="w-full bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                    >
                                        <option value="">設定なし</option>
                                        <option value="春">春 🌸</option>
                                        <option value="夏">夏 ☀️</option>
                                        <option value="秋">秋 🍂</option>
                                        <option value="冬">冬 ❄️</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2 flex gap-2 sm:pt-4">
                                    <button onClick={() => updateSong(index, { isNew: !song.isNew })} className={`flex-1 sm:flex-none text-[10px] font-bold px-3 py-2 rounded-lg transition-colors ${song.isNew ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>NEW</button>
                                    <button onClick={() => updateSong(index, { status: song.status === 'practicing' ? 'playable' : 'practicing' })} className={`flex-1 sm:flex-none text-[10px] font-bold px-3 py-2 rounded-lg transition-colors ${song.status === 'practicing' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>練習中</button>
                                </div>
                                <div className="sm:col-span-1 flex justify-end">
                                    <button onClick={() => deleteSong(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="削除">
                                        <XIcon className="w-6 h-6 sm:w-5 sm:h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="sticky bottom-0 bg-background-light dark:bg-background-dark py-4 border-t border-border-light dark:border-border-dark flex flex-col gap-4 z-10 mt-8">
                {renderProcessBanner()}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark text-center sm:text-left">
                        保存時にAIが「ふりがな」を自動付与します。<br className="hidden sm:block"/>アーティスト(ふりがな) / 曲名(ふりがな) の形式で保存されます。
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={processState.status === 'processing'}
                        className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-12 rounded-full shadow-lg disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {processState.status === 'processing' ? <LoadingSpinner className="w-5 h-5" /> : null}
                        {processState.status === 'processing' ? '処理中...' : '曲リストを保存する'}
                    </button>
                </div>
            </div>
        </div>
    );
};