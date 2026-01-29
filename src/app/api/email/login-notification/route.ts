
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
    try {
        const { email, userName } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        await sendEmail({
            to: email,
            subject: 'New Login to GeoInformatics Account',
            type: 'LOGIN_ALERT',
            data: {
                userName: userName || email.split('@')[0],
                email,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login notification error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
