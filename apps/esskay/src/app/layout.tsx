import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Ess-Kay Yards',
  description: 'Marine parts and service. Brewerton, NY.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${sourceSerif4.variable}`}>
      <body className="min-h-full bg-site-bg text-site-text font-body" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
