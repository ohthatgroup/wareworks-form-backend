import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WareWorks Application Form',
  description: 'Join the WareWorks team - submit your employment application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-primary text-neutral-inverse antialiased">
        {children}
      </body>
    </html>
  )
}