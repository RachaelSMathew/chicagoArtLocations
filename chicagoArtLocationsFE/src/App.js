import "./App.css";
import { useWindowDimContext } from "./WindowDimInfoProvider";
import Pulsating from "./PulsingLoc.js";
import SearchBar from "./SearchBar.js";
import SearchResults from "./SearchResults.js";
import Map from "./Map";
import { useState, useEffect } from "react";
import { useSearchResultsContext } from "./SearchResultsProvider";

function App() {
  const { windowWidth } = useWindowDimContext();
  let [loadingStr, setLoadingStr] = useState("");
  const { results } = useSearchResultsContext();
  const fullLoadingStr = "loading...";
  let interval = null;

  useEffect(() => {
    if (results && results.length > 0) {
      clearInterval(interval);
      setLoadingStr("");
    } else {
      interval = setInterval(() => {
        setLoadingStr((prev) => {
          if (prev.length === fullLoadingStr.length) return "";
          return prev + fullLoadingStr.charAt(prev.length);
        });
      }, 300);
    }
    return () => clearInterval(interval); // Cleanup
  }, [results]);

  return (
    <>
      <Map />
      <Pulsating width={windowWidth} />
      <SearchBar />
      <p className="loading-text">{loadingStr}</p>
      <div style={{ height: "300px" }} /> {/** spacer */}
      <SearchResults />
    </>
  );
}

export default App;
