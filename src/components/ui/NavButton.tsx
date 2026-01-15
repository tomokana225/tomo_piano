import React from 'react';

interface NavButtonProps {
    onClick: () => void;
    href?: string;
    isActive?: boolean;
    IconComponent: React.FC<{ className?: string }>;
    label: string;
    className?: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ onClick, href, isActive, IconComponent, label, className }) => {
    const baseClasses = "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-background-light dark:focus:ring-offset-card-background-dark";
    
    const activeClasses = isActive 
        ? "text-[var(--text-on-primary)] shadow-md" 
        : "text-text-primary-light dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/10 hover:translate-x-1";
    
    const content = (
        <>
            <IconComponent className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
            <span className="truncate">{label}</span>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClasses} ${activeClasses} ${className}`}
                style={{borderColor: 'var(--primary-color)'}}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${activeClasses} ${className}`}
            style={{backgroundColor: isActive ? 'var(--primary-color)' : ''}}
        >
            {content}
        </button>
    );
};