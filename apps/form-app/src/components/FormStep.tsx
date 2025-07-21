interface FormStepProps {
  title: string
  children: React.ReactNode
}

export function FormStep({ title, children }: FormStepProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-semibold text-primary mb-2">
          {title}
        </h2>
        <div className="h-1 w-20 bg-accent rounded" />
      </div>
      
      {children}
    </div>
  )
}