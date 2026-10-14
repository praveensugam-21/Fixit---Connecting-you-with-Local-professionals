import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface GoogleSignInButtonProps {
  onError: (message: string) => void
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center gap-3 text-xs uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const idToken = credentialResponse.credential
            if (!idToken) {
              onError('Google sign-in failed: no credential returned')
              return
            }
            try {
              await loginWithGoogle(idToken)
              navigate('/')
            } catch {
              onError('Google sign-in failed. Please try again.')
            }
          }}
          onError={() => onError('Google sign-in was cancelled or failed.')}
          useOneTap={false}
        />
      </div>
    </div>
  )
}
