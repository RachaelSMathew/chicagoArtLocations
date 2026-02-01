import { createContext, useContext, useEffect, useState } from 'react';

const WindowDimContext = createContext(undefined);
const useWindowDimContext = () => {
  return useContext(WindowDimContext);
};

function WindowDimInfoProvider({ children }) {
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    function resize() {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    }
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const contextValue = {
    windowHeight,
    windowWidth,
  };

  return <WindowDimContext.Provider value={contextValue}>{children}</WindowDimContext.Provider>;
}

export { WindowDimContext, WindowDimInfoProvider, useWindowDimContext };
