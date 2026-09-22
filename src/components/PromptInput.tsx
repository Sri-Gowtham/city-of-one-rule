import { useState, type FormEvent } from 'react'

interface PromptInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <span className="prompt-input__label">ASK VESPER</span>
      <input
        className="prompt-input__field"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your question..."
        disabled={disabled}
        autoFocus
      />
      <button className="prompt-input__submit" type="submit" disabled={disabled || !value.trim()}>
        Ask
      </button>
    </form>
  )
}
