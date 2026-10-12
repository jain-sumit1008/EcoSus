export default function TabsBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-line gap-2 overflow-x-auto pb-px">
      {tabs.map((tab) => {
        const id = typeof tab === "string" ? tab : tab.id;
        const label = typeof tab === "string" ? tab : tab.label;
        const count = typeof tab === "object" ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs md:text-sm font-semibold transition border-b-2 ${
              isActive
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-muted hover:text-ink hover:border-line"
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? "bg-teal-50 text-[#0F766E]" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
