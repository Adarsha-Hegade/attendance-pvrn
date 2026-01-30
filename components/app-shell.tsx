'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Settings,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signout } from '@/app/actions/auth'

// Import tab content components
import { DashboardTab } from '@/components/tabs/dashboard-tab'
import { DirectoryTab } from '@/components/tabs/directory-tab'
import { CalendarTab } from '@/components/tabs/calendar-tab'
import { ReportsTab } from '@/components/tabs/reports-tab'
import { ApprovalsTab } from '@/components/tabs/approvals-tab'
import { AdminTab } from '@/components/tabs/admin-tab'
import { ApplyLeaveTab } from '@/components/tabs/apply-leave-tab'

type TabId = 'dashboard' | 'directory' | 'calendar' | 'reports' | 'approvals' | 'admin' | 'apply-leave'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  approverOnly?: boolean
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare, approverOnly: true },
  { id: 'admin', label: 'Admin', icon: Settings, approverOnly: true },
]

export function AppShell({ 
  initialUser, 
  initialProfile 
}: { 
  initialUser: { id: string; email: string }
  initialProfile: { role: string; full_name?: string }
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isApprover = initialProfile?.role === 'approver'
  
  const visibleNavItems = navItems.filter(item => !item.approverOnly || isApprover)

  const handleTabChange = useCallback((tabId: TabId) => {
    startTransition(() => {
      setActiveTab(tabId)
    })
  }, [])

  const handleLogout = async () => {
    await signout()
    router.push('/login')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab userId={initialUser.id} isApprover={isApprover} />
      case 'directory':
        return <DirectoryTab />
      case 'calendar':
        return <CalendarTab />
      case 'reports':
        return <ReportsTab userId={initialUser.id} isApprover={isApprover} />
      case 'approvals':
        return <ApprovalsTab />
      case 'admin':
        return <AdminTab />
      case 'apply-leave':
        return <ApplyLeaveTab onSuccess={() => handleTabChange('dashboard')} />
      default:
        return <DashboardTab userId={initialUser.id} isApprover={isApprover} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LeavePortal
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", activeTab === item.id && "text-blue-600")} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Apply Leave Button */}
        <div className="px-2 pb-2">
          <button
            onClick={() => handleTabChange('apply-leave')}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
              "shadow-lg shadow-blue-500/25"
            )}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>Apply Leave</span>}
          </button>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          {!isCollapsed && (
            <div className="mb-2 px-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {initialProfile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{initialUser.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className={cn(
          "flex-1 transition-opacity duration-150",
          isPending ? "opacity-50" : "opacity-100"
        )}>
          {renderTabContent()}
        </div>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 py-3 px-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>© {new Date().getFullYear()} LeavePortal. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Designed and developed by{' '}
              <a 
                href="https://inktype.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Inktype Labs
              </a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
