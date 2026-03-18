import Script from 'next/script';

const BASE_URL = 'https://whobee.live';

const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "WHOBEE",
    "url": BASE_URL,
    "description": "Free anonymous video, voice, and text chat. Meet strangers online instantly.",
    "potentialAction": {
        "@type": "SearchAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${BASE_URL}/blog?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
    }
};

const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WHOBEE",
    "applicationCategory": "CommunicationApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "description": "WHOBEE is a free anonymous video, voice, and text chat platform. Connect with strangers worldwide using WebRTC peer-to-peer technology with unique blur reveal mechanics.",
    "url": BASE_URL,
    "author": {
        "@type": "Organization",
        "name": "WHOBEE",
        "url": BASE_URL,
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@whobee.live",
            "contactType": "customer support"
        }
    }
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Is WHOBEE anonymous?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. WHOBEE does not require registration, an account, or personal information. All connections are peer-to-peer (WebRTC) and text chats are end-to-end encrypted."
            }
        },
        {
            "@type": "Question",
            "name": "Is WHOBEE free to use?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, WHOBEE is completely free. No subscriptions, no hidden fees. Just click Start Chatting and connect instantly."
            }
        },
        {
            "@type": "Question",
            "name": "How does the blur reveal work on WHOBEE?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Video starts blurred. As the conversation progresses through phases, the blur gradually reduces. Both users can agree to reveal fully at any time."
            }
        },
        {
            "@type": "Question",
            "name": "Is my video stored or recorded?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. WHOBEE uses WebRTC for direct peer-to-peer connections. Your video goes directly to your partner, never passing through our servers. We do not record or store any video or audio."
            }
        },
        {
            "@type": "Question",
            "name": "What is WHOBEE World Tour?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "World Tour is a scheduled matchmaking feature that connects you specifically with users from a targeted world region (Asia, Europe, Americas) on a rotating weekly basis."
            }
        },
        {
            "@type": "Question",
            "name": "Can I use WHOBEE on mobile?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! WHOBEE is fully responsive and works on iOS, Android, and all modern desktop browsers. No app download required."
            }
        }
    ]
};

export default function JsonLd() {
    return (
        <>
            <Script
                id="schema-website"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <Script
                id="schema-software"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
            />
            <Script
                id="schema-faq"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
}
