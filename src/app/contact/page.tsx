"use client";
import React, { useState } from 'react';
import LegalLayout from '@/components/ui/LegalLayout';
import { Send, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        // Simulate an API call
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    return (
        <LegalLayout
            title="Contact Us"
            lastUpdated="March 14, 2026"
            icon="mail"
        >
            <p className="lead text-lg text-slate-600 mb-8">
                Have a question, feedback, or need to report an issue? We'd love to hear from you. Fill out the form below and our team will get back to you as soon as possible.
            </p>

            {status === 'success' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-800 mb-2">Message Sent!</h3>
                    <p className="text-emerald-600 mb-6">Thank you for reaching out. We'll review your message and respond shortly.</p>
                    <button 
                        onClick={() => setStatus('idle')}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        Send Another Message
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-bold text-slate-700">Your Name (Optional)</label>
                            <input 
                                type="text" 
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Anonymous User"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address (Optional)</label>
                            <input 
                                type="email" 
                                id="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="For replies only"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-bold text-slate-700">Subject</label>
                        <select 
                            id="subject"
                            required
                            value={formData.subject}
                            onChange={e => setFormData({...formData, subject: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                            <option value="">Select a topic...</option>
                            <option value="report">Report Abuse / Ban Appeal</option>
                            <option value="feedback">General Feedback</option>
                            <option value="bug">Report a Bug / Technical Issue</option>
                            <option value="business">Business Inquiry</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-bold text-slate-700">Message</label>
                        <textarea 
                            id="message"
                            required
                            rows={6}
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                            placeholder="How can we help you today?"
                        />
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-semibold">
                            <AlertCircle className="w-5 h-5" />
                            Something went wrong. Please try again later.
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 text-lg"
                        >
                            {status === 'submitting' ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" /> 
                                    Send Message
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            <hr className="my-12 border-slate-100" />

            <div className="grid md:grid-cols-2 gap-8 not-prose">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">Direct Email</h4>
                        <p className="text-sm text-slate-600 mb-2">Prefer to email us directly? Reach out to support.</p>
                        <a href="mailto:support@whobee.app" className="text-indigo-600 font-bold hover:underline">support@whobee.app</a>
                    </div>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">Immediate Danger?</h4>
                        <p className="text-sm text-slate-600">If you encountered illegal content involving minors, please report it to your local authorities immediately.</p>
                    </div>
                </div>
            </div>
        </LegalLayout>
    );
}
