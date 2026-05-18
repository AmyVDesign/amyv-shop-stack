import { Wordmark } from '@amyv/ui'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-site-bg flex items-center justify-center px-4">
      <div className="bg-white border border-site-border rounded-lg p-8 w-full max-w-sm shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <Wordmark size="md" />
        </div>
        <p className="text-site-muted text-sm">Coming soon</p>
      </div>
    </div>
  )
}
