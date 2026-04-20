import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { LoginForm } from './LoginForm'
import '../styles.css'

export default async function LoginPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  if (user) redirect('/')

  return (
    <div className="auth-shell">
      <p className="eyebrow">welcome back</p>
      <h1>
        Sign <em>in</em>.
      </h1>
      <p className="deck">Pick up where you left off.</p>
      <LoginForm />
      <p className="footnote">
        New here? <a href="/register">Create an account</a> · <a href="/">back home</a>
      </p>
    </div>
  )
}
