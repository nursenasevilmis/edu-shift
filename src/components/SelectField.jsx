import { Dropdown, Label, Button } from '@heroui/react'
import { ChevronDown } from 'lucide-react'

export default function SelectField({ label, value, onChange, options = [], placeholder, className = '' }) {
  const selectedKeys = value !== undefined && value !== null && value !== '' ? new Set([String(value)]) : new Set()
  const selected = options.find((o) => String(o.value) === String(value))

  function handleSelectionChange(keys) {
    const key = Array.from(keys)[0]
    onChange(key)
  }

  return (
    <div className={'flex flex-col gap-1.5 ' + className}>
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}

      <Dropdown>
        <Button
          variant="secondary"
          className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 h-10 text-sm bg-white hover:border-slate-300"
        >
          <span className={selected ? 'text-slate-700' : 'text-slate-400'}>
            {selected ? selected.label : (placeholder || 'Sec')}
          </span>
          <ChevronDown size={16} strokeWidth={2} className="text-slate-400 shrink-0" />
        </Button>

        <Dropdown.Popover className="min-w-[200px] rounded-xl border border-slate-100 shadow-lg p-1">
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
          >
            {options.length === 0 ? (
              <Dropdown.Item id="__empty" textValue="Secenek yok" isDisabled>
                <Label>Secenek yok</Label>
              </Dropdown.Item>
            ) : (
              options.map((opt) => (
                <Dropdown.Item key={opt.value} id={String(opt.value)} textValue={opt.label}>
                  <Label>{opt.label}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
}