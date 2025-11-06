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
    const baseClasses = "flex items-center justify-center lg:flex-col w-full px-3 py-2 lg:py-3 lg:px-1 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 font-semibold text-xs sm:text-sm whitespace-nowrap";
    
    const activeClasses = isActive 
        ? "bg-cyan-500 text-white ring-cyan-400" 
        : "bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 ring-gray-600 shadow-sm dark:shadow-md";

    const content = (
        <>
            <IconComponent className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-0 lg:mb-1" />
            <span>{label}</span>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClasses} ${activeClasses} ${className}`}
                // External links are never "active" in the context of app navigation, so no primary color style
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