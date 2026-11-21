import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Sun,
  Moon,
  Minus,
  Square,
  Copy,
  X,
  Languages,
  Menu,
  Download,
  WifiOff,
} from 'lucide-react';
import { Language, WindowState } from '../types/refto';
import { t } from '../i18n';

interface TitleBarProps {
  lang: Language;
  dark: boolean;
  windowState: WindowState;
  searchQuery: string;
  canGoBack: boolean;
  canGoForward: boolean;
  breadcrumb: string;
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallPWA: () => void;
  onSearchChange: (q: string) => void;
  onOpenCommandPalette: () => void;
  onToggleDark: () => void;
  onToggleLang: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
  onToggleMobileSidebar: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  lang,
  dark,
  windowState,
  searchQuery,
  canGoBack,
  canGoForward,
  breadcrumb,
  isOnline,
  isInstallable,
  isInstalled,
  onInstallPWA,
  onSearchChange,
  onOpenCommandPalette,
  onToggleDark,
  onToggleLang,
  onGoBack,
  onGoForward,
  onMinimize,
  onToggleMaximize,
  onCloseWindow,
  onToggleMobileSidebar,
}) => {
  const strings = t(lang);

  return (
    <header className="h-11 shrink-0 flex items-center justify-between gap-4 pl-3 pr-0 border-b border-black/[0.07] dark:border-white/[0.07] bg-white/65 dark:bg-[#242424]/85 backdrop-blur-md select-none">
      {/* Left: Mobile Menu + Back/Forward + Wordmark & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation"
          className="md:hidden w-7 h-7 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-0.5 mr-1">
          <button
            type="button"
            onClick={onGoBack}
            disabled={!canGoBack}
            title={lang === 'zh' ? '后退' : 'Back'}
            className="w-7 h-7 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onGoForward}
            disabled={!canGoForward}
            title={lang === 'zh' ? '前进' : 'Forward'}
            className="w-7 h-7 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              className="fill-[#0067C0] dark:fill-[#4CC2FF]"
            />
            <rect
              x="11"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              className="fill-neutral-800/80 dark:fill-white/80"
            />
            <rect
              x="2"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              className="fill-neutral-800/45 dark:fill-white/45"
            />
            <rect
              x="11"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              className="fill-[#0067C0]/60 dark:fill-[#4CC2FF]/60"
            />
          </svg>
          <span className="font-display font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            {strings.appName}
          </span>
          <span className="hidden sm:inline text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap truncate max-w-[180px]">
            / {breadcrumb}
          </span>
        </div>
      </div>

      {/* Center: Windows 11 Search Box */}
      <div className="flex-1 max-w-md mx-auto hidden md:flex items-center">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={strings.searchPlaceholder}
            aria-label={strings.searchPlaceholder}
            className="w-full h-7 pl-8 pr-16 text-xs rounded-[5px] bg-white/90 dark:bg-[#1a1a1a]/90 border border-black/[0.09] dark:border-white/[0.09] border-b-black/20 dark:border-b-white/15 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-b-2 focus:border-b-[#0067C0] dark:focus:border-b-[#4CC2FF] transition-colors"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Ctrl + K"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/[0.07] rounded border border-black/[0.06] dark:border-white/[0.08] whitespace-nowrap"
          >
            Ctrl+K
          </button>
        </div>
      </div>

      {/* Right: Offline Status / PWA Install + Quick Controls + Windows 11 Caption Buttons */}
      <div className="flex items-center h-full shrink-0">
        {!isOnline && (
          <div className="mr-2 h-7 px-2.5 rounded-[5px] bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap">
            <WifiOff className="w-3 h-3" />
            <span className="hidden lg:inline">
              {lang === 'zh' ? '离线运行中' : 'Offline Mode'}
            </span>
          </div>
        )}

        {!isInstalled && isInstallable && (
          <button
            type="button"
            onClick={onInstallPWA}
            className="mr-1.5 h-7 px-2.5 rounded-[5px] bg-[#0067C0] hover:bg-[#005BA9] dark:bg-[#4CC2FF] dark:hover:bg-[#3BB5F5] text-white dark:text-neutral-950 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">{strings.installOfflineApp}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden w-8 h-8 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
          className="h-7 px-2 mr-1 rounded text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '中文' : 'EN'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          title={dark ? (lang === 'zh' ? '切换浅色云母' : 'Light Mica') : lang === 'zh' ? '切换深色云母' : 'Dark Mica'}
          className="w-8 h-7 mr-2 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors"
        >
          {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center h-full border-l border-black/[0.05] dark:border-white/[0.05]">
          <button
            type="button"
            onClick={onMinimize}
            title={lang === 'zh' ? '最小化到任务栏' : 'Minimize'}
            className="w-11 h-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleMaximize}
            title={windowState === 'maximized' ? (lang === 'zh' ? '还原窗口' : 'Restore') : lang === 'zh' ? '最大化' : 'Maximize'}
            className="w-11 h-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            {windowState === 'maximized' ? (
              <Copy className="w-3 h-3" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={onCloseWindow}
            title={lang === 'zh' ? '关闭窗口' : 'Close'}
            className="w-11 h-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-[#C42B1C] hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
