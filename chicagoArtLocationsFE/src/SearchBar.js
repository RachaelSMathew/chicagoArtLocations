import './App.css';
import './SearchBar.css';
import { PastSearchIcon, SearchIcon } from './SearchIcon';
import { useState, useEffect, useRef } from 'react';
import { useSearchResultsContext } from './SearchResultsProvider';
function SearchBar() {
  const [pastSearches, setPastSearches] = useState(
    localStorage.getItem('pastSearches') ? JSON.parse(localStorage.getItem('pastSearches')) : []
  );
  const [currSearches, setCurrSearches] = useState([]);
  const [mouseHoverRes, setMouseHoverRes] = useState([]);
  const [input, setInput] = useState('');
  const [colorInput, setColInput] = useState('#f5f5f5');
  const { setFinalSearchInput, finalSearchInput, results } = useSearchResultsContext();

  const whenHoveringSearch = (index, newValue) => {
    setMouseHoverRes(
      mouseHoverRes.map((item, i) => {
        if (i === index) {
          return newValue;
        } else {
          return false;
        }
      })
    );
  };

  const [clickSearch, setClickSearch] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      /** click outside search results */
      if (searchInputRef && searchRef.current && !searchRef.current.contains(event.target)) {
        setClickSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function searchButtonIcon() {
    return (
      <div
        onClick={() => {
          setFinalSearchInput(input);
          setClickSearch(!clickSearch);
        }}
      >
        <SearchIcon />
      </div>
    );
  }

  function startTypingInput() {
    let currInput = searchInputRef.current.value.toLowerCase();
    let currSearch = pastSearches.filter(
      search => currInput !== '' && search.toLowerCase().includes(currInput)
    );
    let filteredBasedOnRes = [];
    if (results) {
      filteredBasedOnRes = results
        .filter(
          result =>
            currInput !== '' &&
            (result.artwork_title ?? 'untitled').toLowerCase().includes(currInput)
        )
        .map(result => result.artwork_title ?? 'untitled');
    }
    setInput(currInput);
    setCurrSearches([...new Set([...currSearch, ...filteredBasedOnRes].slice(0, 8))]);
    setMouseHoverRes(
      new Array([...new Set([...currSearch, ...filteredBasedOnRes].slice(0, 8))].length).fill(false)
    );
  }

  useEffect(() => {
    localStorage.setItem('pastSearches', JSON.stringify(pastSearches));
  }, [pastSearches]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          searchInputRef.current.blur(); //call blur() to remove focus from it.
          setClickSearch(false);
        }
      });
      searchInputRef.current.addEventListener('click', event => {
        searchInputRef.current.select(); //select all the text within the specified input element, effectively highlighting it.
      });
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (!clickSearch) {
      setColInput('#f5f5f5');
      setFinalSearchInput(input); // if user clicks outside search input area, then the text thats inside search input will be filtering the results
    }
  }, [clickSearch]);

  useEffect(() => {
    // when user clicks on a single search result, the search bar input text will now be the search result art title
    if (!searchInputRef.current) {
      return;
    }
    searchInputRef.current.value = finalSearchInput;
    if (!pastSearches.includes(finalSearchInput) && finalSearchInput.length >= 4) {
      setPastSearches([finalSearchInput, ...pastSearches].slice(0, 3));
    }
  }, [finalSearchInput]);

  const onClickSearchBarRes = search => {
    searchInputRef.current.value = search;
    setInput(search);
    setFinalSearchInput(input);
    setClickSearch(!clickSearch);
  };

  const clickOnSearchBar = () => {
    if (!clickSearch) {
      startTypingInput();
      setClickSearch(pastSearches.length > 0 && !clickSearch);
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <div style={{ height: '30px' }} />
      <div className="searchBar">
        <input
          onMouseEnter={() => setColInput('white')}
          onMouseLeave={() => {
            if (!clickSearch) setColInput('#f5f5f5');
          }}
          ref={searchInputRef}
          onChange={startTypingInput}
          id="searchQueryInput"
          type="text"
          name="searchQueryInput"
          style={{
            backgroundColor: colorInput,
            borderRadius:
              clickSearch && currSearches.length > 0 ? '1.625rem 1.625rem 0 0' : '1.625rem',
            width: '50%',
          }}
          placeholder="Search"
          onClick={clickOnSearchBar}
        />
        <button id="searchQuerySubmit" type="submit" name="searchQuerySubmit">
          {searchButtonIcon()}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 'calc(50% + 80px)',
            position: 'absolute',
            display: clickSearch ? 'flex' : 'none',
            zIndex: 10,
            flexDirection: 'column',
          }}
        >
          {currSearches.map((search, index) => {
            const exists = search.toLowerCase().search(input.toLowerCase());
            const pastOrCurrSearch =
              searchInputRef.current &&
              index >=
                pastSearches.filter(
                  search =>
                    searchInputRef.current.value !== '' &&
                    search.includes(searchInputRef.current.value)
                ).length;
            return (
              <div key={index}>
                <div
                  className="searchBarResult"
                  onClick={() => onClickSearchBarRes(search)}
                  onMouseLeave={() => {
                    whenHoveringSearch(index, false);
                  }}
                  onMouseEnter={() => {
                    whenHoveringSearch(index, true);
                  }}
                  style={{
                    backgroundColor: mouseHoverRes[index] ? '#dbcbbb' : 'white',
                    borderRadius:
                      index === currSearches.length - 1 ? '0 0 1.625rem 1.625rem' : null,
                  }}
                >
                  {pastOrCurrSearch ? searchButtonIcon() : <PastSearchIcon />}
                  <p className="textSearchBarResult">
                    {search.substring(0, exists)}
                    <span style={{ fontWeight: 'bold' }}>
                      {search.substring(exists, exists + input.length)}
                    </span>
                    {search.substring(exists + input.length)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default SearchBar;
