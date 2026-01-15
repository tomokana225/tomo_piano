
import React, { useState, useEffect } from 'react';
import { UiConfig, NavButtonConfig } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { CheckCircleIcon, XCircleIcon } from '../../components/ui/Icons';

interface SettingsTabProps {
    uiConfig: UiConfig;
    onSaveUiConfig: (config: UiConfig) => Promise<boolean>;
}

// フルデザインプリセットの定義
const designPresets = [
    {
        name: 'サクラ・ドリーム',
        config: {
            primaryColor: '#ec4899',
            backgroundColor: '#fff1f2',
            darkBackgroundColor: '#4c0519',
            borderRadius: 'large',
            cardStyle: 'elevated',
            shadowIntensity: 0.15,
            headingFontFamily: "'Kiwi Maru', serif",
            backgroundImageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop',
            backgroundType: 'image',
            backgroundOpacity: 0.15
        }
    },
    {
        name: 'ミッドナイト・ジャズ',
        config: {
            primaryColor: '#eab308', // Gold
            backgroundColor: '#f8fafc',
            darkBackgroundColor: '#020617',
            borderRadius: 'none',
            cardStyle: 'flat',
            shadowIntensity: 0.3,
            headingFontFamily: "'Shippori Mincho', serif",
            backgroundImageUrl: 'https://images.unsplash.com/photo-1520527053377-47393ba91f39?q=80&w=2070&auto=format&fit=crop',
            backgroundType: 'image',
            backgroundOpacity: 0.2
        }
    },
    {
        name: 'フォレスト・ヒーリング',
        config: {
            primaryColor: '#16a34a',
            backgroundColor: '#f0fdf4',
            darkBackgroundColor: '#052e16',
            borderRadius: 'medium',
            cardStyle: 'elevated',
            shadowIntensity: 0.1,
            headingFontFamily: "'Yuji Syuku', serif",
            backgroundImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop',
            backgroundType: 'image',
            backgroundOpacity: 0.1
        }
    },
    {
        name: 'サイバー・ミュージック',
        config: {
            primaryColor: '#06b6d4', // Cyan
            backgroundColor: '#0f172a',
            darkBackgroundColor: '#000000',
            borderRadius: 'small',
            cardStyle: 'glass',
            shadowIntensity: 0.5,
            headingFontFamily: "'Zen Kaku Gothic New', sans-serif",
            backgroundImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
            backgroundType: 'image',
            backgroundOpacity: 0.3
        }
    },
    {
        name: 'モダン・ミニマル',
        config: {
            primaryColor: '#475569',
            backgroundColor: '#f8fafc',
            darkBackgroundColor: '#1e293b',
            borderRadius: 'small',
            cardStyle: 'flat',
            shadowIntensity: 0.05,
            headingFontFamily: "'Noto Sans JP', sans-serif",
            backgroundImageUrl: '',
            backgroundType: 'color',
            backgroundOpacity: 0
        }
    }
];

