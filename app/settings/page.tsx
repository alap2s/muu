import { Button } from '../design-system/components/Button'
import { GridRow } from '../design-system/components/GridRow'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  BellRing,
  Sun,
  SunMoon,
  Moon,
  SwatchBook,
  Link2,
  Grid2x2,
  Rows3,
  Mail,
  Share,
  Euro,
  DollarSign
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background-secondary flex flex-col">
      {/* Header */}
      <GridRow className="border-b border-primary-border/10" >
        <div className="flex items-center h-12">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </Link>
        </div>
        <div className="flex-1 flex items-center h-12 pl-4">
          <span className="font-mono text-xl font-bold text-primary">Settings</span>
        </div>
      </GridRow>
      {/* App Info */}
      <GridRow className="border-b border-primary-border/10">
        <div className="flex flex-col justify-center h-12">
          <span className="font-mono text-xl font-bold text-primary">Menoo</span>
          <span className="text-gray-500 text-base font-mono mt-1">Accessible and standardized restaurant menus that adapt to your dietary preferences and language. No need to touch sticky menus anymore. Get notified when you sit down and settle.</span>
        </div>
      </GridRow>
      {/* Settings Grid */}
      <div className="grid grid-cols-6 gap-0 w-full">
        {/* Row 1 */}
        <div className="col-span-1 flex items-center justify-center h-12"><Bell className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><BellRing className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Sun className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><SunMoon className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Moon className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        {/* Row 2 */}
        <div className="col-span-1 flex items-center justify-center h-12"><SwatchBook className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Link2 className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Grid2x2 className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Rows3 className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        {/* Row 3 */}
        <div className="col-span-1 flex items-center justify-center h-12 font-mono text-primary">EN</div>
        <div className="col-span-1 flex items-center justify-center h-12 font-mono text-primary">DE</div>
        <div className="col-span-1 flex items-center justify-center h-12"><Mail className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Share className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        {/* Row 4 */}
        <div className="col-span-1 flex items-center justify-center h-12 font-mono text-primary">JT</div>
        <div className="col-span-1 flex items-center justify-center h-12 font-mono text-primary">AT</div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
        <div className="col-span-1 flex items-center justify-center h-12"><Euro className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"><DollarSign className="w-6 h-6 text-primary" /></div>
        <div className="col-span-1 flex items-center justify-center h-12"></div>
      </div>
    </div>
  )
} 