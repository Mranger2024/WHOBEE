import React from 'react';
import LegalLayout from '@/components/ui/LegalLayout';

export default function TermsOfService() {
    return (
        <LegalLayout
            title="Terms of Service"
            lastUpdated="March 14, 2026"
            icon="file-text"
        >
            <p>
                Welcome to WHOBEE. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not use our service.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                WHOBEE provides an anonymous video, voice, and text chat platform. By clicking "Start Chatting," you acknowledge that you have read, understood, and agree to these Terms.
            </p>

            <h2>2. Age Requirement</h2>
            <p>
                <strong>You must be at least 18 years old</strong> (or the legal age of majority in your jurisdiction) to use WHOBEE. By using the service, you represent and warrant that you meet this age requirement. If you are under 18, you are strictly prohibited from using WHOBEE.
            </p>

            <h2>3. User Conduct and Acceptable Use</h2>
            <p>
                We strive to maintain a safe and welcoming environment. While using WHOBEE, you agree <strong>NOT</strong> to:
            </p>
            <ul>
                <li>Share, broadcast, or transmit any content that is illegal, non-consensual, or violates the rights of others.</li>
                <li>Engage in harassment, bullying, hate speech, or threatening behavior toward any other user.</li>
                <li>Broadcast nudity, sexually explicit content, or graphic violence.</li>
                <li>Use automated scripts, bots, or scrapers to access the service or manipulate the matchmaking system.</li>
                <li>Attempt to reverse engineer, decompile, or bypass the end-to-end encryption or WebRTC signaling protocols.</li>
            </ul>

            <h2>4. Reporting and Bans</h2>
            <p>
                WHOBEE relies on a community-driven reporting system combined with automated abuse detection.
            </p>
            <ul>
                <li>If you encounter a user violating these terms, use the integrated <strong>Report</strong> button immediately.</li>
                <li>We reserve the right to instantly and permanently ban any IP address or user found violating these terms, without prior notice.</li>
            </ul>

            <h2>5. Disclaimer of Warranties</h2>
            <p>
                WHOBEE is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, completely secure, or error-free. Because connections are P2P, we cannot control or monitor the exact content transmitted by other users. You use the service entirely at your own risk.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
                To the fullest extent permitted by law, WHOBEE and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.
            </p>

            <h2>7. Changes to Terms</h2>
            <p>
                We may modify these Terms at any time. We will indicate the date of the latest revision at the top of this page. Your continued use of the service constitutes your acceptance of the revised Terms.
            </p>

            <h2>8. Contact</h2>
            <p>
                If you have questions about these Terms, please contact us via our <a href="/contact">Contact Page</a>.
            </p>
        </LegalLayout>
    );
}
