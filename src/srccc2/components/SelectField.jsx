import { Dropdown, Label, Button } from '@heroui/react'
import { ChevronDown } from './UiMarks'

export default function SelectField({ label, value, onChange, options = [], placeholder, className = '' }) {
  const selectedKeys = value !== undefined && value !== null && value !== '' ? new Set([String(value)]) : new Set()
  const selected = options.find((option) => String(option.value) === String(value))

  function handleSelectionChange(keys) {
    const key = Array.from(keys)[0]
    onChange(key)
  }

  return (
    <div className={'flex flex-col gap-1.5 ' + className}>
      {label && <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-[var(--muted)]">{label}</span>}
      <Dropdown>
        <Button variant="secondary" className="w-full min-h-[42px] flex items-center justify-between gap-2 border border-[var(--line-strong)] rounded-[8px] px-3 text-sm bg-[var(--paper-raised)] hover:border-[#121a2a]">
          <span className={selected ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>{selected ? selected.label : (placeholder || 'Seç')}</span>
          <ChevronDown size={16} className="text-[var(--muted)] shrink-0" />
        </Button>
        <Dropdown.Popover className="min-w-[220px] rounded-[8px] border border-[var(--line)] bg-[var(--paper-raised)] shadow-lg p-1">
          <Dropdown.Menu selectionMode="single" selectedKeys={selectedKeys} onSelectionChange={handleSelectionChange}>
            {options.length === 0 ? (
              <Dropdown.Item id="__empty" textValue="Seçenek yok" isDisabled><Label>Seçenek yok</Label></Dropdown.Item>
            ) : options.map((option) => (
              <Dropdown.Item key={option.value} id={String(option.value)} textValue={option.label}>
                <Label>{option.label}</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
}
