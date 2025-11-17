'use client'

/**
 * Admin Navigation Component
 * 
 * Provides navigation sidebar for the admin dashboard with:
 * - Navigation links (Dashboard, Users, Schemes, Settings)
 * - Active route highlighting
 * - User profile display with role badge
 * - Styled with Tailwind CSS
 * 
 * Requirements: 3.1, 3.4
 * 
 * @module components/admin/AdminNav
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// ============================================================================
// Navigation Items
// ============================================================================

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Schemes',
    href: '/admin/schemes',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

// ============================================================================
// Component
// ============================================================================

export function AdminNav() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  /**
   * Check if a nav item is active
   */
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  /**
   * Get user initials for avatar
   */
  const getUserInitials = () => {
    if (!profile?.full_name) return 'AD'
    
    const names = profile.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return profile.full_name.substring(0, 2).toUpperCase()
  }

  /**
   * Get role badge variant
   */
  const getRoleBadgeVariant = () => {
    if (profile?.role === 'super_admin') return 'default'
    return 'secondary'
  }

  /**
   * Get role display text
   */
  const getRoleText = () => {
    if (profile?.role === 'super_admin') return 'Super Admin'
    if (profile?.role === 'admin') return 'Admin'
    return 'User'
  }

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">MSME Mitr</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <Separator />

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User Profile Section */}
      <div className="p-4 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || 'Admin User'}
            </p>
            <Badge 
              variant={getRoleBadgeVariant()} 
              className="mt-1 text-xs"
            >
              {getRoleText()}
            </Badge>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
