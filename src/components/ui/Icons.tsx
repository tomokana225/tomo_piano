import React from 'react';

interface IconProps {
  children: React.ReactNode;
  className?: string;
}
const Icon: React.FC<IconProps> = ({ children, className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{children}</svg>;

export interface SimpleIconProps {
  className?: string;
}
export const SearchIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>;
export const XIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>;
export const PlusIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Icon>;
export const ExternalLinkIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></Icon>;
export const ListBulletIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></Icon>;
export const GiftIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></Icon>;
export const HeartIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></Icon>;
export const HeartIconSolid: React.FC<SimpleIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
export const VideoCameraIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></Icon>;
export const YouTubeIcon: React.FC<SimpleIconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.484 3.409 0 4.933 0 12c0 7.066.484 8.591 4.385 8.816 3.6.245 11.626.246 15.23 0C23.516 20.591 24 19.067 24 12c0-7.067-.484-8.591-4.385-8.816zM9.75 15.562V8.438L15.025 12 9.75 15.562z" />
    </svg>
);
export const DocumentTextIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>;
export const TrendingUpIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></Icon>;
export const CloudUploadIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9" /></Icon>;
export const CheckCircleIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const NewspaperIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6M7 8h6" /></Icon>;
export const ChevronLeftIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></Icon>;
export const ChevronRightIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></Icon>;
export const QueueListIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></Icon>;