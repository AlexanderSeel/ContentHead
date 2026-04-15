import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type NavContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const NavContext = createContext<NavContextValue>({
  collapsed: false,
  toggleCollapsed: () => {}
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <NavContext.Provider value={{ collapsed, toggleCollapsed: () => setCollapsed((v) => !v) }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
