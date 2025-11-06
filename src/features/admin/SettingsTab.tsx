import React, { useState, useEffect } from 'react';
import { UiConfig, NavButtonConfig } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface SettingsTabProps {
    uiConfig: UiConfig;
    onSaveUiConfig: (config: UiConfig) => Promise<boolean>;
}

const backgroundPresets = [
  { name: '楽譜', url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop' },
  { name: 'ピアノ', url: 'https://images.unsplash.com/photo-1520444453406-52ab68434346?q=80&w=2070&auto=format&fit=crop' },
  { name: 'ステージ', url: 'https://images.unsplash.com/photo-1543305986-a783e7a68028?q=80&w=2070&auto=format&fit=crop' },
  { name: 'ギター', url: 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=2070&auto=format&fit=crop' },
  { name: 'レコード', url: 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?q=80&w=1974&auto=format&fit=crop' },
];

const colorPresets = [
    { name: 'デフォルトピンク', primaryColor: '#ec4899', backgroundColor: '#f3f4f6', darkBackgroundColor: '#111827' },
    { name: 'オーシャンシアン', primaryColor: '#06b6d4', backgroundColor: '#f0f9ff', darkBackgroundColor: '#082f49' },
    { name: 'フォレストグリーン', primaryColor: '#16a34a', backgroundColor: '#f0fdf4', darkBackgroundColor: '#14532d' },
    { name: 'サンセットオレンジ', primaryColor: '#f97316', backgroundColor: '#fff7ed', darkBackgroundColor: '#431407' },
    { name: 'ロイヤルパープル', primaryColor: '#8b5cf6', backgroundColor: '#f5f3ff', darkBackgroundColor: '#2e1065' },
];

const headingFontOptions = [
    // Serif fonts
    { name: 'Kiwi Maru (明朝)', value: "'Kiwi Maru', serif" },
    { name: 'しっぽり明朝', value: "'Shippori Mincho', serif" },
    { name: 'Yuji Syuku (明朝)', value: "'Yuji Syuku', serif" },
    { name: 'さわらび明朝', value: "'Sawarabi Mincho', serif" },
    { name: 'Merriweather (明朝)', value: "'Merriweather', serif" },
    // Sans-serif (Gothic) fonts
    { name: 'Noto Sans JP (ゴシック)', value: "'Noto Sans JP', sans-serif" },
    { name: 'M PLUS Rounded 1c (ゴシック)', value: "'M PLUS Rounded 1c', sans-serif" },
    { name: 'Zen Kaku Gothic New (ゴシック)', value: "'Zen Kaku Gothic New', sans-serif" },
    { name: 'さわらびゴシック', value: "'Sawarabi Gothic', sans-serif" },
    { name: 'Roboto (ゴシック)', value: "'Roboto', sans-serif" },
];

const bodyFontOptions = [
    // Sans-serif (Gothic) fonts
    { name: 'Noto Sans JP (ゴシック)', value: "'Noto Sans JP', sans-serif" },
    { name: 'M PLUS Rounded 1c (ゴシック)', value: "'M PLUS Rounded 1c', sans-serif" },
    { name: 'Zen Kaku Gothic New (ゴシック)', value: "'Zen Kaku Gothic New', sans-serif" },
    { name: 'さわらびゴシック', value: "'Sawarabi Gothic', sans-serif" },
    { name: 'Roboto (ゴシック)', value: "'Roboto', sans-serif" },
    // Serif fonts
    { name: 'Kiwi Maru (明朝)', value: "'Kiwi Maru', serif" },
    { name: 'しっぽり明朝', value: "'Shippori Mincho', serif" },
    { name: 'Yuji Syuku (明朝)', value: "'Yuji Syuku', serif" },
    { name: 'さわらび明朝', value: "'Sawarabi Mincho', serif" },
    { name: 'Merriweather (明朝)', value: "'Merriweather', serif" },
];


export const SettingsTab: React.FC<SettingsTabProps> = ({ uiConfig, onSaveUiConfig }) => {
    const [config, setConfig] = useState<UiConfig>(uiConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        setConfig(uiConfig);
    }, [uiConfig]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleNavChange = (key: keyof UiConfig['navButtons'], field: keyof NavButtonConfig, value: string | boolean) => {
        setConfig(prev => ({
            ...prev,
            navButtons: {
                ...prev.navButtons,
                [key]: {
                    ...prev.navButtons[key],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        const success = await onSaveUiConfig(config);
        setSaveStatus(success ? 'success' : 'error');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const applyColorPreset = (preset: typeof colorPresets[0]) => {
        setConfig(prev => ({
            ...prev,
            primaryColor: preset.primaryColor,
            backgroundColor: preset.backgroundColor,
            darkBackgroundColor: preset.darkBackgroundColor
        }));
    };
    
    const navButtonKeys: (keyof UiConfig['navButtons'])[] = ['search', 'printGakufu', 'list', 'ranking', 'news', 'requests', 'suggest', 'setlist'];

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">テーマプリセット</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                {colorPresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => applyColorPreset(preset)}
                        className="rounded-lg border-2 border-transparent hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition p-2 text-left bg-gray-100 dark:bg-gray-800 shadow-sm"
                    >
                        <div className="flex">
                            <div className="w-1/3 h-16 rounded-l-md" style={{ backgroundColor: preset.darkBackgroundColor }}></div>
                            <div className="w-2/3 h-16 rounded-r-md" style={{ backgroundColor: preset.backgroundColor }}></div>
                        </div>
                         <div className="w-full h-4 mt-2 rounded-md" style={{ backgroundColor: preset.primaryColor }}></div>
                        <p className="text-sm font-semibold mt-2 text-center text-gray-700 dark:text-gray-300">{preset.name}</p>
                    </button>
                ))}
            </div>

            <h3 className="text-lg font-semibold mb-4">基本設定</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">メインタイトル</label>
                    <input type="text" name="mainTitle" value={config.mainTitle} onChange={handleInputChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">サブタイトル</label>
                    <input type="text" name="subtitle" value={config.subtitle} onChange={handleInputChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ツイキャスURL</label>
                    <input type="text" name="twitcastingUrl" value={config.twitcastingUrl || ''} onChange={handleInputChange} placeholder="https://twitcasting.tv/..." className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ツイキャスアイコンURL</label>
                    <input type="text" name="twitcastingIconUrl" value={config.twitcastingIconUrl || ''} onChange={handleInputChange} placeholder="https://example.com/icon.png" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">X (Twitter) URL</label>
                    <input type="text" name="xUrl" value={config.xUrl || ''} onChange={handleInputChange} placeholder="https://x.com/..." className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">X (Twitter) アイコンURL</label>
                    <input type="text" name="xIconUrl" value={config.xIconUrl || ''} onChange={handleInputChange} placeholder="https://example.com/icon.png" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">テーマカラー</label>
                    <input type="color" name="primaryColor" value={config.primaryColor} onChange={handleInputChange} className="mt-1 h-10 w-full block bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-1" />
                </div>
            </div>
            
             <h3 className="text-lg font-semibold mb-4 mt-8">フォント設定</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Heading Font Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">見出しフォント</label>
                        <select name="headingFontFamily" value={config.headingFontFamily} onChange={handleSelectChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]">
                            {headingFontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                        </select>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">見出しの大きさ: {Math.round((config.headingFontScale || 1) * 100)}%</label>
                        <input type="range" name="headingFontScale" min="0.8" max="1.5" step="0.05" value={config.headingFontScale || 1} onChange={handleRangeChange} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    {/* Body Font Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">本文フォント</label>
                        <select name="bodyFontFamily" value={config.bodyFontFamily} onChange={handleSelectChange} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]">
                            {bodyFontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                        </select>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">本文の大きさ: {Math.round((config.bodyFontScale || 1) * 100)}%</label>
                        <input type="range" name="bodyFontScale" min="0.8" max="1.5" step="0.05" value={config.bodyFontScale || 1} onChange={handleRangeChange} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-8">背景設定</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-4">
                 <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="backgroundType" value="color" checked={config.backgroundType === 'color'} onChange={handleInputChange} className="form-radio h-4 w-4 text-cyan-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-cyan-500" />
                        単色
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="backgroundType" value="image" checked={config.backgroundType === 'image'} onChange={handleInputChange} className="form-radio h-4 w-4 text-cyan-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-cyan-500" />
                        画像
                    </label>
                </div>
                {config.backgroundType === 'color' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">背景色 (ライトテーマ)</label>
                            <input type="color" name="backgroundColor" value={config.backgroundColor} onChange={handleInputChange} className="mt-1 h-10 w-full block bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-1" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">背景色 (ダークテーマ)</label>
                            <input type="color" name="darkBackgroundColor" value={config.darkBackgroundColor || '#111827'} onChange={handleInputChange} className="mt-1 h-10 w-full block bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-1" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">プリセットから選択</label>
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {backgroundPresets.map(preset => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => setConfig(prev => ({ ...prev, backgroundImageUrl: preset.url }))}
                                        className={`relative rounded-lg overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${config.backgroundImageUrl === preset.url ? 'border-cyan-500' : 'border-transparent hover:border-gray-500'}`}
                                    >
                                        <img src={preset.url} alt={preset.name} className="h-20 w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 flex items-end justify-center p-1">
                                            <p className="text-white text-xs font-semibold text-center leading-tight">{preset.name}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">または、カスタム画像URL</label>
                             <input type="text" name="backgroundImageUrl" value={config.backgroundImageUrl} onChange={handleInputChange} placeholder="https://example.com/background.png" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2"/>
                            {config.backgroundImageUrl && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">プレビュー:</p>
                                    <img src={config.backgroundImageUrl} alt="Preview" className="max-h-32 rounded-md border-2 border-gray-300 dark:border-gray-600" onError={(e) => e.currentTarget.style.display = 'none'} onLoad={(e) => e.currentTarget.style.display = 'block'}/>
                                </div>
                            )}
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">画像の不透明度: {Math.round(config.backgroundOpacity * 100)}%</label>
                             <input type="range" name="backgroundOpacity" min="0" max="1" step="0.01" value={config.backgroundOpacity} onChange={handleRangeChange} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-8">投げ銭・サポート設定</h3>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OFUSE URL</label>
                    <input type="text" name="ofuseUrl" value={config.ofuseUrl || ''} onChange={handleInputChange} placeholder="https://ofuse.me/..." className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Doneru URL</label>
                    <input type="text" name="doneruUrl" value={config.doneruUrl || ''} onChange={handleInputChange} placeholder="https://doneru.jp/..." className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amazon ほしい物リスト URL</label>
                    <input type="text" name="amazonWishlistUrl" value={config.amazonWishlistUrl || ''} onChange={handleInputChange} placeholder="https://www.amazon.jp/hz/wishlist/..." className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">サポートボタン アイコンURL</label>
                    <input type="text" name="supportIconUrl" value={config.supportIconUrl || ''} onChange={handleInputChange} placeholder="https://example.com/icon.png" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-8">ナビゲーションボタン設定</h3>
            <div className="space-y-3">
                {navButtonKeys.map(key => config.navButtons[key] && (
                    <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-md flex items-center gap-4">
                        <input type="checkbox" checked={config.navButtons[key].enabled} onChange={(e) => handleNavChange(key, 'enabled', e.target.checked)} className="form-checkbox h-5 w-5 text-cyan-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-cyan-500" />
                        <div className="flex-grow">
                             <input type="text" value={config.navButtons[key].label} onChange={(e) => handleNavChange(key, 'label', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                 {saveStatus === 'success' && <p className="text-green-500 dark:text-green-400">保存しました！</p>}
                {saveStatus === 'error' && <p className="text-red-500 dark:text-red-400">保存に失敗しました。</p>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving && <LoadingSpinner className="w-5 h-5" />}
                    {isSaving ? '保存中...' : '設定を保存'}
                </button>
            </div>
        </div>
    );
};