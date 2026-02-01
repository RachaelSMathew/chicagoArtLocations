import './App.css';
import { useSearchResultsContext } from './SearchResultsProvider';
import { useWindowDimContext } from './WindowDimInfoProvider';
import { useRef } from 'react';
import SingleResult from './SingleResult';

function SearchResults() {
  const resultsScrollRef = useRef(null);
  const { windowHeight } = useWindowDimContext();
  const { spinnerDisplay, results, lastResultVisible } = useSearchResultsContext();
  return (
    <>
      {results && results.length > 0 && (
        <div
          ref={resultsScrollRef}
          className="scrollingSearchResults"
          style={{ maxHeight: windowHeight - 300 + 'px' }}
        >
          <i className="numResultsFound"> {results.length} results found!</i>
          {results.map((val, index) => {
            return (
              <SingleResult
                singleRes={val}
                resultsScrollRef={resultsScrollRef}
                indexKey={index}
                key={index}
              />
            );
          })}
          {lastResultVisible && <div style={{ display: spinnerDisplay }} className="spinner" />}
          <i
            style={{
              display: spinnerDisplay === 'block' ? 'none' : 'block',
              letterSpacing: '1.4px',
            }}
          >
            You've reached the end!
          </i>
        </div>
      )}
      {results && results.length === 0 && <i className="noResults">no results found : (</i>}
    </>
  );
}
export default SearchResults;
