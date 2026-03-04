import { getTourStatus, formatLocalTime } from './src/lib/world-tour.js'; // Assumes tsx

const status = getTourStatus();
console.log("Tour Status Check:");
console.log("Is Open:", status.isOpen);
if (status.currentEvent) {
    console.log("Current Event:", status.currentEvent.name);
}

console.log("\nNext Event:", status.nextEvent.name);
console.log("Next Open Date (UTC):", status.nextOpenDate.toISOString());
console.log("Next Open Date (Local):", formatLocalTime(status.nextOpenDate));
console.log("Seconds Until Open:", status.secondsUntilNext);
