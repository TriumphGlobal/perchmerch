import { useAdminSession } from '@/hooks/use-admin-session'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAdminSession() // This will handle admin session management

  return (
    <div className="container mx-auto py-10">
      {children}
    </div>
  )
} 