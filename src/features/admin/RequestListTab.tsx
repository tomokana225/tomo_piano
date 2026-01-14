
import React from 'react';
import { RequestRankingItem } from '../../types';

interface RequestListTabProps {
    requests: RequestRankingItem[];
}

export const RequestListTab: React.FC<RequestListTabProps> = ({ requests }) => {

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        const d = new Date(timestamp);
        return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) + ' ' + 
               d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold px-1">最新のリクエスト (20件)</h3>
            
            {requests && requests.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {requests.map((request, idx) => (
                        <div key={`${request.id}-${idx}`} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 space-y-1">
                                <p className="font-bold text-lg leading-tight truncate">{request.id}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {request.artist && <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">{request.artist}</span>}
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-bold">リクエスト回数: {request.count}</span>
                                </div>
                            </div>
                            
                            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border-light dark:border-border-dark">
                                <div className="text-left sm:text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Requester</p>
                                    <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{request.lastRequester || '匿名ユーザー'}</p>
                                </div>
                                <div className="text-right mt-1 sm:mt-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
                                    <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{formatDate(request.lastRequestedAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">まだリクエストはありません。</p>
                </div>
            )}
        </div>
    );
};
