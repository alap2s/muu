'use client'
import { Button } from '../design-system/components/Button'
import { Dropdown } from '../design-system/components/Dropdown'
import { Input } from '../design-system/components/Input'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { A2HSBanner } from '../components/A2HSBanner'
import { MenuItemRow } from '../components/MenuItemRow'
import type { MenuItem } from '../page'
import Link from 'next/link'
import React, { useState } from 'react'
import { ArrowLeft, Sun, Moon, Grid2x2, Rows3, Plus, Minus, Search, AlertCircle, CheckCircle, XCircle, Info, Settings, Edit2, Trash2, Copy, ExternalLink, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ListFilter, SortAsc, SortDesc, Star, Heart, MapPin, User, ShoppingCart, LogOut, Eye, EyeOff, Layers, Store, UploadCloud, DownloadCloud, DollarSign, Euro, MessageSquare, Phone, Calendar, Clock, Home, FileText, Folder, Wifi, WifiOff, Zap, ZapOff, Volume2, VolumeX, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, RefreshCw, SearchSlash, List, Mail as MailIcon, Send, Leaf, Milk, Fish, Bird, Egg, Beef, Nut, SunMoon, Circle, CircleOff } from 'lucide-react'
import { useViewMode } from '../contexts/ViewModeContext'
import { useRouter } from 'next/navigation'
import { Currency, useCurrency } from '../context/CurrencyContext'
import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'

interface ComponentShowcaseItem {
  id: string;
  title: string;
  description: string;
  renderExamples: () => React.ReactNode[];
}

