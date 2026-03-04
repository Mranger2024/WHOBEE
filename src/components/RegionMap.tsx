import React from 'react';
import mapPaths from './map_paths.json';

export default function RegionMap({ regionId, className = "" }: { regionId: string, className?: string }) {
    // We generated 100x100 maps containing the continent outline.
    const pathString = (mapPaths as any)[regionId] || (mapPaths as any)['global'];

    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* The Globe Backdrop */}
            <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-20" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className="opacity-20 animate-[spin_30s_linear_infinite]" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 6" className="opacity-20 flex origin-center animate-[spin_20s_linear_reverse_infinite]" />

            {/* Radar Lines */}
            <g className="opacity-[0.15]" stroke="currentColor" strokeWidth="0.5">
                <line x1="50" y1="0" x2="50" y2="100" />
                <line x1="0" y1="50" x2="100" y2="50" />
            </g>

            {/* Render the incredibly detailed D3 geographical path */}
            <path
                d={pathString}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="animate-[pulse_3s_ease-in-out_infinite]"
                style={{
                    filter: "drop-shadow(0 0 3px currentColor) drop-shadow(0 0 8px currentColor)",
                    vectorEffect: "non-scaling-stroke"
                }}
            />

            {/* Target Coordinates Highlight (Center of the region) */}
            <circle cx="50" cy="50" r="2.5" fill="currentColor" className="opacity-80 animate-ping origin-center" />
            <circle cx="50" cy="50" r="1.5" fill="currentColor" />

            {/* Corner Bracket Accents (Holographic UI) */}
            <path d="M5,15 L5,5 L15,5" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40" />
            <path d="M95,15 L95,5 L85,5" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40" />
            <path d="M5,85 L5,95 L15,95" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40" />
            <path d="M95,85 L95,95 L85,95" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40" />
        </svg>
    );
}
