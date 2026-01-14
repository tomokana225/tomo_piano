import { Song } from '../types';

const extractKana = (text: string): { main: string; kana?: string } => {
    const match = text.match(/(.+?)\s*[(（](.+?)[)）]/);
    if (match) {
        return {
            main: match[1].trim(),
            kana: match[2].trim()
        };
    }
    return { main: text.trim() };
};

// キーワード判定用のヘルパー
const isNewKeyword = (s: string) => ['new', 'NEW', 'New', '新曲', '★', 'new!'].includes(s);
const isPracticingKeyword = (s: string) => ['練習中', '練習', 'practicing', 'Practicing', '勉強中'].includes(s);
const isSeasonKeyword = (s: string) => ['春', '夏', '秋', '冬'].includes(s);

export const parseSongs = (str: string): Song[] => {
    if (!str) return [];
    
    return str.replace(/\r\n/g, '\n').split('\n').map((line): Song | null => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        
        // タブが含まれている場合はタブで分割、そうでなければコンマで分割
        const separator = trimmedLine.includes('\t') ? '\t' : ',';
        const parts = trimmedLine.split(separator).map(p => p.trim());
        
        // 指定順序: アーティスト(0), 曲名(1), ジャンル(2), 練習中(3), New(4), 季節(5)
        // 最低限「アーティスト名」と「曲名」が必要
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        
        const artistParts = extractKana(parts[0]);
        const titleParts = extractKana(parts[1]);

        let genre = parts[2] || '';
        let status: 'playable' | 'practicing' = 'playable';
        let isNew = false;
        let season = '';

        // 3列目(インデックス3)以降を解析
        // 練習中フラグ
        if (parts[3] && isPracticingKeyword(parts[3])) {
            status = 'practicing';
        }
        // Newフラグ
        if (parts[4] && isNewKeyword(parts[4])) {
            isNew = true;
        }
        // 季節
        if (parts[5] && isSeasonKeyword(parts[5])) {
            season = parts[5];
        }

        // キーワードベースでの補完（列がずれている場合のため）
        parts.slice(3).forEach(part => {
            if (!part) return;
            if (isNewKeyword(part)) isNew = true;
            if (isPracticingKeyword(part)) status = 'practicing';
            if (isSeasonKeyword(part)) season = part;
        });

        return {
            title: titleParts.main,
            artist: artistParts.main,
            titleKana: titleParts.kana,
            artistKana: artistParts.kana,
            genre: genre,
            isNew: isNew,
            status: status,
            season: season || undefined
        };
    }).filter((song): song is Song => song !== null);
};

export const songsToString = (songs: Song[]): string => {
    return songs.map(song => {
        const artistWithKana = song.artistKana ? `${song.artist} (${song.artistKana})` : song.artist;
        const titleWithKana = song.titleKana ? `${song.title} (${song.titleKana})` : song.title;
        
        // 順序: アーティスト, 曲名, ジャンル, 練習中, New, 季節
        const parts = [
            artistWithKana,
            titleWithKana,
            song.genre || '',
            song.status === 'practicing' ? '練習中' : '',
            song.isNew ? 'new' : '',
            song.season || ''
        ];
        
        // 末尾の空要素を削除
        while (parts.length > 2 && !parts[parts.length - 1]) {
            parts.pop();
        }
        
        return parts.join(',');
    }).join('\n');
};