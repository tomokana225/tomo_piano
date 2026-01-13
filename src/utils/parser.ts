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

export const parseSongs = (str: string): Song[] => {
    if (!str) return [];
    
    return str.replace(/\r\n/g, '\n').split('\n').map((line): Song | null => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        
        // タブが含まれている場合はタブで分割、そうでなければコンマで分割
        const separator = trimmedLine.includes('\t') ? '\t' : ',';
        const parts = trimmedLine.split(separator);
        
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        
        const titleParts = extractKana(parts[0]);
        const artistParts = extractKana(parts[1]);

        const status: 'playable' | 'practicing' = parts[4]?.trim()?.toLowerCase() === '練習中' ? 'practicing' : 'playable';

        return {
            title: titleParts.main,
            artist: artistParts.main,
            titleKana: titleParts.kana,
            artistKana: artistParts.kana,
            genre: parts[2]?.trim() || '',
            isNew: parts[3]?.trim()?.toLowerCase() === 'new',
            status: status,
        };
    }).filter((song): song is Song => song !== null);
};

export const songsToString = (songs: Song[]): string => {
    return songs.map(song => {
        const titleWithKana = song.titleKana ? `${song.title} (${song.titleKana})` : song.title;
        const artistWithKana = song.artistKana ? `${song.artist} (${song.artistKana})` : song.artist;
        const parts = [titleWithKana, artistWithKana, song.genre || ''];
        
        let fourthPart = '';
        if (song.isNew) {
            fourthPart = 'new';
        }
        
        let fifthPart = '';
        if (song.status === 'practicing') {
            fifthPart = '練習中';
        }

        parts.push(fourthPart);
        parts.push(fifthPart);
        
        while (parts.length > 2 && !parts[parts.length - 1]) {
            parts.pop();
        }
        
        return parts.join(',');
    }).join('\n');
};