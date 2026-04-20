import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { RegisterForm } from './RegisterForm'
import '../styles.css'

export default async function RegisterPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  if (user) redirect('/')

  return (
    <div className="auth-shell">
      <p className="eyebrow">join the quieter web</p>
      <h1>
        Create an <em>account</em>.
      </h1>
      <p className="deck">
        So you can rewrite the headline on every link before you share it.
      </p>
      <RegisterForm />
      <p className="footnote">
        Already with us? <a href="/login">Sign in</a> · <a href="/">back home</a>
      </p>
    </div>
  )
}
