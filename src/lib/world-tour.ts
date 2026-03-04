import { isWithinInterval, addDays, startOfDay, addHours, differenceInSeconds } from 'date-fns';

export type WorldTourRegion = {
    id: string;
    name: string;
    description: string;
    anchorTimezone: string;
    utcStartHour: number; // 0-23 UTC hour when the event starts
    durationHours: number; // How long the event lasts
    dayIndex: number; // 0 = Sunday, 1 = Monday, etc. (relative to UTC week)
    centerCoords: [number, number]; // [lat, lng] for the 3D globe focus
};

/**
 * The 5-Day Rotating Schedule
 * Each region gets a 2-hour "Prime Time" block.
 */
export const WORLD_TOUR_SCHEDULE: WorldTourRegion[] = [
    {
        id: 'na',
        name: 'North America Night',
        description: 'Connecting you to the Western Hemisphere.',
        anchorTimezone: 'America/New_York', // Target: 9pm - 11pm EST
        utcStartHour: 1, // 1:00 AM UTC (Next day) = 9:00 PM EST (Previous day)
        durationHours: 2,
        dayIndex: 1, // Monday UTC (Sunday EST night)
        centerCoords: [39.0, -95.0] // Center of US
    },
    {
        id: 'sa',
        name: 'South America Night',
        description: 'Experience the electric energy of Latin America.',
        anchorTimezone: 'America/Sao_Paulo', // Target: 9pm - 11pm BRT
        utcStartHour: 0, // 0:00 AM UTC (Next day) = 9:00 PM BRT (Previous day)
        durationHours: 2,
        dayIndex: 2, // Tuesday UTC (Monday BRT night)
        centerCoords: [-14.2, -51.9] // Brazil
    },
    {
        id: 'eu_af',
        name: 'Euro-Africa Night',
        description: 'A massive collision of two continents.',
        anchorTimezone: 'Europe/Paris', // Target: 9pm - 11pm CET
        utcStartHour: 20, // 20:00 UTC = 21:00 CET
        durationHours: 2,
        dayIndex: 3, // Wednesday UTC
        centerCoords: [20.0, 15.0] // Midpoint Europe/Africa
    },
    {
        id: 'asia_west',
        name: 'West Asia Night',
        description: 'Connecting the Middle East and the Indian Subcontinent.',
        anchorTimezone: 'Asia/Kolkata', // Target: 9pm - 11pm IST
        utcStartHour: 15, // 15:30 UTC = 21:00 IST (We'll use 15:00 UTC for simplicity: 8:30pm-10:30pm IST)
        durationHours: 2,
        dayIndex: 4, // Thursday UTC
        centerCoords: [25.0, 60.0] // Middle East / India
    },
    {
        id: 'asia_east',
        name: 'East Asia & Oceania',
        description: 'From Tokyo neon to Australian shores.',
        anchorTimezone: 'Asia/Tokyo', // Target: 9pm - 11pm JST
        utcStartHour: 12, // 12:00 UTC = 21:00 JST
        durationHours: 2,
        dayIndex: 5, // Friday UTC
        centerCoords: [20.0, 130.0] // East Asia / Australia
    },
    // Weekend Free-For-All
    {
        id: 'global',
        name: 'Global Free-For-All',
        description: 'Borders are open. The entire world is online.',
        anchorTimezone: 'UTC',
        utcStartHour: 0,
        durationHours: 48, // 48-hour weekend event
        dayIndex: 6, // Saturday UTC (runs through Sunday)
        centerCoords: [0, 0] // Equator
    }
];

export type WindowStatus = {
    isOpen: boolean;
    currentEvent: WorldTourRegion | null;
    nextEvent: WorldTourRegion;
    nextOpenDate: Date;
    secondsUntilNext: number;
};

/**
 * Core Timezone Engine
 * Calculates whether the queue is currently open, and if not, exactly when it opens next.
 */
export function getTourStatus(): WindowStatus {
    const now = new Date(); // Current local time (browser)
    const currentDayOfWeek = now.getUTCDay(); // 0-6

    let currentEvent: WorldTourRegion | null = null;
    let nextEvent: WorldTourRegion | null = null;
    let nextOpenDate: Date | null = null;

    // 1. Check if we are CURRENTLY inside an active window
    for (const region of WORLD_TOUR_SCHEDULE) {
        // Calculate the absolute start and end date objects for this region *this week*
        // startOfDay(now) creates a Date at 00:00:00 local time. We need to normalize to UTC.

        // Let's create a UTC Date for the target day of the week
        const daysToAdd = region.dayIndex - currentDayOfWeek;
        const targetDate = addDays(now, daysToAdd);

        // Set the hour based on UTC start hour
        const eventStart = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            region.utcStartHour, 0, 0, 0
        ));

        const eventEnd = addHours(eventStart, region.durationHours);

        // If 'now' is within this window, we are LIVE
        if (isWithinInterval(now, { start: eventStart, end: eventEnd })) {
            currentEvent = region;
            // The next event is exactly 1 week from now, or the next day.
            // For simplicity in the UI, if we are open, we just need currentEvent.
            // But we'll calculate nextEvent below anyway.
            break;
        }
    }

    // 2. Find the NEXT upcoming window
    // We iterate through the next 7 days to find the earliest window that hasn't started yet
    let minDiffSeconds = Infinity;

    for (let offsetIndex = 0; offsetIndex <= 7; offsetIndex++) {
        const checkDayIndex = (currentDayOfWeek + offsetIndex) % 7;

        const possibleRegions = WORLD_TOUR_SCHEDULE.filter(r => r.dayIndex === checkDayIndex);

        for (const region of possibleRegions) {
            const targetDate = addDays(now, offsetIndex);

            const eventStart = new Date(Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                region.utcStartHour, 0, 0, 0
            ));

            // If this event starts in the future, check if it's the *soonest* future event
            if (eventStart > now) {
                const diff = differenceInSeconds(eventStart, now);
                if (diff < minDiffSeconds) {
                    minDiffSeconds = diff;
                    nextEvent = region;
                    nextOpenDate = eventStart;
                }
            }
        }
    }

    // Fallback safety (should mathematically never hit unless schedule array is empty)
    if (!nextEvent || !nextOpenDate) {
        nextEvent = WORLD_TOUR_SCHEDULE[0];
        nextOpenDate = addDays(now, 1);
        minDiffSeconds = differenceInSeconds(nextOpenDate, now);
    }

    return {
        isOpen: currentEvent !== null,
        currentEvent,
        nextEvent,
        nextOpenDate,
        secondsUntilNext: minDiffSeconds
    };
}

/**
 * Helper to format the localized timestamp for the UI HUD
 * Example: "2:00 AM Your Time"
 */
export function formatLocalTime(date: Date): string {
    return new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
    }).format(date);
}
