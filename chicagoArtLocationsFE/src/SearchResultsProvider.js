import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const SearchResultsContext = createContext(undefined);
const useSearchResultsContext = () => {
  return useContext(SearchResultsContext);
};

function SearchResultsProvider({ children }) {
  // npm start → NODE_ENV=development
  const get_URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : 'https://stationinformation.onrender.com';
  const [results, setResults] = useState(null);
  const [lastResultVisible, setLastVisible] = useState(false);
  const [spinnerDisplay, setSpinnerDisplay] = useState('block');
  const [bounds, setBounds] = useState([]);
  const [finalSearchInput, setFinalSearchInput] =
    useState(
      ''
    ); /** search input text when user is done typing (hit enter, hit search icon or clicked option in dropdown) */
  const [currentLocation, setCurrLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(success => {
      setCurrLocation({
        latitude: success.coords.latitude,
        longitude: success.coords.longitude,
        zoom: 10,
      });
    });
    const watchId = navigator.geolocation.watchPosition(success => {
      setCurrLocation({
        latitude: success.coords.latitude,
        longitude: success.coords.longitude,
        zoom: 10,
      });
    });
    return () => {
      /** same as beforeDestroy in Vue */
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const forLoopCompareBounds = (arr, bounds) => {
    arr.forEach((result, index) => {
      if (result[1].longitude < bounds[0][0]) {
        bounds[0] = [result[1].longitude, result[1].latitude];
      } else if (result[1].longitude > bounds[1][0]) {
        bounds[1] = [result[1].longitude, result[1].latitude];
      }
    });
    return bounds;
  };

  // initializes some bounds(using first and last result) if none exist before doing forLoopCompareBounds
  const findBounds = results => {
    var boundsTemp = [];
    if (bounds == [] || bounds.length === 0) {
      if (results[0][1].longitude <= results[results.length - 1][1].longitude) {
        boundsTemp = [
          [results[0][1].longitude, results[0][1].latitude],
          [results[results.length - 1][1].longitude, results[results.length - 1][1].latitude],
        ];
      } else {
        boundsTemp = [
          [results[results.length - 1][1].longitude, results[results.length - 1][1].latitude],
          [results[0][1].longitude, results[0][1].latitude],
        ];
      }
      boundsTemp = forLoopCompareBounds(results, boundsTemp);
    } else {
      boundsTemp = bounds;
      boundsTemp = forLoopCompareBounds(results, boundsTemp);
    }
    setBounds(boundsTemp); // state updates are asynchronous
    return boundsTemp;
  };

  useEffect(() => {
    if (!currentLocation) return;
    axios
      .get(
        `${get_URL}/newsearch/?lat=` +
          currentLocation.latitude +
          '&long=' +
          currentLocation.longitude +
          '&searchQuery=' +
          finalSearchInput +
          '&minDistance=0'
      )
      .then(res => {
        const results = res.data.results;
        setResults(results);
      })
      .catch(err => {
        console.log(`go to site: ${get_URL}`);
      });
  }, [currentLocation]);

  useEffect(() => {
    /*** LOAD MORE RESULTS WHEN USER REACHES BOTTOM */
    if (lastResultVisible) {
      if (results && results.length) {
        const farthestDistance = results[results.length - 1][0] + 0.0001;
        axios
          .get(
            `${get_URL}/newsearch/?lat=${currentLocation.latitude}&long=${currentLocation.longitude}&searchQuery=${finalSearchInput}&minDistance=${farthestDistance}`
          )
          .then(res => {
            if (res.data.results.length === 0) {
              setSpinnerDisplay('none');
            } else {
              setResults([...results, ...res.data.results]);
            }
          })
          .catch(err => {
            /** no more results available */
            setSpinnerDisplay('none');
          });
      }
    }
  }, [lastResultVisible]);

  // scroll to top of search results when search input changes
  useEffect(() => {
    (async () => {
      // immediately-invoked function expression
      try {
        queryWithOpenSearch(finalSearchInput);
        if (document.getElementsByClassName('scrollingSearchResults')?.length > 0) {
          document.getElementsByClassName('scrollingSearchResults')[0].scrollTop = 0;
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, [finalSearchInput]);

  async function queryWithOpenSearch(searchQuery) {
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      await axios
        .get(
          `${get_URL}/newsearch/?lat=${currentLocation.latitude}&long=${currentLocation.longitude}&minDistance=${0}&searchQuery=${searchQuery}`
        )
        .then(res => {
          setResults(res.data.results);
        });
    }
  }

  const contextValue = {
    results,
    setResults,
    lastResultVisible,
    setLastVisible,
    spinnerDisplay,
    bounds,
    finalSearchInput,
    setFinalSearchInput,
    findBounds,
    currentLocation,
  };

  return (
    <SearchResultsContext.Provider value={contextValue}>{children}</SearchResultsContext.Provider>
  );
}

export { SearchResultsContext, SearchResultsProvider, useSearchResultsContext };
