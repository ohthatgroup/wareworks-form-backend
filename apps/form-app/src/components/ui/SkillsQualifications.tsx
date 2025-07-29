import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../../shared/validation/schemas'
import { Plus, X } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SkillsQualificationsProps {
  form: UseFormReturn<ValidatedApplicationData>
}

interface Skill {
  id: string
  value: string
  isCertified: boolean
}

export function SkillsQualifications({ form }: SkillsQualificationsProps) {
  const { watch, setValue } = form
  const { t } = useLanguage()
  
  // Initialize with existing skills or one empty skill
  const [skills, setSkills] = useState<Skill[]>(() => {
    const skill1 = watch('skills1')
    const skill2 = watch('skills2')
    const skill3 = watch('skills3')
    
    const existingSkills: Skill[] = []
    if (skill1) existingSkills.push({ id: 'skill1', value: skill1, isCertified: false })
    if (skill2) existingSkills.push({ id: 'skill2', value: skill2, isCertified: false })
    if (skill3) existingSkills.push({ id: 'skill3', value: skill3, isCertified: false })
    
    return existingSkills.length > 0 ? existingSkills : [{ id: 'skill1', value: '', isCertified: false }]
  })

  const updateFormValues = (updatedSkills: Skill[]) => {
    // Clear all skills first
    setValue('skills1', '')
    setValue('skills2', '')
    setValue('skills3', '')
    
    // Set values based on array order
    updatedSkills.forEach((skill, index) => {
      if (index === 0) setValue('skills1', skill.value)
      else if (index === 1) setValue('skills2', skill.value)
      else if (index === 2) setValue('skills3', skill.value)
    })
  }

  const addSkill = () => {
    if (skills.length < 3) {
      const newSkill = {
        id: `skill${skills.length + 1}`,
        value: '',
        isCertified: false
      }
      const updatedSkills = [...skills, newSkill]
      setSkills(updatedSkills)
      updateFormValues(updatedSkills)
    }
  }

  const removeSkill = (skillId: string) => {
    const updatedSkills = skills.filter(skill => skill.id !== skillId)
    setSkills(updatedSkills)
    updateFormValues(updatedSkills)
  }

  const updateSkill = (skillId: string, field: 'value' | 'isCertified', value: string | boolean) => {
    const updatedSkills = skills.map(skill => 
      skill.id === skillId 
        ? { ...skill, [field]: value }
        : skill
    )
    setSkills(updatedSkills)
    updateFormValues(updatedSkills)
  }

  // Get certified skills for document upload
  const certifiedSkills = skills.filter(skill => skill.isCertified && skill.value.trim())

  return (
    <div className="space-y-4">
      {skills.map((skill, index) => (
        <div key={skill.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label">
                  {t('skills.skill_qualification')} {index + 1}
                </label>
                {skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title={t('skills.remove_skill')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <input
                type="text"
                value={skill.value}
                onChange={(e) => updateSkill(skill.id, 'value', e.target.value)}
                placeholder={t('skills.skill_placeholder')}
                className="form-input w-full mb-3"
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${skill.id}-certified`}
                  checked={skill.isCertified}
                  onChange={(e) => updateSkill(skill.id, 'isCertified', e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label 
                  htmlFor={`${skill.id}-certified`}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {t('skills.certification_checkbox')}
                </label>
              </div>
              
              {skill.isCertified && skill.value.trim() && (
                <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
                  {t('skills.document_note')}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {skills.length < 3 && (
        <button
          type="button"
          onClick={addSkill}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors w-full justify-center"
        >
          <Plus size={16} />
          {t('skills.add_skill')}
        </button>
      )}
      
      {certifiedSkills.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('skills.certified_skills')} ({certifiedSkills.length}):</strong> {t('skills.certification_note')}
          </p>
          <ul className="mt-2 text-sm text-blue-700">
            {certifiedSkills.map((skill, index) => (
              <li key={skill.id} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                {skill.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}