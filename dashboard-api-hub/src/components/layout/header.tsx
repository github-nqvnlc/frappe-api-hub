import { Moon, Sun, Code2 } from 'lucide-react';
import { useTheme } from '../../providers/theme-provider';

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <Code2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            API Hub
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Frappe REST API Documentation
          </p>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
