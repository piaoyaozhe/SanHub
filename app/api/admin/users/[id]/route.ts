import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, updateUser, getUserGenerations } from '@/lib/db';

// 获取用户详情和生成记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const generations = await getUserGenerations(params.id, 100);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: user.balance,
        disabled: user.disabled,
        createdAt: user.createdAt,
      },
      generations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// 更新用户（密码、余额、禁用状态）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const data = await request.json();
    const updates: Record<string, unknown> = {};

    if (data.password !== undefined && data.password.trim()) {
      updates.password = data.password;
    }
    if (data.balance !== undefined) {
      updates.balance = parseInt(data.balance);
    }
    if (data.disabled !== undefined) {
      updates.disabled = Boolean(data.disabled);
    }
    if (data.name !== undefined) {
      updates.name = data.name;
    }

    const user = await updateUser(params.id, updates);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      balance: user.balance,
      disabled: user.disabled,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}
