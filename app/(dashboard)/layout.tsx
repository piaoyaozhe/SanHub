import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ParticlesWrapper } from '@/components/ui/particles-wrapper';
import { AnnouncementBanner } from '@/components/ui/announcement';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black relative">
      <ParticlesWrapper />
      <Header user={session.user} />
      <div className="flex relative z-10">
        <Sidebar user={session.user} />
        <main className="flex-1 lg:ml-72 p-6 lg:p-8 mt-16">
          <AnnouncementBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
