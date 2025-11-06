import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Song } from '../../types';
import { parseSongs, songsToString } from '../../utils/parser';
import { XIcon, PlusIcon } from '../../components/ui/Icons';
import { GoogleGenAI } from "@google/genai";


export const SongListTab: React.FC<{onSaveSongs: (newSongList: string) => Promise<boolean>;}> = ({ onSaveSongs }) => {
    const { rawSongList, isLoading } = useApi();
    const [songString, setSongString] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingKana, setIsGeneratingKana] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (rawSongList) {
            setSongString(rawSongList);
        }
    }, [rawSongList]);

    useEffect(() => {
        setSongs(parseSongs(songString));
    }, [songString]);

    const updateSong = useCallback((index: number, updatedSong: Partial<Song>) => {
        const newSongs = [...songs];
        newSongs[index] = { ...newSongs[index], ...updatedSong };
        setSongString(songsToString(newSongs));
    }, [songs]);

    const addSong = useCallback(() => {
        // Fix: Explicitly type the new song object to prevent type inference issues.
        const newSong: Song = { title: '', artist: '', genre: '', isNew: false, status: 'playable' };
        const newSongs = [...songs, newSong];
        setSongString(songsToString(newSongs));
    }, [songs]);

    const deleteSong = useCallback((index: number) => {
        const newSongs = songs.filter((_, i) => i !== index);
        setSongString(songsToString(newSongs));
    }, [songs]);


    const handleSave = async () => {
        setIsGeneratingKana(true);
        setSaveStatus('idle');

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
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                
                const prompt = `以下の日本の曲名とアーティスト名のリストについて、一般的なカタカナの読み仮名を括弧付きで追記してください。
- 英語名、数字、記号のみ、または既にカタカナ/ひらがなの場合は、読み仮名は不要です。その場合は元の文字列をそのまま返してください。
- 読み仮名が必要な漢字や英語表記の場合のみ「元の名前(カタカナ)」の形式にしてください。
- 結果はJSON配列で、各要素は { "originalTitle": "元の曲名", "updatedTitle": "更新後の曲名", "originalArtist": "元のアーティスト名", "updatedArtist": "更新後のアーティスト名" } の形式で返してください。

リスト:
${JSON.stringify(songsWithoutKana.map(s => ({ title: s.title, artist: s.artist })))}
`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });

                const rawJson = (response.text ?? '').trim().replace(/^```json\s*|```\s*$/g, '');
                const kanaResults = rawJson ? JSON.parse(rawJson) : [];
                
                const kanaMap = new Map<string, { title: string, artist: string }>();
                kanaResults.forEach((res: any) => {
                    kanaMap.set(`${res.originalTitle}|${res.originalArtist}`, { title: res.updatedTitle, artist: res.updatedArtist });
                });

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
            
            setIsGeneratingKana(false);
            setIsSaving(true);
            const success = await onSaveSongs(newSongString);
            setSaveStatus(success ? 'success' : 'error');

        } catch (error) {
            console.error("Failed to generate kana or save:", error);
            setSaveStatus('error');
            setIsGeneratingKana(false);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };
    
    const buttonText = isGeneratingKana ? 'ふりがな生成中...' : (isSaving ? '保存中...' : '保存する (ふりがな自動付与)');

    if (isLoading && !rawSongList) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-8 h-8"/></div>
    }

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


            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">保存時に、漢字や英語の曲名・アーティスト名に<br/>自動でふりがな（カタカナ）を追加します。</p>
                <div className="flex items-center gap-4">
                    {saveStatus === 'success' && <p className="text-green-500 dark:text-green-400">保存しました！</p>}
                    {saveStatus === 'error' && <p className="text-red-500 dark:text-red-400">失敗しました。</p>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isGeneratingKana}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2 min-w-[200px] justify-center"
                    >
                        {isSaving || isGeneratingKana ? <LoadingSpinner className="w-5 h-5" /> : null}
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};