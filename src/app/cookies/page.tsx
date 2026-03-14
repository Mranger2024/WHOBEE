import React from 'react';
import LegalLayout from '@/components/ui/LegalLayout';

export default function CookiePolicy() {
    return (
        <LegalLayout
            title="Cookie Policy"
            lastUpdated="March 14, 2026"
            icon="cookie"
        >
            <p>
                At WHOBEE, we believe in minimal tracking. This Cookie Policy explains how and why we use cookies and similar local storage technologies on our platform.
            </p>

            <h2>1. What Are Cookies?</h2>
            <p>
                Cookies are small text files stored on your device by your browser. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. We also use the `localStorage` API, which functions similarly but stores data strictly on your device without sending it to our servers.
            </p>

            <h2>2. How We Use Local Storage</h2>
            <p>
                <strong>We do not use tracking cookies for advertising or selling your data to third parties.</strong>
            </p>
            <p>
                We use your browser's local storage exclusively to improve your functional experience. Specifically, we store:
            </p>
            <ul>
                <li><strong>Hardware Preferences:</strong> Your selected microphone and camera device IDs so you don't have to re-select them every time you visit.</li>
                <li><strong>Matchmaking Preferences:</strong> Your preferred region, gender filters, and selected interests to streamline your matching queue experience.</li>
                <li><strong>UI State:</strong> Dismissed banners, theme preferences, and tutorial completion states.</li>
            </ul>

            <h2>3. Third-Party Analytics</h2>
            <p>
                We utilize PostHog, an open-source analytics platform, to understand how our application is performing (e.g., connection success rates, average matchmaking times, and UI interactions). 
            </p>
            <ul>
                <li>PostHog may set cookies to distinguish unique (but completely anonymous) sessions.</li>
                <li>This data contains no personally identifiable information (PII) and is used strictly to debug WebRTC failures and improve platform stability.</li>
            </ul>

            <h2>4. Managing Your Preferences</h2>
            <p>
                You have full control over your cookies. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you disable local storage, you will need to re-enter your matchmaking preferences and re-select your camera/microphone devices each time you visit WHOBEE.
            </p>
            <p>
                For more information on how to manage cookies, please visit the help pages of your respective web browser.
            </p>
        </LegalLayout>
    );
}
