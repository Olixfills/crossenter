export default function PlaceholderView({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-base/10 text-center p-12 select-none">
       {Icon ? (
         <Icon size={48} className="mb-4 opacity-10" strokeWidth={1} />
       ) : (
         <div className="text-4xl mb-4 grayscale opacity-20">📦</div>
       )}
      <h2 className="text-sm font-bold text-text-hi uppercase tracking-[0.2em] opacity-40">{title} Module</h2>
      <p className="text-2xs text-text-ghost mt-2 max-w-xs opacity-30 italic">
        The {title} library explorer and management tools are currently in development.
      </p>
    </div>
  );
}
