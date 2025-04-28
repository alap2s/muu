import { Menu, Share, X, Mail } from 'lucide-react'
import { Dropdown } from '@/app/design-system'

interface SettingsMenuProps {
  language: 'EN' | 'DE'
  onLanguageChange: (language: 'EN' | 'DE') => void
  notifications: boolean
  onNotificationsChange: (enabled: boolean) => void
  onShare: () => void
}

export function SettingsMenu({ 
  language, 
  onLanguageChange, 
  notifications, 
  onNotificationsChange,
  onShare 
}: SettingsMenuProps) {
  const options = [
    {
      value: 'language',
      label: 'Language',
      rightContent: (
        <div className="flex gap-2">
          <button 
            className={`px-2 py-1 ${language === 'EN' ? 'bg-[#FF373A] text-white' : 'text-[#1e1e1e]'}`}
            onClick={(e) => {
              e.stopPropagation()
              onLanguageChange('EN')
            }}
          >
            EN
          </button>
          <button 
            className={`px-2 py-1 ${language === 'DE' ? 'bg-[#FF373A] text-white' : 'text-[#1e1e1e]'}`}
            onClick={(e) => {
              e.stopPropagation()
              onLanguageChange('DE')
            }}
          >
            DE
          </button>
        </div>
      )
    },
    {
      value: 'notifications',
      label: 'Notifications',
      rightContent: (
        <div className="flex gap-2">
          <button 
            className={`px-2 py-1 ${!notifications ? 'bg-[#FF373A] text-white' : 'text-[#1e1e1e]'}`}
            onClick={(e) => {
              e.stopPropagation()
              onNotificationsChange(false)
            }}
          >
            Off
          </button>
          <button 
            className={`px-2 py-1 ${notifications ? 'bg-[#FF373A] text-white' : 'text-[#1e1e1e]'}`}
            onClick={(e) => {
              e.stopPropagation()
              onNotificationsChange(true)
            }}
          >
            ON
          </button>
        </div>
      )
    },
    {
      value: 'share',
      label: 'Share with your friends',
      rightContent: (
        <Share className="w-4 h-4 text-[#1e1e1e]" />
      )
    },
    {
      value: 'app-info',
      label: 'Menoo',
      description: 'Standardized restaurant menus that adapt to your dietary preferences and language. No need to touch sticky menus anymore. Get notified when you sit down and settle.',
      hideInList: false
    },
    {
      value: 'empty',
      label: '',
      hideInList: true
    },
    {
      value: 'contact',
      label: 'Contact us',
      rightContent: (
        <Mail className="w-4 h-4 text-[#1e1e1e]" />
      )
    }
  ]

  return (
    <Dropdown
      value=""
      onChange={(value) => {
        if (value === 'share') {
          onShare()
        }
      }}
      options={options}
      leftIcon={<Menu className="w-4 h-4 text-[#FF373A]" strokeWidth={2} />}
      position="bottom"
      align="right"
      hideChevron
      preventCloseOnOptionClick
    />
  )
} 