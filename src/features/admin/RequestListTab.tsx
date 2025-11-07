
import React from 'react';
import { RequestRankingItem } from '../../types';

interface RequestListTabProps {
    requests: RequestRankingItem[];
}

export const RequestListTab: React.FC<RequestListTabProps> = ({ requests }) => {

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">最近のリクエスト一覧 (最新20件)</h3>
            {requests && requests.length > 0 ? (
                <div className="space-y-3">
                    {requests.map(request => (
                        <div key={`${request.id}-${request.lastRequestedAt}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm grid grid-cols-3 gap-4 items-center">
                            <div className="col-span-1">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{request.id}</p>
                                {request.artist && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{request.artist}</p>}
                            </div>
                            <div className="col-span-1">
                                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 truncate">{request.lastRequester}</p>
                            </div>
                            <div className="col-span-1 text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(request.lastRequestedAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">リクエストはありません。</p>
                </div>
            )}
        </div>
    );
};
