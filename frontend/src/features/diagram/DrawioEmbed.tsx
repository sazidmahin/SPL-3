import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type Props = { xml: string; title: string; className?: string }

export type DrawioEmbedHandle = {
  exportImage: (format: 'png' | 'jpeg') => Promise<string>
}

const drawioOrigin = 'https://embed.diagrams.net'
const drawioUrl = `${drawioOrigin}/?embed=1&proto=json&ui=min&spin=Loading+diagram...&noSaveBtn=1&noExitBtn=1&saveAndExit=0&modified=0`

export const DrawioEmbed = forwardRef<DrawioEmbedHandle, Props>(function DrawioEmbed(
  { xml, title, className = 'h-96' },
  ref,
) {
  const frame = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const pendingExport = useRef<{ resolve: (dataUrl: string) => void; reject: (error: Error) => void } | null>(null)

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
      if (message.event === 'error') {
        setStatus('error')
        pendingExport.current?.reject(new Error(typeof message.message === 'string' ? message.message : 'Diagram export failed'))
        pendingExport.current = null
        return
      }
      if (message.event === 'export') {
        pendingExport.current?.resolve(String(message.data ?? ''))
        pendingExport.current = null
      }
    }
    window.addEventListener('message', receiveMessage)
    if (ready.current) loadDiagram()
    return () => window.removeEventListener('message', receiveMessage)
  }, [xml])

  useImperativeHandle(ref, () => ({
    exportImage(format) {
      return new Promise<string>((resolve, reject) => {
        if (!ready.current || !frame.current?.contentWindow) {
          reject(new Error('Diagram preview is not ready yet'))
          return
        }
        pendingExport.current = { resolve, reject }
        frame.current.contentWindow.postMessage(
          JSON.stringify({ action: 'export', format, xml, background: '#ffffff', spinKey: 'export' }),
          drawioOrigin,
        )
      })
    },
  }))

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
})