const backgroundPresets = [
  { name: '楽譜', url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop' },
  { name: 'ピアノ', url: 'https://images.unsplash.com/photo-1520444453406-52ab68434346?q=80&w=2070&auto=format&fit=crop' },
  { name: 'ステージ', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop' },
  { name: '森', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop' },
  { name: 'レコード', url: 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?q=80&w=1974&auto=format&fit=crop' },
];

const headingFontOptions = [
    { name: 'Kiwi Maru (明朝)', value: "'Kiwi Maru', serif" },
    { name: 'しっぽり明朝', value: "'Shippori Mincho', serif" },
    { name: 'Yuji Syuku (明朝)', value: "'Yuji Syuku', serif" },
    { name: 'Noto Sans JP (ゴシック)', value: "'Noto Sans JP', sans-serif" },
    { name: 'Zen Kaku Gothic New (ゴシック)', value: "'Zen Kaku Gothic New', sans-serif" },
];

export const SettingsTab: React.FC<SettingsTabProps> = ({ uiConfig, onSaveUiConfig }) => {
    const { sendTestNotification } = useApi();
    const [config, setConfig] = useState<UiConfig>(uiConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    useEffect(() => {
        setConfig(uiConfig);
    }, [uiConfig]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: checked }));
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: Number(value) }));
    };
    
    const applyDesignPreset = (preset: typeof designPresets[0]) => {
        setConfig(prev => ({
            ...prev,
            ...preset.config as any
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        const success = await onSaveUiConfig(config);
        setSaveStatus(success ? 'success' : 'error');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 4000);
    };

    const handleTestNotification = async () => {
        if (!config.discordWebhookUrl) {
            alert('Webhook URLを入力してください。');
            return;
        }
        setTestStatus('sending');
        const success = await sendTestNotification(config.discordWebhookUrl);
        setTestStatus(success ? 'success' : 'error');
        setTimeout(() => setTestStatus('idle'), 4000);
    };

    const handleNavChange = (key: keyof UiConfig['navButtons'], field: keyof NavButtonConfig, value: string | boolean) => {
        setConfig(prev => ({
            ...prev,
            navButtons: { ...prev.navButtons, [key]: { ...prev.navButtons[key], [field]: value } }
        }));
    };

    const handleSpecialNavChange = (key: keyof UiConfig['specialButtons'], field: keyof NavButtonConfig, value: string | boolean) => {
        setConfig(prev => ({
            ...prev,
            specialButtons: { ...prev.specialButtons, [key]: { ...prev.specialButtons[key], [field]: value } }
        }));
    };

    const navButtonKeys: (keyof UiConfig['navButtons'])[] = ['search', 'list', 'ranking', 'news', 'requests', 'suggest', 'setlist', 'printGakufu'];

    return (
        <div className="space-y-10">
            {/* デザインプリセットギャラリー */}
            <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-cyan-500 rounded-full"></span>
                    デザインプリセットを選択
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {designPresets.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => applyDesignPreset(preset)}
                            className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-cyan-500 transition shadow-md bg-white dark:bg-gray-800 p-2"
                        >
                            <div className="h-24 w-full rounded-lg mb-2 flex overflow-hidden border border-gray-100 dark:border-gray-700">
                                <div className="w-1/3 h-full" style={{ backgroundColor: preset.config.darkBackgroundColor }}></div>
                                <div className="w-2/3 h-full" style={{ backgroundColor: preset.config.backgroundColor }}></div>
                            </div>
                            <div className="h-4 w-full rounded-full mb-1" style={{ backgroundColor: preset.config.primaryColor }}></div>
                            <p className="text-xs font-bold text-center text-gray-700 dark:text-gray-300 truncate">{preset.name}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* 基本設定セクション */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    サイト名とタイトルの設定
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">メインタイトル表示内容</label>
                            <input type="text" name="mainTitle" value={config.mainTitle} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">サブタイトル</label>
                            <input type="text" name="subtitle" value={config.subtitle} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 通知設定セクション */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                    通知設定 (スマホ・PCへのリクエスト通知)
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="notificationEnabled"
                            checked={config.notificationEnabled || false}
                            onChange={handleCheckboxChange}
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-bold">リクエスト受信時に通知する</span>
                    </label>
                    <div className="space-y-4 border-l-4 border-purple-100 dark:border-purple-900 pl-4 py-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discord Webhook URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="discordWebhookUrl"
                                    value={config.discordWebhookUrl || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="flex-grow bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                                <button
                                    onClick={handleTestNotification}
                                    disabled={testStatus === 'sending' || !config.discordWebhookUrl}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                                >
                                    {testStatus === 'sending' ? <LoadingSpinner className="w-4 h-4" /> : null}
                                    {testStatus === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : null}
                                    {testStatus === 'error' ? <XCircleIcon className="w-4 h-4" /> : null}
                                    テスト送信
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Discordの「チャンネル設定 &gt; 連携サービス &gt; ウェブフック」からURLを取得できます。<br/>
                                <strong>※メールで受け取りたい場合:</strong> Discordのチャンネル通知設定を「すべて」にし、Discordの設定で「未読通知をメールで受け取る」をオンにすることで擬似的にメール通知が可能です。または、IFTTT等のWebhook連携サービスを利用してください。
                            </p>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知時のメンション用ID (任意)</label>
                             <input
                                type="text"
                                name="discordUserId"
                                value={config.discordUserId || ''}
                                onChange={handleInputChange}
                                placeholder="例: 123456789012345678"
                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-sm"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                自分のDiscordユーザーID（数字）を入力すると、通知時にメンションが付き、より気づきやすくなります。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* スタイル詳細設定 */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                <h3 className="text-lg font-bold mb-6">UIスタイルのカスタマイズ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">角の丸み</label>
                            <div className="grid grid-cols-5 gap-2">
                                {(['none', 'small', 'medium', 'large', 'full'] as const).map(radius => (
                                    <button
                                        key={radius}
                                        onClick={() => setConfig(prev => ({ ...prev, borderRadius: radius }))}
                                        className={`py-2 text-xs font-bold border-2 rounded-md transition ${config.borderRadius === radius ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                                    >
                                        {radius.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">影の強さ: {Math.round((config.shadowIntensity ?? 0.1) * 100)}%</label>
                            <input type="range" name="shadowIntensity" min="0" max="1" step="0.05" value={config.shadowIntensity ?? 0.1} onChange={handleRangeChange} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">テーマカラー</label>
                            <div className="flex gap-4 items-center">
                                <input type="color" name="primaryColor" value={config.primaryColor} onChange={handleInputChange} className="h-10 w-20 block bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-1" />
                                <span className="text-xs font-mono text-gray-500">{config.primaryColor.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 保存ボタン */}
            <div className="sticky bottom-0 bg-background-light dark:bg-background-dark py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-4 z-10">
                 {saveStatus === 'success' && <p className="text-green-500 font-bold animate-fade-in">保存完了！</p>}
                 {saveStatus === 'error' && <p className="text-red-500 font-bold">保存失敗...</p>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-full shadow-lg disabled:opacity-50 flex items-center gap-2 transition-transform transform active:scale-95"
                >
                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                    {isSaving ? '保存中...' : '設定をすべて保存'}
                </button>
            </div>
        </div>
    );
};
