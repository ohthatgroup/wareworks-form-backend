import type { Metadata } from 'next'
import './globals.css'

// Dynamic metadata based on language parameter
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const lang = searchParams?.lang === 'es' ? 'es' : 'en'
  
  const metadata = {
    en: {
      title: 'WareWorks Application Form',
      description: 'Join the WareWorks team - submit your employment application',
    },
    es: {
      title: 'Formulario de Aplicación WareWorks',
      description: 'Únete al equipo WareWorks - envía tu solicitud de empleo',
    }
  } as const

  return {
    title: metadata[lang].title,
    description: metadata[lang].description,
  }
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