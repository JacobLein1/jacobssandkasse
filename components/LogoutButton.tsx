'use client'

import { logout } from '@/app/actions/auth'

export function LogoutButton() {
  async function handleLogout() {
    if (!confirm('Er du sikker på at du vil logge ut?')) return
    await logout()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-400 hover:text-white text-sm transition-colors"
    >
      Logg ut
    </button>
  )
}
