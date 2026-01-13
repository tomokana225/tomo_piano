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

export const parseSongs = (str: string): Song[] => {
    if (!str) return [];
    
    return str.replace(/\r\n/g, '\n').split('\n').map((line): Song | null => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        
        // タブが含まれている場合はタブで分割、そうでなければコンマで分割
        const separator = trimmedLine.includes('\t') ? '\t' : ',';
        const parts = trimmedLine.split(separator).map(p => p.trim());
        
        // 最低限「曲名」と「アーティスト名」が必要
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        
        const titleParts = extractKana(parts[0]);
        const artistParts = extractKana(parts[1]);

        let genre = '';
        let isNew = false;
        let status: 'playable' | 'practicing' = 'playable';

        // 3列目以降を柔軟に解析（キーワードベースで判別）
        const extraParts = parts.slice(2);
        extraParts.forEach(part => {
            if (!part) return;

            if (isNewKeyword(part)) {
                isNew = true;
            } else if (isPracticingKeyword(part)) {
                status = 'practicing';
            } else if (!genre) {
                // キーワード以外で、かつ最初に現れた文字列をジャンルとする
                genre = part;
            }
        });

        return {
            title: titleParts.main,
            artist: artistParts.main,
            titleKana: titleParts.kana,
            artistKana: artistParts.kana,
            genre: genre,
            isNew: isNew,
            status: status,
        };
    }).filter((song): song is Song => song !== null);
};

export const songsToString = (songs: Song[]): string => {
    return songs.map(song => {
        const titleWithKana = song.titleKana ? `${song.title} (${song.titleKana})` : song.title;
        const artistWithKana = song.artistKana ? `${song.artist} (${song.artistKana})` : song.artist;
        const parts = [titleWithKana, artistWithKana, song.genre || ''];
        
        let fourthPart = song.isNew ? 'new' : '';
        let fifthPart = song.status === 'practicing' ? '練習中' : '';

        parts.push(fourthPart);
        parts.push(fifthPart);
        
        // 配列の後ろにある空の要素を削除して、スッキリしたCSV/TSVにする
        while (parts.length > 2 && !parts[parts.length - 1]) {
            parts.pop();
        }
        
        return parts.join(',');
    }).join('\n');
};