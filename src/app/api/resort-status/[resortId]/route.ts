
import { NextResponse } from 'next/server';
import { getResortStatus } from '@/services/resort-status';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ resortId: string }> }) {
    const params = await props.params;
    const { resortId } = params;

    try {
        const status = await getResortStatus(resortId);
        return NextResponse.json(status);
    } catch (error) {
        logger.error('API: Internal Error', { resortId, error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
