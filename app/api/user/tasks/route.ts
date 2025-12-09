import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingGenerations } from '@/lib/db';
import type { Generation } from '@/types';

// 获取用户正在进行的任务
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const tasks = await getPendingGenerations(session.user.id);

    return NextResponse.json({
      data: tasks.map((t: Generation) => ({
        id: t.id,
        prompt: t.prompt,
        type: t.type,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('[API] Failed to get pending tasks:', error);
    return NextResponse.json(
      { error: '获取任务失败' },
      { status: 500 }
    );
  }
}
