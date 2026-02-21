import "./App.css";
import "./SingleResult.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchResultsContext } from "./SearchResultsProvider";
import { useWindowDimContext } from "./WindowDimInfoProvider";
import { useSingleSearchResultContext } from "./SingleSearchResultProvider";

export default function SingleResult({
  singleRes,
  indexKey,
  resultsScrollRef,
}) {
  const artWorkData = singleRes[1];
  const dist = singleRes[0];
  const [showMore, setShowMore] = useState(false);
  const [hoverOnline, setHoverOnline] = useState(false);
  const [hoverDir, setHoverDir] = useState(false);
  const [svgPath, setSvgPath] = useState("");
  const resultRef = useRef(null);
  const targetRef = useRef(null);
  const artistDes = useRef(null);
  const { windowHeight } = useWindowDimContext();
  const [insideViewport, setInsideView] = useState(false); // handles the text border path
  const [scrolledPast10Percent, setScrolledPast10Percent] = useState(false);
  const { setFinalSearchInput, results, setLastVisible } =
    useSearchResultsContext();
  const { createURLs } = useSingleSearchResultContext();
  const { isLoading, isLoadingMore, loadMoreResults } =
    useSearchResultsContext();
  const { windowWidth } = useWindowDimContext();
  const [directionsURL, setDirectionURL] = useState(null);
  const [urlOnline, setURL] = useState("");
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkOverflow = () => {
    if (artistDes.current) {
      setHasOverflow(
        artistDes.current &&
          artistDes.current.scrollHeight > artistDes.current.clientHeight,
      );
    }
  };
  const innerHTML = useMemo(() => {
    if (singleRes && artWorkData.description_of_artwork) {
      let str = artWorkData.description_of_artwork;
      let index = str.indexOf(
        artWorkData.artist_credit.replace(
          /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g,
          "",
        ),
      );
      while (index !== -1) {
        str =
          str.slice(0, index) +
          '<span style="font-weight: 500">' +
          str.slice(index, index + artWorkData.artist_credit.length) +
          "</span>" +
          str.slice(index + artWorkData.artist_credit.length);
        index = str.indexOf(
          artWorkData.artist_credit.replace(
            /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g,
            "",
          ),
          index + 33,
        );
      }
      return str;
    } else {
      return "";
    }
  }, [singleRes]);

  function onScroll() {
    if (!resultRef || !resultRef.current) return;
    var containerTop = resultRef.current.getBoundingClientRect().top; // https://stackoverflow.com/a/55182563
    setInsideView(containerTop >= 0 && containerTop <= windowHeight);
    if (indexKey === results.length - 1) {
      var containerBottom = resultRef.current.getBoundingClientRect().bottom;
      setLastVisible(containerBottom >= 0 && containerBottom <= windowHeight);
    } // scrolled to bottom of results
    setScrolledPast10Percent(containerTop < 300);
  }

  useEffect(() => {
    if (
      results &&
      results.length &&
      !isLoadingMore &&
      !isLoading &&
      resultRef &&
      resultRef.current &&
      indexKey === results.length - 1
    ) {
      var containerBottom = resultRef.current.getBoundingClientRect().bottom;
      if (containerBottom >= 0 && containerBottom <= windowHeight) {
        loadMoreResults();
      }
    }
  }, [results]);

  useEffect(() => {
    createURLs(setDirectionURL, setURL, singleRes);
    onScroll();
  }, []);

  useEffect(() => {
    if (resultsScrollRef.current) {
      resultsScrollRef.current.addEventListener("scroll", onScroll);
    }
    return () => {
      if (resultsScrollRef.current)
        resultsScrollRef.current.removeEventListener("scroll", onScroll);
    };
  }); // no dependency array so that it run after every single render of the component so that the onScroll inside the event listener is not using a stale version of results or startingContainerBottom

  function updatePath() {
    if (resultRef.current) {
      const { offsetWidth: width, offsetHeight: height } = resultRef.current;
      const path = `M 13 13 H ${width - 13} V ${height - 13} H 13 Z`; // Rectangle path
      setSvgPath(path);
    }
  }
  const lenBorderResult = useMemo(() => {
    if (
      insideViewport &&
      resultRef.current &&
      singleRes &&
      artWorkData.artist_credit
    ) {
      return (
        (resultRef.current.offsetHeight * 2 +
          resultRef.current.offsetWidth * 2) /
        artWorkData.artist_credit.length
      );
    } else {
      return 0;
    }
  }, [insideViewport, singleRes, resultRef]);

  useEffect(() => {
    // if window width changes, check if text overflows
    checkOverflow();
  }, [windowWidth, results]);

  useEffect(() => {
    {
      /** https://stackoverflow.com/a/73954996 */
    } // update path of text when screen changes size
    if (!resultRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });
    checkOverflow();
    resizeObserver.observe(resultRef.current);
    return () => resizeObserver.disconnect(); // clean up
  }, []);

  return (
    <>
      <div
        className="containerRes"
        onClick={() =>
          // do exact searching when you click on a result
          setFinalSearchInput(
            '"' + artWorkData.artwork_title + '"' ?? "untitled",
          )
        }
        ref={resultRef}
      >
        <svg
          className="containerPathText"
          width={resultRef.current ? resultRef.current.offsetWidth * 2 : "150%"}
          height={
            resultRef.current ? resultRef.current.offsetHeight * 2 : "150%"
          }
        >
          <path
            id={"borderArt" + indexKey}
            d={svgPath}
            fill="none"
            stroke="none"
            strokeWidth="2"
          />
          <text>
            <textPath
              href={"#borderArt" + indexKey}
              fill="#d3962b"
              fontSize={12}
            >
              {(artWorkData.artist_credit + "  ● ").repeat(lenBorderResult)}
            </textPath>
          </text>
        </svg>
        {/* sticky header for single result*/}
        <div
          className="stickyHeader"
          style={{ opacity: scrolledPast10Percent ? 1 : 0 }}
        >
          <i className="titleStickyHeader">
            {artWorkData.artwork_title ?? "untitled"}
          </i>
          <div style={{ display: "flex", flexDirection: "row" }}>
            {urlOnline !== null && (
              <b style={{ letterSpacing: "1.5px", cursor: "pointer" }}>
                <a
                  style={{ color: "inherit", textDecoration: "none" }}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  href={urlOnline}
                >
                  ONLINE
                </a>
              </b>
            )}
            <div style={{ width: "20px" }} />
            {directionsURL !== null && (
              <b style={{ letterSpacing: "1.5px", cursor: "pointer" }}>
                <a
                  style={{ color: "inherit", textDecoration: "none" }}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  href={directionsURL}
                >
                  DIRECTIONS
                </a>
              </b>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: windowWidth < 370 ? "column" : "row",
          }}
        >
          <span ref={targetRef} className="title">
            <i>{artWorkData.artwork_title ?? "untitled"}</i>
          </span>
          <div style={{ paddingTop: "30px", flex: 2 }}>
            <p className="distResult">{Math.round(dist * 100) / 100} mi.</p>
            <div className="descriptionRes">
              {urlOnline && (
                <a
                  className="slant urlResult"
                  onMouseLeave={() => setHoverOnline(false)}
                  onMouseEnter={() => setHoverOnline(true)}
                  style={{
                    textDecoration: "none",
                    background: hoverOnline ? "#ecd3c2" : "#c08251",
                    color: hoverOnline ? "#c08251" : "#ecd3c2",
                    fontStyle: hoverOnline ? "oblique" : "normal",
                  }}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  href={urlOnline}
                >
                  <b>ONLINE</b>
                </a>
              )}
              {directionsURL && (
                <a
                  className="slant urlResult"
                  onMouseLeave={() => setHoverDir(false)}
                  onMouseEnter={() => setHoverDir(true)}
                  style={{
                    textDecoration: "none",
                    background: hoverDir ? "#588BA7" : "#c2a71e",
                    color: !hoverDir ? "#2E85D1" : "#c2a71e",
                  }}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  href={directionsURL}
                >
                  <b>DIRECTIONS</b>
                </a>
              )}
            </div>
            <p
              className="infoResult"
              ref={artistDes}
              onClick={() => (showMore ? setShowMore(false) : null)}
              style={{
                marginBottom: !artWorkData.description_of_artwork
                  ? "10px"
                  : "0px",
                maxHeight: showMore ? "17lh" : "2lh",
              }}
              dangerouslySetInnerHTML={{ __html: innerHTML }}
            />
            {artWorkData.description_of_artwork && showMore && (
              <p
                key={indexKey}
                className="lessMoreButton"
                onClick={() => setShowMore(false)}
              >
                less
              </p>
            )}
            {hasOverflow && artWorkData.description_of_artwork && !showMore && (
              <p
                key={indexKey}
                className="lessMoreButton"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMore(true);
                }}
              >
                more
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
