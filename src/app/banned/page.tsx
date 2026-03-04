import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, LogOut } from "lucide-react";
import Logo from '@/components/Logo';

export default function BannedPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="flex flex-col items-center">
                    <div className="h-20 mb-8">
                        <Logo />
                    </div>

                    <Card className="w-full shadow-lg border-red-100 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
                        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">

                            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                                <ShieldAlert size={32} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Suspended</h1>
                                <p className="text-slate-600">
                                    Your access to WHOBEE has been temporarily or permanently suspended due to multiple community reports.
                                </p>
                            </div>

                            <div className="bg-slate-100 rounded-lg p-4 w-full text-left text-sm text-slate-600 space-y-2">
                                <p><strong>Why did this happen?</strong></p>
                                <p>We take community safety seriously. This IP address has received multiple reports from other users for violating our community guidelines.</p>
                            </div>

                            <p className="text-xs text-slate-400 mt-4">
                                If you believe this is a mistake or your suspension period has ended, you may try accessing the site later. Permanent bans cannot be appealed.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
