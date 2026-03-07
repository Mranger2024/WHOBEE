"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, MessageSquare, Share2, Lock, ArrowRight,
    Users2, Shield, Globe, Mic, Video,
    CheckCircle2, Star, Menu, X, Sparkles, Heart, ChevronDown, Eye, Zap
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import RegionMap from '@/components/RegionMap';
import { getTourStatus, formatLocalTime, WindowStatus } from '@/lib/world-tour';

export default function Home() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hoveredNav, setHoveredNav] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [tourStatus, setTourStatus] = useState<WindowStatus | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Initialize status and live countdown for world tour preview
        const initialStatus = getTourStatus();
        setTourStatus(initialStatus);

        const intervalId = setInterval(() => {
            const currentStatus = getTourStatus();
            setTourStatus(currentStatus);

            if (currentStatus.isOpen) {
                setTimeLeft(null);
            } else {
                const totalSeconds = currentStatus.secondsUntilNext;
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;

                setTimeLeft({
                    hours: h.toString().padStart(2, '0'),
                    minutes: m.toString().padStart(2, '0'),
                    seconds: s.toString().padStart(2, '0')
                });
            }
        }, 1000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(intervalId);
        };
    }, []);

    const features = [
        {
            icon: <Eye className="w-6 h-6" />,
            title: "Phased Reveal",
            description: "Start blurred, then slowly reveal as trust grows. Our unique blur mechanic makes every connection feel special.",
            color: "from-indigo-500 to-purple-500"
        },
        {
            icon: <Globe className="w-6 h-6" />,
            title: "Global Connections",
            description: "Match instantly with strangers worldwide. Discover new cultures and make friends in a blink.",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: "100% Anonymous",
            description: "No sign-up. No profile. Your identity stays private until you choose to reveal it.",
            color: "from-pink-500 to-rose-500"
        },
        {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "Ice Breakers",
            description: "Never run out of things to say. Built-in conversation starters keep the chat flowing naturally.",
            color: "from-indigo-500 to-blue-500"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Instant Matching",
            description: "Our smart algorithm pairs you with compatible strangers in seconds. No waiting.",
            color: "from-purple-500 to-indigo-500"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Safe & Encrypted",
            description: "P2P WebRTC technology means your stream goes directly to your partner — never through our servers.",
            color: "from-pink-500 to-purple-500"
        }
    ];

    const faqs = [
        { q: "Is WHOBEE free to use?", a: "Yes! Random chat is completely free. No hidden fees, no subscriptions." },
        { q: "Do I need to register?", a: "No registration required. Just click Start Chatting and you're connected instantly." },
        { q: "How does the blur reveal work?", a: "Video starts blurred. As the chat progresses through 3 phases, the blur reduces. Both users can agree to reveal fully at any time." },
        { q: "Is my video secure?", a: "Absolutely. We use P2P WebRTC — your video goes directly to your partner, not our servers." },
        { q: "Can I use it on mobile?", a: "Yes, WHOBEE is fully responsive and works great on iOS and Android browsers." }
    ];

    return (
        <div className="min-h-screen font-sans text-slate-900 bg-white selection:bg-indigo-100 selection:text-indigo-900">

            {/* Decorative background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-300/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* NAV */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-white/80 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white/50 py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center bg-white/40 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] p-2 pr-3">
                        {/* Logo */}
                        <Link href="/" className="px-2">
                            <Logo size="md" animated />
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-1 relative">
                            {/* Hover Pill Background */}
                            <div
                                className="absolute h-10 bg-indigo-50/80 rounded-xl -z-10 transition-all duration-300 ease-out border border-indigo-100/50"
                                style={{
                                    opacity: hoveredNav ? 1 : 0,
                                    width: hoveredNav === 'features' ? '84px' : hoveredNav === 'how' ? '112px' : hoveredNav === 'world-tour' ? '104px' : hoveredNav === 'faq' ? '56px' : '0px',
                                    transform: `translateX(${hoveredNav === 'features' ? '0px' : hoveredNav === 'how' ? '88px' : hoveredNav === 'world-tour' ? '204px' : hoveredNav === 'faq' ? '312px' : '0px'})`
                                }}
                            />

                            <Link
                                href="#features"
                                onMouseEnter={() => setHoveredNav('features')}
                                onMouseLeave={() => setHoveredNav(null)}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors z-10"
                            >
                                Features
                            </Link>
                            <Link
                                href="#how-it-works"
                                onMouseEnter={() => setHoveredNav('how')}
                                onMouseLeave={() => setHoveredNav(null)}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors z-10"
                            >
                                How it Works
                            </Link>
                            <Link
                                href="/world-tour"
                                onMouseEnter={() => setHoveredNav('world-tour')}
                                onMouseLeave={() => setHoveredNav(null)}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors z-10"
                            >
                                World Tour
                            </Link>
                            <Link
                                href="#faq"
                                onMouseEnter={() => setHoveredNav('faq')}
                                onMouseLeave={() => setHoveredNav(null)}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors z-10"
                            >
                                FAQ
                            </Link>

                            <div className="h-6 w-px bg-slate-200/80 mx-2" />

                            <button
                                onClick={() => router.push('/lobby')}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-95 flex items-center gap-2"
                            >
                                <span className="relative z-10">Start Chatting</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 z-0" />
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center pr-2">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-10 h-10 rounded-xl bg-white/50 border border-white/80 shadow-sm flex items-center justify-center text-slate-700 active:scale-90 transition-all"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div className={`md:hidden absolute w-full transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                    <div className="m-4 bg-white/95 backdrop-blur-2xl border border-white max-h-[80vh] overflow-y-auto rounded-3xl p-5 space-y-2 shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                        <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors">Features</Link>
                        <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors">How it Works</Link>
                        <Link href="/world-tour" onClick={() => setIsMenuOpen(false)} className="block text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors">World Tour</Link>
                        <Link href="#faq" onClick={() => setIsMenuOpen(false)} className="block text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors">FAQ</Link>
                        <div className="pt-2">
                            <button onClick={() => router.push('/lobby')} className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-purple-500/20 text-white py-3.5 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                                Start Chatting <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative pt-32 pb-28 lg:pt-36 lg:pb-34 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">

                        {/* Live badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-8 shadow-md shadow-indigo-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Live · 15,234 Users Online Right Now
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                            Meet strangers,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                make real connections.
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                            WHOBEE's unique phased-blur technology lets you connect with your personality first — reveal when you're ready. No sign-up. Instant matching.
                        </p>

                        {/* Single CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                            <button
                                onClick={() => router.push('/lobby')}
                                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                <Video className="h-5 w-5 group-hover:animate-pulse" />
                                Start Chatting Free
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <Link href="#how-it-works" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
                                <span className="underline underline-offset-4">See how it works</span>
                                <ChevronDown className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Trust pillars */}
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-500">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>No sign-up</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>100% Anonymous</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Instant matching</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Free forever</span></div>
                        </div>
                    </div>

                    {/* Mock UI preview card */}
                    <div className="mt-20 max-w-3xl mx-auto">
                        <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-3xl shadow-2xl shadow-purple-500/30">
                            <div className="bg-slate-900 rounded-[22px] p-4 overflow-hidden">
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Remote video (blurred) */}
                                    <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl h-40 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 blur-sm"></div>
                                        <div className="relative z-10 text-white/20 text-5xl font-black select-none backdrop-blur-sm w-full h-full flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                                <Users className="h-8 w-8 text-white/30" />
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">
                                            79% Blurred
                                        </div>
                                        <div className="absolute top-2 left-2 text-white/70 text-[9px] font-bold uppercase tracking-wider">WHOBEE Live</div>
                                    </div>
                                    {/* Local video */}
                                    <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl h-40 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #a855f7, transparent 60%), radial-gradient(circle at 70% 30%, #6366f1, transparent 60%)' }}></div>
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center relative z-10">
                                            <Video className="h-7 w-7 text-white/60" />
                                        </div>
                                        <div className="absolute top-2 left-2 text-white/60 text-[9px] font-bold uppercase tracking-wider">You</div>
                                    </div>
                                </div>
                                {/* Chat bar */}
                                <div className="mt-3 flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2">
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full"></div>
                                    <div className="flex gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center"><Mic className="w-3 h-3 text-indigo-400" /></div>
                                        <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center"><Video className="w-3 h-3 text-purple-400" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-sm text-slate-400 mt-4 font-medium">↑ Actual WHOBEE UI · Blur reduces as you connect</p>
                    </div>
                </div>
            </section>

            {/* STATS BAR */}
            <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { num: '10M+', label: 'Chats Started' },
                            { num: '150+', label: 'Countries' },
                            { num: '99.9%', label: 'Uptime' },
                            { num: '0', label: 'Sign-ups Required' }
                        ].map((s, i) => (
                            <div key={i} className="p-4">
                                <div className="text-4xl font-extrabold text-white mb-1">{s.num}</div>
                                <div className="text-white/70 font-semibold text-sm uppercase tracking-wide">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WORLD TOUR SECTION */}
            <section className="py-24 bg-[#05050a] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/50 to-black pointer-events-none"></div>

                {/* 3D-ish glowing grid background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) scale(2.5) translateY(-50%)', transformOrigin: 'top center' }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-6">
                                <Globe className="w-4 h-4" />
                                <span>The BlurChat World Tour</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-white tracking-tight">
                                Concentrated density.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Guaranteed instant matches.</span>
                            </h2>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
                                We eliminated the "empty waiting room" problem. Instead of being open 24/7, our queue only opens during a focused 2-hour "Prime Time" window that rotates globally.
                            </p>

                            <div className="space-y-3 mb-10 text-sm font-semibold text-slate-300 max-w-lg">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">1</div>
                                        <span>North America Night</span>
                                    </div>
                                    <span className="text-slate-500 uppercase text-xs tracking-wider">Day 1</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">2</div>
                                        <span>South America Night</span>
                                    </div>
                                    <span className="text-slate-500 uppercase text-xs tracking-wider">Day 2</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">3</div>
                                        <span>Euro-Africa Night</span>
                                    </div>
                                    <span className="text-slate-500 uppercase text-xs tracking-wider">Day 3</span>
                                </div>
                                <p className="text-xs text-slate-500 text-center pt-2">... Plus West Asia, East Asia, & Global Weekends</p>
                            </div>

                            <button onClick={() => router.push('/world-tour')} className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold transition-all hover:bg-indigo-50 shadow-lg shadow-white/10">
                                Check Next Flight
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="relative aspect-square md:aspect-auto md:h-full min-h-[400px]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
                            {tourStatus ? (
                                tourStatus.isOpen ? (
                                    <div className="relative w-full h-full border border-purple-500/30 rounded-3xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_50px_rgba(purple,0.3)]">
                                        <RegionMap regionId={tourStatus.currentEvent?.id || 'global'} className="w-24 h-24 text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(purple,0.5)]" />
                                        <h3 className="text-3xl font-black text-white text-center mb-2 tracking-tight uppercase">
                                            {tourStatus.currentEvent?.name || "LIVE NOW"}
                                        </h3>
                                        <p className="text-purple-300 text-sm mb-6 text-center font-bold animate-[pulse_2s_ease-in-out_infinite]">Window is Open. Instant Matches.</p>
                                        <button onClick={() => router.push('/lobby')} className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2">
                                            <Zap className="w-5 h-5 fill-white" /> Enter Matchmaking
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                        <RegionMap regionId={tourStatus.nextEvent.id} className="w-48 h-48 text-indigo-400 mb-6 opacity-80" />
                                        <h3 className="text-2xl font-black text-white text-center mb-2 tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                                            {tourStatus.nextEvent.name}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-6 text-center">
                                            Doors open at <span className="text-white font-bold">{formatLocalTime(tourStatus.nextOpenDate)}</span>
                                        </p>
                                        <div className="text-center font-[family-name:var(--font-orbitron)] text-4xl text-white tracking-[0.1em] bg-black/60 px-8 py-5 rounded-2xl border border-white/10 shadow-inner">
                                            {timeLeft ? `${timeLeft.hours}:${timeLeft.minutes}:${timeLeft.seconds}` : "--:--:--"}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="relative w-full h-full border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden">
                                    <Globe className="w-48 h-48 text-indigo-400 mb-6 opacity-30 animate-[spin_10s_linear_infinite]" />
                                    <h3 className="text-2xl font-black text-white text-center mb-2 tracking-tight uppercase opacity-50">SYNCING...</h3>
                                    <div className="text-center font-[family-name:var(--font-orbitron)] text-4xl text-white/50 tracking-[0.1em] bg-black/60 px-8 py-5 rounded-2xl border border-white/10 shadow-inner mt-8">
                                        --:--:--
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-28 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4">Features</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5">Everything you need to connect</h2>
                        <p className="text-lg text-slate-600">A new way to meet people — built on trust, privacy, and real human connection.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="group bg-slate-50 hover:bg-white p-8 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-block text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-4">Simple Process</div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">How WHOBEE Works</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Set Your Preferences', desc: 'Choose your interests and what you\'re looking for. Our lobby lets you configure before you start.', color: 'from-indigo-500 to-purple-500' },
                            { step: '02', title: 'Get Matched Instantly', desc: 'Allow camera access and get paired in seconds. Video starts blurred — personality first.', color: 'from-purple-500 to-pink-500' },
                            { step: '03', title: 'Connect & Reveal', desc: 'Chat, vibe, and reveal when you both feel ready. Use ice breakers if you need a nudge!', color: 'from-pink-500 to-rose-500' }
                        ].map((s, i) => (
                            <div key={i} className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                                <div className={`text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br ${s.color} opacity-10 absolute top-4 right-6 leading-none select-none`}>{s.step}</div>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center font-bold text-sm mb-5 shadow-md`}>{s.step}</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{s.title}</h3>
                                <p className="text-slate-600 relative z-10 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Mid-page CTA */}
                    <div className="text-center mt-16">
                        <button
                            onClick={() => router.push('/lobby')}
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <Sparkles className="h-5 w-5" />
                            Try it Free — No Sign Up
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* USE CASES */}
            <section className="py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full mb-6">Made For Everyone</div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-10 leading-tight">Perfect for every situation</h2>
                            <div className="space-y-8">
                                {[
                                    { icon: <Heart />, title: 'Social & Dating', desc: 'Meet interesting people without the pressure. The blur creates a unique slow-reveal dynamic.', color: 'bg-pink-100 text-pink-600' },
                                    { icon: <Globe />, title: 'Language Practice', desc: 'Connect with native speakers worldwide to practice and improve your language skills.', color: 'bg-indigo-100 text-indigo-600' },
                                    { icon: <Star />, title: 'Just for Fun', desc: 'Sometimes you just want to have an interesting conversation with a random human. This is for that.', color: 'bg-purple-100 text-purple-600' },
                                ].map((u, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className={`w-12 h-12 rounded-full ${u.color} flex items-center justify-center shrink-0`}>
                                            {u.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-1">{u.title}</h4>
                                            <p className="text-slate-600 leading-relaxed">{u.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Testimonial-style card */}
                        <div className="relative">
                            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-3xl shadow-2xl shadow-purple-500/20 rotate-1">
                                <div className="bg-white rounded-[22px] p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Anonymous User</div>
                                            <div className="text-xs text-slate-400">Just connected via WHOBEE</div>
                                        </div>
                                        <div className="ml-auto flex">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                                        </div>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed font-medium italic text-lg">
                                        "The blur thing is genius. We talked for 20 minutes before revealing — and it actually made the conversation so much better."
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-xs font-semibold text-indigo-700">Phase 3: Reveal Ready</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-xs font-semibold text-emerald-700">Live Connection</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-28 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4">FAQ</div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-slate-600">Got questions? We've got answers.</p>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button
                                    className="w-full px-6 py-5 text-left flex justify-between items-center font-semibold text-slate-900 hover:text-indigo-700 transition-colors"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    {item.q}
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-50">
                                        <div className="pt-4">{item.a}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA BANNER */}
            <section className="py-28 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-3xl shadow-2xl shadow-purple-500/20">
                        <div className="bg-white rounded-[22px] py-16 px-8">
                            <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-6" />
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5">
                                Ready to meet someone new?
                            </h2>
                            <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto">
                                Join thousands of people connecting on WHOBEE every day. It takes seconds.
                            </p>
                            <button
                                onClick={() => router.push('/lobby')}
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                <Video className="h-6 w-6" />
                                Start Chatting — It's Free
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
                        <div className="col-span-1 md:col-span-2">
                            <Link href="/" className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <Video className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">WHOBEE</span>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-sm">
                                A new way to meet people online — built on personality, not appearances.
                            </p>
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"><Share2 className="w-4 h-4" /></div>
                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors cursor-pointer"><Globe className="w-4 h-4" /></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-5">Platform</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li><Link href="/lobby" className="hover:text-indigo-400 transition-colors">Start Chatting</Link></li>
                                <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                                <li><Link href="#how-it-works" className="hover:text-indigo-400 transition-colors">How it Works</Link></li>
                                <li><Link href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-5">Legal</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
                                <li><Link href="#" className="hover:text-indigo-400 transition-colors">Community Guidelines</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
                        <p>© 2025 WHOBEE. All rights reserved.</p>
                        <p className="text-slate-500">Made with ❤️ for genuine human connection.</p>
                    </div>
                </div>
            </footer>
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
