export function ProoflineWordmark({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-app-md bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-app-xs relative">
        <span className="text-app-sm font-bold tracking-tight font-mono">PO</span>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-canvas" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center h-8 w-8 rounded-app-md bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-app-xs relative">
        <span className="text-app-xs font-bold tracking-tight font-mono">PO</span>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-canvas" />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-app-sm font-bold text-ink tracking-tight font-mono">ProofOps</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none font-semibold">
            SWITCH
          </span>
        </div>
        <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-widest mt-1">
          Evidence Gate Console
        </span>
      </div>
    </div>
  )
}
