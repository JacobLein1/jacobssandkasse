'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export type AuthState = { error: string } | { message: string } | null

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get('username') as string).trim()
  const password = formData.get('password') as string

  if (!username) return { error: 'Brukernavn er påkrevd.' }

  const supabase = await createClient()

  const { data: emailData, error: lookupError } = await supabase.rpc('get_email_by_username', {
    p_username: username,
  })

  if (lookupError || !emailData) return { error: 'Finner ingen konto med det brukernavnet.' }

  const { error } = await supabase.auth.signInWithPassword({ email: emailData, password })

  if (error) return { error: 'Feil passord.' }

  redirect('/')
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim()

  if (!username) return { error: 'Brukernavn er påkrevd.' }

  const supabase = await createClient()
 const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { username } }
})

if (error) return { error: error.message }

if (data.user) {
  await supabase.from('profiles').update({ username }).eq('id', data.user.id)
}

if (data.session) redirect('/')

  return { message: 'Sjekk e-posten din for å bekrefte kontoen, og logg deretter inn.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
