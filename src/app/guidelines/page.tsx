import React from 'react';
import LegalLayout from '@/components/ui/LegalLayout';

export default function CommunityGuidelines() {
    return (
        <LegalLayout
            title="Community Guidelines"
            lastUpdated="March 14, 2026"
            icon="users"
        >
            <p className="lead text-xl text-slate-700 font-medium">
                WHOBEE is built on the idea that strangers can connect in positive, meaningful, and fun ways. To keep the community safe and enjoyable for everyone, we enforce a strict set of rules.
            </p>

            <h2>1. Core Principles</h2>
            <ul>
                <li><strong>Respect:</strong> Treat every person you connect with dignity and respect. Remember there is a real human on the other side of the screen.</li>
                <li><strong>Consent:</strong> Never share someone's personal information, screenshots, or stream without their explicit consent.</li>
                <li><strong>Safety First:</strong> We prioritize safety above all else. Violations of our safety guidelines result in immediate, permanent bans.</li>
            </ul>

            <h2>2. Zero Tolerance Policy</h2>
            <p>
                We have a <strong>zero-tolerance approach</strong> to the following behaviors. Engaging in any of these will result in an immediate and permanent IP ban from the WHOBEE network:
            </p>
            <ul>
                <li><strong>Harassment and Bullying:</strong> Abusive language, targeted attacks, or continued harassment after someone has indicated they are uncomfortable.</li>
                <li><strong>Hate Speech:</strong> Slurs, discrimination, or hate speech directed at race, Religion, ethnicity, sexual orientation, gender identity, or disability.</li>
                <li><strong>Sexual Content and Nudity:</strong> Broadcasting sexually explicit content, nudity, or soliciting sexual acts. WHOBEE is not a platform for adult content.</li>
                <li><strong>Illegal Acts:</strong> Broadcasting, discussing, or encouraging illegal activities of any kind.</li>
                <li><strong>Minors:</strong> You MUST be 18 or older to use WHOBEE. Any presence of minors, or soliciting information from individuals who appear to be minors, is strictly prohibited and reported to authorities.</li>
            </ul>

            <h2>3. How to Protect Yourself</h2>
            <p>
                Because WHOBEE is completely anonymous and matches you with real strangers globally, it's important to protect yourself:
            </p>
            <ul>
                <li><strong>Never share personal information:</strong> Do not share your real name, address, phone number, social media handles, or financial information.</li>
                <li><strong>Use the Skip Button:</strong> If someone makes you uncomfortable, do not engage. Simply click "Skip" or "End" to instantly sever the connection.</li>
                <li><strong>Report Violators:</strong> Use the Report Flag icon next to the chat controls. This alerts our moderation systems and helps ban malicious users, keeping the community safe for everyone.</li>
            </ul>

            <h2>4. Moderation and Enforcement</h2>
            <p>
                We use a combination of automated behavioral analysis and community reporting to enforce these guidelines. While we cannot monitor P2P video streams directly due to WebRTC architecture, our systems act rapidly on community reports and rate-limiting patterns to enforce bans.
            </p>
        </LegalLayout>
    );
}
