import React from 'react';
import { SetlistSuggestion } from '../../types';

interface SetlistSuggestionsTabProps {
    suggestions: SetlistSuggestion[];
}

export const SetlistSuggestionsTab: React.FC<SetlistSuggestionsTabProps> = ({ suggestions }) => {

    const formatDate = (timestamp: number) => {
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
            <h3 className="text-lg font-semibold mb-4">受信したセトリ提案</h3>
            {suggestions && suggestions.length > 0 ? (
                <div className="space-y-4">
                    {suggestions.map(suggestion => (
                        <div key={suggestion.id} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <p className="font-semibold text-cyan-400">{suggestion.requester}</p>
                                <p className="text-xs text-gray-400">{formatDate(suggestion.createdAt)}</p>
                            </div>
                            <ol className="list-decimal list-inside space-y-2 bg-gray-900/50 p-3 rounded-md">
                                {suggestion.songs.map((song, index) => (
                                    <li key={index} className="text-gray-300">{song}</li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 bg-gray-800 rounded-md">
                    <p className="text-gray-400">まだセトリの提案はありません。</p>
                </div>
            )}
        </div>
    );
};