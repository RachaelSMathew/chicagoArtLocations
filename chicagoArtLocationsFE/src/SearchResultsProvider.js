import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const SearchResultsContext = createContext(undefined);
const useSearchResultsContext = () => {
  return useContext(SearchResultsContext);
};

function SearchResultsProvider({ children }) {
  // npm start → NODE_ENV=development
  const get_URL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://stationinformation.onrender.com";
  const [results, setResults] = useState(null);
  const [lastResultVisible, setLastVisible] = useState(false);
  const [spinnerDisplay, setSpinnerDisplay] = useState("block");
  const [bounds, setBounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const controller = new AbortController();
  const [finalSearchInput, setFinalSearchInput] =
    useState(
      "",
    ); /** search input text when user is done typing (hit enter, hit search icon or clicked option in dropdown) */
  const [currentLocation, setCurrLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((success) => {
      setCurrLocation({
        latitude: success.coords.latitude,
        longitude: success.coords.longitude,
        zoom: 10,
      });
    });
    const watchId = navigator.geolocation.watchPosition((success) => {
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

  const isPointInChicago = (point) => {
    if (
      point.latitude < 41.64 ||
      point.latitude > 42.02 ||
      point.longitude < -87.94 ||
      point.longitude > -87.52
    ) {
      return false;
    }
    return true;
  };

  const forLoopCompareBounds = (arr, bounds) => {
    let minLng = bounds[0][0];
    let minLat = bounds[0][1];
    let maxLng = bounds[1][0];
    let maxLat = bounds[1][1];
    for (let i = 0; i < arr.length; i++) {
      if (!isPointInChicago(arr[i][1])) continue;
      minLng = Math.min(minLng, arr[i][1].longitude); // minLng
      minLat = Math.min(minLat, arr[i][1].latitude); // minLat
      maxLng = Math.max(maxLng, arr[i][1].longitude); // maxLng
      maxLat = Math.max(maxLat, arr[i][1].latitude); // maxLat
    }
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  };

  // initializes some bounds(using first and last result) if none exist before doing forLoopCompareBounds
  // bounds = [minLng, minLat], [maxLng, maxLat] for Mapbox
  const findBounds = (results) => {
    var boundsTemp = [];
    if (bounds == [] || bounds.length === 0) {
      const minLat = Math.min(
        results[0][1].latitude,
        results[results.length - 1][1].latitude,
      );
      const maxLat = Math.max(
        results[0][1].latitude,
        results[results.length - 1][1].latitude,
      );
      const minLong = Math.min(
        results[0][1].longitude,
        results[results.length - 1][1].longitude,
      );
      const maxLong = Math.max(
        results[0][1].longitude,
        results[results.length - 1][1].longitude,
      );
      boundsTemp = [];
      boundsTemp.push([minLong, minLat]); // Mapbox expects [minLng, minLat]
      boundsTemp.push([maxLong, maxLat]); // Mapbox expects [maxLng, maxLat]
    } else {
      boundsTemp = bounds;
    }
    const updatedBounds = forLoopCompareBounds(results, boundsTemp);
    setBounds(updatedBounds); // state updates are asynchronous
    return updatedBounds;
  };

  useEffect(() => {
    if (!currentLocation) return;
    axios
      .get(
        `${get_URL}/newsearch/?lat=` +
          currentLocation.latitude +
          "&long=" +
          currentLocation.longitude +
          "&searchQuery=" +
          finalSearchInput +
          "&minDistance=0",
      )
      .then((res) => {
        const results = res.data.results;
        setResults(results);
      })
      .catch((err) => {
        console.log(`go to site: ${get_URL}`);
      });
  }, [currentLocation]);

  useEffect(() => {
    /*** LOAD MORE RESULTS WHEN USER REACHES BOTTOM */
    if (lastResultVisible && !isLoading) {
      if (results && results.length) {
        const farthestDistance = results[results.length - 1][0] + 0.0001;
        setIsLoading(true);
        axios
          .get(
            `${get_URL}/newsearch/?lat=${currentLocation.latitude}&long=${currentLocation.longitude}&searchQuery=${finalSearchInput}&minDistance=${farthestDistance}`,
            { signal: controller.signal },
          )
          .then((res) => {
            if (res.data.results.length === 0) {
              setSpinnerDisplay("none");
            } else {
              setResults([...results, ...res.data.results]);
            }
          })
          .catch((err) => {
            /** no more results available */
            setSpinnerDisplay("none");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
    return () => {
      // aborts the request if the component unmounts during cleanup
      controller.abort();
      setIsLoading(false);
    };
  }, [lastResultVisible]);

  // scroll to top of search results when search input changes
  useEffect(() => {
    (async () => {
      // immediately-invoked function expression
      try {
        queryWithOpenSearch(finalSearchInput);
        if (
          document.getElementsByClassName("scrollingSearchResults")?.length > 0
        ) {
          document.getElementsByClassName(
            "scrollingSearchResults",
          )[0].scrollTop = 0;
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, [finalSearchInput]);

  async function queryWithOpenSearch(searchQuery) {
    if (
      currentLocation &&
      currentLocation.latitude &&
      currentLocation.longitude
    ) {
      await axios
        .get(
          `${get_URL}/newsearch/?lat=${currentLocation.latitude}&long=${currentLocation.longitude}&minDistance=${0}&searchQuery=${searchQuery}`,
        )
        .then((res) => {
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
    <SearchResultsContext.Provider value={contextValue}>
      {children}
    </SearchResultsContext.Provider>
  );
}

export { SearchResultsContext, SearchResultsProvider, useSearchResultsContext };