export default function ComponentsPage() {
  const { viewMode, setViewMode } = useViewMode()
  const router = useRouter()
  const [selectedDropdownValue, setSelectedDropdownValue] = useState('option1')
  const [inputValue, setInputValue] = useState('Pre-filled value')
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set())
  const { themeMode, colorMode, setThemeMode, setColorMode } = useTheme()
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const { font, setFont } = useFont();

  const rowCount = 24;

  const dropdownOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3 (Disabled)', disabled: true },
    { value: 'option4', label: 'Option 4 with Icon', leftContent: <Star className="w-4 h-4" /> },
  ];

  const mockGetDietaryIcons = (item: MenuItem) => {
    const icons = []
    if (item.dietaryRestrictions.includes('vegan')) icons.push(<Leaf key="leaf" className="w-4 h-4 text-[var(--text-primary)]" />);    
    else if (item.dietaryRestrictions.includes('vegetarian')) icons.push(<Milk key="milk" className="w-4 h-4 text-[var(--text-primary)]" />);    
    if (item.dietaryRestrictions.includes('nuts')) icons.push(<Nut key="nut" className="w-4 h-4 text-[var(--text-primary)]" />);
    if (item.name.toLowerCase().includes('chicken')) icons.push(<Bird key="bird" className="w-4 h-4 text-[var(--text-primary)]" />);    
    return icons;
  };

  const mockMenuItems: MenuItem[] = [
    {
      id: 'item1',
      name: 'Spicy Chicken Burger',
      description: 'A delicious chicken burger with our special spicy sauce, lettuce, tomato, and cheese. Served with a side of fries.',
      price: 12.99,
      category: 'Burgers',
      dietaryRestrictions: ['nuts'],
      currency: 'USD'
    }
  ];

  const toggleMenuItemExpansion = (itemId: string) => {
    const newExpandedItems = new Set(expandedMenuItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedMenuItems(newExpandedItems);
  };

  const componentShowcases: ComponentShowcaseItem[] = [
    {
      id: 'button',
      title: 'Button',
      description: 'Standard button component with primary, secondary, selected, and disabled states. Can include text and/or icons.',
      renderExamples: () => [
        <Button variant="primary" className="w-auto" key="btn-primary">Primary</Button>,
        <Button variant="secondary" className="w-auto" key="btn-secondary">Secondary</Button>,
        <Button variant="secondary" selected className="w-auto" key="btn-selected">Selected</Button>,
        <Button variant="primary" disabled className="w-auto" key="btn-disabled-primary">Disabled Primary</Button>,
        <Button variant="secondary" disabled className="w-auto" key="btn-disabled-secondary">Disabled Secondary</Button>,
        <Button variant="secondary" aria-label="Settings button" className="w-auto" key="btn-icon"><Settings className="w-4 h-4" /></Button>,
        <Button variant="primary" className="w-auto" key="btn-primary-icon">Primary <Plus className="w-4 h-4 ml-2" /></Button>,
      ]
    },
    {
      id: 'dropdown',
      title: 'Dropdown',
      description: 'A selectable dropdown component. Options can have labels, values, icons, and disabled states.',
      renderExamples: () => [
        <Dropdown value={selectedDropdownValue} onChange={setSelectedDropdownValue} options={dropdownOptions} leftIcon={<List className="w-4 h-4" />} aria-label="Standard Dropdown Example" className="w-full" key="dd-standard" />,
        <Dropdown value={selectedDropdownValue} onChange={setSelectedDropdownValue} options={dropdownOptions} leftIcon={<Filter className="w-4 h-4" />} aria-label="Icon-only Dropdown Example" key="dd-icon" isIconOnly={true} />,
      ]
    },
    {
      id: 'input',
      title: 'Input',
      description: 'Standard text input field. Can include a placeholder, value, icons, and disabled state.',
      renderExamples: () => [
        <Input placeholder="Enter your email..." icon={MailIcon} aria-label="Email input with placeholder" className="w-full" key="input-placeholder" />,
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} icon={Search} aria-label="Search input with value" className="w-full" key="input-value" />,
        <Input value="Cannot edit this" disabled icon={Info} aria-label="Disabled input example" className="w-full" key="input-disabled" />,
        <Input placeholder="Password..." type="password" aria-label="Password input field" className="w-full" key="input-password"/>,
      ]
    },
    {
      id: 'toggles',
      title: 'Toggles',
      description: 'Controls for view modes, appearance, themes, and other application-wide settings.',
      renderExamples: () => [
        <div className="flex items-center" key="toggle-viewmode" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
          <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>View Mode</p>
          <Button variant="secondary" selected={viewMode === 'grid'} className="w-12 h-12 p-0 flex items-center justify-center"><Grid2x2 className="w-5 h-5" /></Button>
          <Button variant="secondary" selected={viewMode === 'list'} className="w-12 h-12 p-0 flex items-center justify-center"><Rows3 className="w-5 h-5" /></Button>
        </div>,
        <div className="flex items-center" key="toggle-theme" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
           <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>Appearance</p>
          <Button variant="secondary" selected={themeMode === 'auto'} className="w-12 h-12 p-0 flex items-center justify-center"><SunMoon className="w-5 h-5" /></Button>
          <Button variant="secondary" selected={themeMode === 'light'} className="w-12 h-12 p-0 flex items-center justify-center"><Sun className="w-5 h-5" /></Button>
          <Button variant="secondary" selected={themeMode === 'dark'} className="w-12 h-12 p-0 flex items-center justify-center"><Moon className="w-5 h-5" /></Button>
        </div>,
        <div className="flex items-center" key="toggle-color" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
           <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>Theme</p>
          <Button variant="secondary" selected={colorMode === 'brand'} className="w-12 h-12 p-0 flex items-center justify-center"><Circle fill="currentColor" className="w-5 h-5" /></Button>
          <Button variant="secondary" selected={colorMode === 'gray'} className="w-12 h-12 p-0 flex items-center justify-center"><CircleOff className="w-5 h-5" /></Button>
        </div>,
         <div className="flex items-center" key="toggle-font" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
           <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>Font</p>
          <Button variant="secondary" selected={font === 'jetbrains'} className="w-12 h-12 p-0 flex items-center justify-center font-mono text-lg">JT</Button>
          <Button variant="secondary" selected={font === 'atkinson'} className="w-12 h-12 p-0 flex items-center justify-center font-mono text-lg">AT</Button>
        </div>,
        <div className="flex items-center" key="toggle-currency" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
           <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>Currency</p>
          <Button variant="secondary" selected={selectedCurrency === 'EUR'} className="w-12 h-12 p-0 flex items-center justify-center"><Euro className="w-5 h-5" /></Button>
          <Button variant="secondary" selected={selectedCurrency === 'USD'} className="w-12 h-12 p-0 flex items-center justify-center"><DollarSign className="w-5 h-5" /></Button>
        </div>,
        <div className="flex items-center" key="toggle-language" style={{ pointerEvents: 'none', paddingLeft: '16px' }}>
           <p className="text-xs w-24" style={{ color: 'var(--text-tertiary)' }}>Language</p>
          <Button variant="secondary" selected={true} className="w-12 h-12 p-0 flex items-center justify-center font-mono text-[14px]">EN</Button>
          <Button variant="secondary" disabled={true} className="w-12 h-12 p-0 flex items-center justify-center font-mono text-[14px]">DE</Button>
        </div>
      ]
    },
    {
      id: 'a2hsbanner',
      title: 'A2HSBanner (Add to Home Screen)',
      description: 'Prompts PWA installation. Visibility is usually controlled by browser events. Visual representation for showcase.',
      renderExamples: () => [
        <div className="relative w-full p-4 border border-dashed rounded-md border-gray-300 dark:border-gray-700" style={{background: 'var(--background-alt)'}} key="a2hs-1">
          <A2HSBanner />
          <p className="text-xs mt-14 text-center" style={{ color: 'var(--text-tertiary)' }}>(Banner is usually fixed at the top on mobile)</p>
        </div>,
      ]
    },
    {
      id: 'menuitemrow',
      title: 'MenuItemRow',
      description: 'Displays a menu item with details, price, dietary icons, and expandable description.',
      renderExamples: () => 
        mockMenuItems.map(item => (
           <MenuItemRow key={`mir-${item.id}`} item={item} expanded={expandedMenuItems.has(item.id)} onClick={() => toggleMenuItemExpansion(item.id)} getDietaryIcons={mockGetDietaryIcons} viewMode={viewMode} />
        ))
    }
  ];

  const totalRowsForComponents = componentShowcases.reduce((acc, curr) => {
    // A showcase has a title row, a spacer row, and N example rows.
    const exampleCount = curr.renderExamples ? curr.renderExamples().length : 0;
    return acc + 1 + 1 + exampleCount;
  }, 0);
  const minTotalRows = 12; 
  const displayRowCount = Math.max(totalRowsForComponents, minTotalRows);
  let currentRow = 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }} role="main">
      {/* Notch spacer row for safe area */}
      <div className="flex justify-center" style={{ height: 'env(safe-area-inset-top)' }} role="presentation">
        <div style={{ width: 32, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)', height: '100%' }} />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }} />
        <div style={{ width: 32, background: 'var(--background-main)' }} />
      </div>

      {/* Header */}
      <header className="flex justify-center" style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 10, borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ width: 32, height: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
        <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, background: 'var(--background-main)', paddingRight: 0 }}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/')} aria-label="Back to main menu">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Components</h1>
          </div>
        </div>
        <div style={{ width: 32, height: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
      </header>

      {/* Content */}
      <div className="space-y-0" style={{ height: `calc(100vh - 48px - env(safe-area-inset-top))`, overflowY: 'auto' }} role="region" aria-label="Components Showcase">
        {componentShowcases.flatMap((showcaseItem, componentIdx) => {
          const rows = [];
          // Title Row
          rows.push(
            <div key={`title-${showcaseItem.id}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
              <div style={{
                  flex: 1,
                  maxWidth: 800,
                  background: 'var(--background-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 16px', // Padding for title row
                  minHeight: 48,
                  position: 'relative'
              }}>
                <div className="component-section">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{showcaseItem.title}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{showcaseItem.description}</p>
                </div>
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }}/>
            </div>
          );
          currentRow++;

          // Example Rows
          const examples = showcaseItem.renderExamples();
          examples.forEach((example, exampleIdx) => {
            
            const cellStyle: React.CSSProperties = {
              flex: 1,
              maxWidth: 800,
              background: 'var(--background-main)',
              display: 'flex',
              alignItems: 'center', // Vertically center all example content
              justifyContent: 'flex-start', // Align all example content to left
              padding: '0px', // No padding for all example row cells
              minHeight: 48,
              position: 'relative',
              // Default flexDirection is 'row', allowing w-auto and w-full to work as expected
            };

            rows.push(
              <div key={`example-${showcaseItem.id}-${exampleIdx}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                <div style={cellStyle}>
                  {example}
                </div>
                <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }}/>
              </div>
            );
            currentRow++;
          });

          // Add an empty row after each component group
          if (componentIdx < componentShowcases.length - 1) { // Only add spacer if it's not the last item
            rows.push(
              <div key={`spacer-after-${showcaseItem.id}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
                <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
                <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)', minHeight: 48 }} /> {/* Empty content cell */}
                <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }}/>
              </div>
            );
            currentRow++;
          }

          return rows;
        })}
        {/* Fill remaining rows if content is less than minTotalRows */}
        {Array.from({ length: Math.max(0, minTotalRows - currentRow) }).map((_, i) => (
          <div key={`empty-row-${i}`} className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, minHeight: 48, borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
            <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)', minHeight: 48 }} />
            <div style={{ width: 32, minHeight: 48, borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none', background: 'var(--background-main)' }} />
          </div>
        ))}
      </div>
    </div>
  )
} 