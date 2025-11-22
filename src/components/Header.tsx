export function Header() {
  return (
    <header className="bg-black border-b border-zinc-800 h-16 flex items-center px-6 sticky top-0 z-10">
      <h1 className="text-white text-xl font-bold tracking-tight">Commons Uploader</h1>
      <button className="ml-auto text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors">
        Sign in
      </button>
    </header>
  );
}
