import { useMemo, useState } from 'react'
import { GripVertical } from 'lucide-react'

const readSavedOrder = (storageKey) => {
  try {
    const value = localStorage.getItem(storageKey)
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveOrder = (storageKey, order) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(order))
  } catch {
    // Ignore storage limits or private browsing failures.
  }
}

const moveItem = (items, fromId, toId) => {
  const next = [...items]
  const fromIndex = next.indexOf(fromId)
  const toIndex = next.indexOf(toId)

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return next

  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

function DraggableGrid({ items, storageKey, getId = (item) => item.id || item.key || item.label, renderItem, className = '' }) {
  const indexedItems = useMemo(
    () => items.map((item) => ({ id: String(getId(item)), item })),
    [getId, items],
  )
  const ids = useMemo(() => indexedItems.map(({ id }) => id), [indexedItems])
  const [order, setOrder] = useState(() => readSavedOrder(storageKey))
  const [draggedId, setDraggedId] = useState('')

  const effectiveOrder = useMemo(() => {
    const known = order.filter((id) => ids.includes(id))
    const missing = ids.filter((id) => !known.includes(id))
    return [...known, ...missing]
  }, [ids, order])

  const orderedItems = useMemo(() => {
    const byId = new Map(indexedItems.map((entry) => [entry.id, entry.item]))
    return effectiveOrder.map((id) => ({ id, item: byId.get(id) })).filter((entry) => entry.item)
  }, [effectiveOrder, indexedItems])

  const handleDrop = (targetId) => {
    if (!draggedId) return
    const next = moveItem(effectiveOrder, draggedId, targetId)
    setOrder(next)
    saveOrder(storageKey, next)
    setDraggedId('')
  }

  return (
    <div className={className}>
      {orderedItems.map(({ id, item }) => (
        <div
          key={id}
          draggable
          onDragStart={(event) => {
            setDraggedId(id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', id)
          }}
          onDragEnd={() => setDraggedId('')}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(id)}
          className={`group relative cursor-grab active:cursor-grabbing ${draggedId === id ? 'opacity-60' : ''}`}
        >
          <span className="pointer-events-none absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white/90 text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100">
            <GripVertical className="h-4 w-4" />
          </span>
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

export default DraggableGrid
