import type { Metadata, ResolvingMetadata } from 'next'
import './globals.css'

type Props = {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch parent metadata if needed
  const previousMetadata = await parent
  
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
    ...previousMetadata,
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