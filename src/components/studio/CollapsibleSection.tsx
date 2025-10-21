import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string | number
  icon?: React.ReactNode
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
  icon
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden"
    >
      <Collapsible.Trigger className="w-full flex items-center justify-between p-4 hover:bg-neutral-750 transition-colors group">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary-400">{icon}</div>}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
        <div className="p-4 pt-0">
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
