import { useShow } from '../../contexts/ShowContext'
import { Tv, X } from 'lucide-react'

export function ShowSelector() {
  const { currentShow, setCurrentShow, shows, getThemeColor } = useShow()

  return (
    <div className="flex items-center gap-3">
      <Tv className="w-5 h-5 text-gray-400" />
      <div className="relative">
        <select
          value={currentShow?.id || ''}
          onChange={(e) => {
            const show = shows.find(s => s.id === e.target.value)
            setCurrentShow(show || null)
          }}
          className="bg-[#2a2a2a] border-2 border-[#3a3a3a] rounded-lg px-4 py-2 pr-10 text-white font-semibold min-w-[200px] appearance-none cursor-pointer hover:border-opacity-70 transition-colors"
          style={{
            borderColor: currentShow ? getThemeColor() : undefined,
            color: currentShow ? getThemeColor() : undefined
          }}
        >
          <option value="">No Show Selected</option>
          {shows.map(show => (
            <option key={show.id} value={show.id}>
              {show.name}
            </option>
          ))}
        </select>
        {currentShow && (
          <button
            onClick={() => setCurrentShow(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#1a1a1a] rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {currentShow && (
        <div 
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ 
            backgroundColor: `${getThemeColor()}20`,
            color: getThemeColor(),
            border: `1px solid ${getThemeColor()}50`
          }}
        >
          Active
        </div>
      )}
    </div>
  )
}
