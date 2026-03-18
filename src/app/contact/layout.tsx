import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact & Support',
    description: 'Get in touch with the WHOBEE team. Report issues, submit feedback, or reach out to support@whobee.live for any questions about our anonymous chat platform.',
    alternates: { canonical: 'https://whobee.live/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
