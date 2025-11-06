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

            if (songsWithoutKana.length > 0) {
                 setProcessState({
                    status: 'processing',
                    message: `${songsWithoutKana.length}曲のふりがなを生成中です...`
                });
                 const response = await fetch('/api/generate-kana', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songs: songsWithoutKana.map(s => ({ title: s.title, artist: s.artist })) }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'ふりがなの生成に失敗しました。');
                }

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
            }

            const newSongString = songsToString(processedSongs);
            setSongString(newSongString);
            
            setProcessState({ status: 'processing', message: 'データベースに保存中です...' });
            const success = await onSaveSongs(newSongString);

            if (success) {
                 setProcessState({ status: 'success', message: '保存が完了しました！' });
            } else {
                 throw new Error("データベースへの保存に失敗しました。");
            }

        } catch (error) {
            console.error("Failed to generate kana or save:", error);
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            setProcessState({ status: 'error', message: `エラー: ${errorMessage}` });
        }
    };
    
    if (isLoading && !rawSongList) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-8 h-8"/></div>
    }

    const renderProcessBanner = () => {
        if (processState.status === 'idle') return null;

        const baseClasses = 'p-3 rounded-md flex items-center gap-3 text-sm transition-opacity duration-300';
        let specificClasses = '';
        let IconComponent: React.FC<{ className?: string }> = LoadingSpinner;

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
            <div className={`${baseClasses} ${specificClasses}`} role="alert">
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${processState.status === 'processing' ? 'animate-spin' : ''}`} />
                <p className="font-medium">{processState.message}</p>
            </div>
        );
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">曲リストを編集 (Excel等から貼付)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <code>曲名,アーティスト名,ジャンル,new,練習中</code> の形式で入力してください。下のリストと連動します。
            </p>
            <textarea
                value={songString}
                onChange={(e) => setSongString(e.target.value)}
                className="w-full h-64 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"
                placeholder="夜に駆ける,YOASOBI,J-Pop,new..."
            />
            
            <h3 className="text-lg font-semibold mt-6 mb-2">クリックで編集</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {songs.map((song, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-md">
                        <input type="text" value={song.title} onChange={(e) => updateSong(index, { title: e.target.value })} placeholder="曲名" className="col-span-4 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"/>
                        <input type="text" value={song.artist} onChange={(e) => updateSong(index, { artist: e.target.value })} placeholder="アーティスト" className="col-span-4 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"/>
                        <div className="col-span-3 flex gap-2">
                            <button onClick={() => updateSong(index, { isNew: !song.isNew })} className={`text-xs px-2 py-1 rounded-full ${song.isNew ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'}`}>NEW</button>
                            <button onClick={() => updateSong(index, { status: song.status === 'practicing' ? 'playable' : 'practicing' })} className={`text-xs px-2 py-1 rounded-full ${song.status === 'practicing' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'}`}>練習中</button>
                        </div>
                        <button onClick={() => deleteSong(index)} className="col-span-1 text-red-500 hover:text-red-400"><XIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
             <button onClick={addSong} className="mt-3 flex items-center gap-2 text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-semibold py-2 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md">
                <PlusIcon className="w-4 h-4" />
                曲を追加
            </button>

            <div className="mt-6 space-y-4">
                {renderProcessBanner()}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right">保存時に、漢字や英語の曲名・アーティスト名に<br/>自動でふりがな（カタカナ）を追加します。</p>
                    <button
                        onClick={handleSave}
                        disabled={processState.status === 'processing'}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2 min-w-[200px] justify-center"
                    >
                        {processState.status === 'processing' ? <LoadingSpinner className="w-5 h-5" /> : null}
                        {processState.status === 'processing' ? '処理中...' : '保存する (ふりがな自動付与)'}
                    </button>
                </div>
            </div>
        </div>
    );
};