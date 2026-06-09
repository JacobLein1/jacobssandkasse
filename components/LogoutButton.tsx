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
      className="flex-1 bg-detail hover:bg-gray-600 text-gray-400 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors"
    >
      Logg ut
    </button>
  )
}
