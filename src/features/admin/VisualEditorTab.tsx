import React, { useState } from 'react';
import { UiConfig, Mode, VisualElement } from '../../types';
import { XIcon, ImageIcon, TextIcon } from '../../components/ui/Icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface VisualEditorTabProps {
    uiConfig: UiConfig;
    onSave: (config: UiConfig) => Promise<boolean>;
    currentMode: Mode;
    setMode: (mode: Mode) => void;
}

export const VisualEditorTab: React.FC<VisualEditorTabProps> = ({ uiConfig, onSave, currentMode, setMode }) => {
    const [elements, setElements] = useState<VisualElement[]>(uiConfig.visualElements || []);
    const [isSaving, setIsSaving] = useState(false);

    const pages: (Mode | 'all')[] = ['all', 'search', 'list', 'ranking', 'requests', 'news', 'setlist', 'profile'];

    const addElement = (type: 'image' | 'text') => {
        const newElement: VisualElement = {
            id: `el-${Date.now()}`,
            page: currentMode,
            type: type,
            url: type === 'image' ? 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200' : undefined,
            content: type === 'text' ? '新しいテキスト' : undefined,
            x: 50,
            placement: 'header',
            width: 25,
            opacity: 1,
            rotation: 0,
            zIndex: 0,
            fontSize: type === 'text' ? 18 : undefined,
            color: type === 'text' ? '#000000' : undefined,
        };
        setElements([...elements, newElement]);
    };

    const updateElement = (id: string, updates: Partial<VisualElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const removeElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
    };

    const setAsBanner = (id: string) => {
        updateElement(id, {
            width: 100,
            x: 50,
            rotation: 0,
            opacity: 0.8,
            placement: 'header'
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const newConfig = { ...uiConfig, visualElements: elements };
        await onSave(newConfig);
        setIsSaving(false);
    };

    const filteredElements = elements.filter(el => el.page === currentMode || el.page === 'all');

    return (
        <div className="space-y-8 pb-20">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                <h3 className="text-lg font-bold mb-4">装飾するページを選択</h3>
                <div className="flex flex-wrap gap-2">
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => page !== 'all' && setMode(page)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${
                                (page === 'all' ? false : currentMode === page)
                                    ? 'bg-[var(--primary-color)] text-white'
                                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                            }`}
                        >
                            {page.toUpperCase()}
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    選択したページの「背景」として画像やテキストを配置します。<br/>
                    検索バーなどのUIの背後に表示されるため、操作を邪魔しません。
                </p>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => addElement('image')}
                    className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                >
                    <ImageIcon className="w-5 h-5" />
                    画像を追加
                </button>
                <button 
                    onClick={() => addElement('text')}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                >
                    <TextIcon className="w-5 h-5" />
                    テキストを追加
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold px-1">配置済みの要素 ({filteredElements.length})</h3>
                {filteredElements.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/30 border-2 border-dashed border-border-light rounded-2xl">
                        <p className="text-sm text-text-secondary-light">このページにはまだ装飾がありません。</p>
                    </div>
                )}
                {filteredElements.map(el => (
                    <div key={el.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-black/5 dark:bg-white/10 rounded flex items-center justify-center">
                                    {el.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <TextIcon className="w-4 h-4" />}
                                </div>
                                <span className="font-bold text-sm">{el.type === 'image' ? '画像要素' : 'テキスト要素'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {el.type === 'image' && (
                                    <button 
                                        onClick={() => setAsBanner(el.id)}
                                        className="text-[10px] font-bold bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                                    >
                                        バナーとして配置
                                    </button>
                                )}
                                <select 
                                    value={el.page} 
                                    onChange={(e) => updateElement(el.id, { page: e.target.value as any })}
                                    className="bg-gray-50 dark:bg-gray-700 text-[10px] font-bold p-1 rounded border border-border-light"
                                >
                                    {pages.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                                <button onClick={() => removeElement(el.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {el.type === 'image' ? (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">画像URL (横長画像がおすすめ)</label>
                                        <input 
                                            type="text" 
                                            value={el.url || ''} 
                                            onChange={(e) => updateElement(el.id, { url: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-border-light border p-2 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">内容</label>
                                        <textarea 
                                            value={el.content || ''} 
                                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-border-light border p-2 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 outline-none h-16"
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">配置エリア (自動フェード適用)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => updateElement(el.id, { placement: 'header' })}
                                            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${el.placement === 'header' ? 'bg-cyan-600 text-white shadow-inner' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            ヘッダー背後
                                        </button>
                                        <button 
                                            onClick={() => updateElement(el.id, { placement: 'footer' })}
                                            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${el.placement === 'footer' ? 'bg-cyan-600 text-white shadow-inner' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            フッター背後
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">横位置 (X): {el.x}%</label>
                                        <input type="range" min="0" max="100" value={el.x} onChange={(e) => updateElement(el.id, { x: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">大きさ(幅): {el.width}%</label>
                                        <input type="range" min="5" max="100" value={el.width} onChange={(e) => updateElement(el.id, { width: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">不透明度: {Math.round(el.opacity * 100)}%</label>
                                        <input type="range" min="0" max="1" step="0.05" value={el.opacity} onChange={(e) => updateElement(el.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">回転: {el.rotation}°</label>
                                        <input type="range" min="-180" max="180" value={el.rotation} onChange={(e) => updateElement(el.id, { rotation: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                                {el.type === 'text' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">サイズ: {el.fontSize}px</label>
                                            <input type="number" value={el.fontSize} onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-gray-50 border border-border-light p-1.5 rounded text-xs outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">色</label>
                                            <input type="color" value={el.color} onChange={(e) => updateElement(el.id, { color: e.target.value })} className="w-full h-8 bg-transparent border-none outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-border-light dark:border-border-dark flex justify-center z-50">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-16 rounded-full shadow-xl disabled:opacity-50 transition-all transform active:scale-95 flex items-center gap-2"
                >
                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                    配置を保存する
                </button>
            </div>
        </div>
    );
};
