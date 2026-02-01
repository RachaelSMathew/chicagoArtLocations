import { createContext, useContext, useState } from 'react';
import { useSearchResultsContext } from './SearchResultsProvider';
// provider that controls whether to show sticky header or not and details of sticky

const SingleSearchResultContext = createContext(undefined);
const useSingleSearchResultContext = () => {
  return useContext(SingleSearchResultContext);
};

function SingleSearchResultProvider({ children }) {
  const [currScrollOver, setCurrScrollOver] =
    useState(null); /**current search result's index you're scrolling over */
  const [directionsURLSticky, setDirectionURLSticky] = useState(null);
  const [urlOnlineSticky, setURLSticky] = useState(null);
  const { currentLocation } = useSearchResultsContext();
  const [titleStickyHeader, setTitleStickyHeader] = useState(null);
  const { setLastVisible } = useSearchResultsContext();

  const createURLs = (setD, setU, singleRes) => {
    /** create URLS for directions to location and google url */
    if (singleRes[1] && singleRes[1].latitude && singleRes[1].longitude) {
      setD(
        'https://www.google.com/maps/dir/' +
          singleRes[1].latitude +
          ',' +
          singleRes[1].longitude +
          '/' +
          currentLocation.latitude +
          ',' +
          currentLocation.longitude
      );
    } else {
      if (setD === setDirectionURLSticky) {
        setD(null);
      }
    }
    if (singleRes[1] && singleRes[1].artwork_title) {
      setU(
        `https://www.google.com/search?q=${singleRes[1].artwork_title.replace(/\s/g, '+')}+chicago+artwork`
      );
    } else {
      if (setU === setURLSticky) {
        setU(null);
      }
    }
  };

  const contextValue = {
    urlOnlineSticky,
    directionsURLSticky,
    setDirectionURLSticky,
    setURLSticky,
    setCurrScrollOver,
    currScrollOver,
    setLastVisible,
    titleStickyHeader,
    setTitleStickyHeader,
    createURLs,
  };

  return (
    <SingleSearchResultContext.Provider value={contextValue}>
      {children}
    </SingleSearchResultContext.Provider>
  );
}

export { SingleSearchResultContext, SingleSearchResultProvider, useSingleSearchResultContext };
