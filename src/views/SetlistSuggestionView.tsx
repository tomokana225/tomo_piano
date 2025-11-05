import React, { useState, useMemo, useRef } from 'react';
import { Song } from '../types';
import { SearchIcon, XIcon, PlusIcon, CheckCircleIcon, ChevronLeftIcon } from '../components/ui/Icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const MAX_SONGS = 5;

interface SetlistSuggestionViewProps {
    songs: Song[];
    onSave: (songs: string[], requester: string) => Promise<boolean>;
}

export const SetlistSuggestionView: React.FC<SetlistSuggestionViewProps> = ({ songs, onSave }) => {
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<'selection' | 'confirmation' | 'success'>('selection');
    const [requester, setRequester] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const draggedItem = useRef<Song | null>(null);
    const draggedOverItem = useRef<Song | null>(null);

    const filteredSongs = useMemo(() => {
        if (!searchTerm) return songs;
        const lowercasedTerm = searchTerm.toLowerCase();
        return songs.filter(song =>
            song.title.toLowerCase().includes(lowercasedTerm) ||
            song.artist.toLowerCase().includes(lowercasedTerm)
        );
    }, [songs, searchTerm]);

    const isSongSelected = (song: Song) => selectedSongs.some(s => s.title === song.title && s.artist === song.artist);

    const handleAddSong = (song: Song) => {
        if (selectedSongs.length < MAX_SONGS && !isSongSelected(song)) {
            setSelectedSongs(prev => [...prev, song]);
        }
    };

    const handleRemoveSong = (songToRemove: Song) => {
        setSelectedSongs(prev => prev.filter(song => song.title !== songToRemove.title || song.artist !== songToRemove.artist));
    };
    
    const handleDragStart = (song: Song) => {
        draggedItem.current = song;
    };
    
    const handleDragEnter = (song: Song) => {
        draggedOverItem.current = song;
    };

    const handleDragEnd = () => {
        if (draggedItem.current && draggedOverItem.current) {
            const newSelectedSongs = [...selectedSongs];
            const draggedIndex = selectedSongs.findIndex(s => s.title === draggedItem.current!.title && s.artist === draggedItem.current!.artist);
            const targetIndex = selectedSongs.findIndex(s => s.title === draggedOverItem.current!.title && s.artist === draggedOverItem.current!.artist);
            
            if (draggedIndex > -1 && targetIndex > -1) {
                const [removed] = newSelectedSongs.splice(draggedIndex, 1);
                newSelectedSongs.splice(targetIndex, 0, removed);
                setSelectedSongs(newSelectedSongs);
            }
        }
        draggedItem.current = null;
        draggedOverItem.current = null;
    };

    const handleSubmit = async () => {
        if (!requester.trim()) {
            alert('ツイキャスアカウント名を入力してください。');
            return;
        }
        setIsSubmitting(true);
        const songTitles = selectedSongs.map(s => `${s.title} / ${s.artist}`);
        const success = await onSave(songTitles, requester);
        if (success) {
            setStep('success');
        } else {
            alert('提案の送信に失敗しました。');
        }
        setIsSubmitting(false);
    };

    const renderSelectionStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Song List */}
            <div>
                <h3 className="text-xl font-bold mb-4">曲リストから選ぶ ({songs.length}曲)</h3>
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="曲を検索..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                </div>
                <div className="h-96 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {filteredSongs.map(song => {
                        const isSelected = isSongSelected(song);
                        const isFull = selectedSongs.length >= MAX_SONGS;
                        return (
                            <div key={`${song.title}-${song.artist}`} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{song.title}</p>
                                    <p className="text-sm text-gray-400">{song.artist}</p>
                                </div>
                                <button
                                    onClick={() => handleAddSong(song)}
                                    disabled={isSelected || isFull}
                                    className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Column: Selected Setlist */}
            <div>
                <h3 className="text-xl font-bold mb-4">あなたのセトリ ({selectedSongs.length}/{MAX_SONGS})</h3>
                <div className="h-96 bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    {selectedSongs.length > 0 ? (
                        <div className="space-y-2 flex-grow overflow-y-auto custom-scrollbar">
                           {selectedSongs.map((song, index) => (
                                <div
                                    key={`${song.title}-${song.artist}`}
                                    className="bg-gray-800 p-3 rounded-md flex justify-between items-center cursor-move"
                                    draggable
                                    onDragStart={() => handleDragStart(song)}
                                    onDragEnter={() => handleDragEnter(song)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 font-bold">{index + 1}</span>
                                        <div>
                                            <p className="font-semibold">{song.title}</p>
                                            <p className="text-sm text-gray-400">{song.artist}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveSong(song)} className="p-1 rounded-full hover:bg-red-500/20 text-red-400">
                                        <XIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                           ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-gray-500">
                            <p>左のリストから曲を追加してください<br/>(ドラッグ＆ドロップで順番を入れ替えられます)</p>
                        </div>
                    )}
                </div>
                 <button 
                    onClick={() => setStep('confirmation')}
                    disabled={selectedSongs.length === 0}
                    className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    この内容で提案に進む
                </button>
            </div>
        </div>
    );

    const renderConfirmationStep = () => (
        <div className="max-w-md mx-auto">
             <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold mb-4">
                <ChevronLeftIcon className="w-4 h-4" />
                <span>曲の選択に戻る</span>
            </button>
            <h3 className="text-2xl font-bold text-center mb-4">提案するセトリの確認</h3>
            <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
                <ol className="list-decimal list-inside space-y-3">
                    {selectedSongs.map(song => (
                        <li key={`${song.title}-${song.artist}`} className="pl-2">
                             <p className="font-semibold text-lg">{song.title}</p>
                             <p className="text-sm text-gray-400 ml-1">- {song.artist}</p>
                        </li>
                    ))}
                </ol>
            </div>
             <div>
                <label htmlFor="requester_id" className="block text-sm text-left font-medium text-gray-300 mb-1">ツイキャスアカウント名 <span className="text-red-400">*</span></label>
                <input
                    id="requester_id"
                    type="text"
                    value={requester}
                    onChange={(e) => setRequester(e.target.value)}
                    placeholder="@の後ろのIDを入力"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                />
                 <p className="text-xs text-gray-400 text-left mt-1">配信者のみに公開されます。</p>
            </div>
             <button
                onClick={handleSubmit}
                disabled={isSubmitting || !requester.trim()}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : null}
                {isSubmitting ? '送信中...' : 'このセトリを提案する'}
            </button>
        </div>
    );

     const renderSuccessStep = () => (
        <div className="text-center p-6 bg-gray-800/50 rounded-lg max-w-md mx-auto flex flex-col items-center gap-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400"/>
            <h3 className="text-2xl font-bold">ありがとうございます！</h3>
            <p className="text-lg text-gray-300">セットリストの提案を送信しました。<br/>配信の参考にさせていただきます！</p>
        </div>
    );


    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6">配信のセトリを提案する</h2>
            {step === 'selection' && renderSelectionStep()}
            {step === 'confirmation' && renderConfirmationStep()}
            {step === 'success' && renderSuccessStep()}
        </div>
    );
};