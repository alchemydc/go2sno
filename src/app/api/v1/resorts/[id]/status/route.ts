import { NextResponse } from 'next/server';
import { getResortStatus } from '../../../../../../services/resort-status';
import { logger } from '../../../../../../utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    try {
        const status = await getResortStatus(id);
        return NextResponse.json(status);
    } catch (error) {
        logger.error('API: Internal Error', { resortId: id, error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
