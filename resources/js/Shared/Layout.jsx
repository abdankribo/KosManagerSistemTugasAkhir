import React from 'react';
import Helmet from 'react-helmet';
import MainMenu from '@/Shared/MainMenu';
import FlashMessages from '@/Shared/FlashMessages';
import TopHeader from '@/Shared/TopHeader';
import BottomHeader from '@/Shared/BottomHeader';

export default function Layout({ children }) {
  return <div className="km-shell min-h-screen"><Helmet titleTemplate="%s | Kos Manager" /><div className="md:flex md:min-h-screen"><TopHeader /><div className="flex flex-grow overflow-hidden"><MainMenu className="km-sidebar flex-shrink-0 hidden w-60 px-4 py-5 overflow-y-auto md:block" /><main className="w-full min-w-0 overflow-y-auto"><div className="km-topbar sticky top-0 z-30 px-4 py-3 md:px-10"><BottomHeader /></div><div className="px-4 py-7 md:px-10 md:py-10"><FlashMessages />{children}</div></main></div></div></div>;
}