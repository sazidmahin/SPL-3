import { useEffect, useRef, useState } from 'react'

type Props = { xml: string; title: string; className?: string }

const drawioOrigin = 'https://embed.diagrams.net'
const drawioUrl = `${drawioOrigin}/?embed=1&proto=json&ui=min&spin=Loading+diagram...&noSaveBtn=1&noExitBtn=1&saveAndExit=0&modified=0`

export function DrawioEmbed({ xml, title, className = 'h-96' }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    function loadDiagram() {
      frame.current?.contentWindow?.postMessage(JSON.stringify({ action: 'load', xml, autosave: 0, modified: 0 }), drawioOrigin)
    }
    function receiveMessage(event: MessageEvent) {
      if (event.origin !== drawioOrigin || event.source !== frame.current?.contentWindow) return
      let message: Record<string, unknown>
      try { message = typeof event.data === 'string' ? JSON.parse(event.data) as Record<string, unknown> : event.data as Record<string, unknown> } catch { return }
      if (message.event === 'init') { ready.current = true; loadDiagram(); return }
      if (message.event === 'load') { setStatus('ready'); return }
      if (message.event === 'error') setStatus('error')
    }
    window.addEventListener('message', receiveMessage)
    if (ready.current) loadDiagram()
    return () => window.removeEventListener('message', receiveMessage)
  }, [xml])

  return (
    <div className="grid gap-2">
      <iframe
        ref={frame}
        className={`${className} w-full rounded-lg border border-border bg-surface-2`}
        src={drawioUrl}
        title={title}
        onLoad={() => setStatus('loading')}
      />
      <p className={`text-xs ${status === 'error' ? 'text-danger' : 'text-fg-3'}`} aria-live="polite">
        {status === 'loading'
          ? 'Loading diagram preview…'
          : status === 'error'
          ? 'The diagram preview could not be loaded.'
          : 'Diagram preview ready.'}
      </p>
    </div>
  )
}
