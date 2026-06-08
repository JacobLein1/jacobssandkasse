'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export type AuthState = { error: string } | { message: string } | null

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/')
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim()

  if (!username) return { error: 'Brukernavn er påkrevd.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username })

    if (profileError) return { error: profileError.message }
  }

  // If email confirmation is disabled, session is active → redirect
  if (data.session) redirect('/')

  return { message: 'Sjekk e-posten din for å bekrefte kontoen, og logg deretter inn.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
