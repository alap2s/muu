import { Grid, List } from 'lucide-react'

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-accent text-white'
            : 'bg-background-secondary hover:bg-background-tertiary'
        }`}
        aria-label="Grid view"
      >
        <Grid size={20} />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-accent text-white'
            : 'bg-background-secondary hover:bg-background-tertiary'
        }`}
        aria-label="List view"
      >
        <List size={20} />
      </button>
    </div>
  )
} 