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
        <div className="min-h-screen flex flex-col">
          <header className="bg-secondary border-b border-primary/10 py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-2xl font-heading font-semibold text-primary">
                WareWorks Application
              </h1>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-neutral-inverse text-neutral-primary py-6">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm">&copy; 2024 WareWorks. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}