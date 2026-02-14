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
  const { isLoading } = useSearchResultsContext();
  const fullLoadingStr = "loading...";
  let interval = null;

  return (
    <>
      <Map />
      <Pulsating width={windowWidth} />
      <SearchBar />
      {isLoading && <div className="spinner" />}
      <div style={{ height: "300px" }} /> {/** spacer */}
      <SearchResults />
    </>
  );
}

export default App;
