import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSearchResultsContext } from "./SearchResultsProvider";

const INITIAL_CENTER = [-87.71444789, 41.83714877];
const INITIAL_ZOOM = 10.12;

function Map() {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [center, setCenter] = useState([]);
  const { bounds, finalSearchInput, setFinalSearchInput, results, findBounds } =
    useSearchResultsContext();

  useEffect(() => {
    // when user types into search input, first search result should fly to
    if (!finalSearchInput && bounds && bounds.length > 0 && mapRef.current) {
      // search input gets updated to ""
      mapRef.current.fitBounds(bounds);
    }
    if (finalSearchInput && finalSearchInput !== "") {
      if (!mapRef.current || !results) {
        return;
      }
      updateMap();
    }
  }, [results]);

  async function updateMap() {
    if (results.length === 1) {
      mapRef.current.flyTo({
        center: [results[0][1].longitude, results[0][1].latitude],
        zoom: 20,
      });
    }
    if (results.length > 1) {
      // update bounds and immediately apply them
      const newBounds = findBounds(results);
      if (newBounds && mapRef.current) {
        mapRef.current.fitBounds(newBounds);
      }
    }
  }

  useEffect(() => {
    // adding markers to map
    if (!mapRef.current || !results) {
      return;
    }
    if (center.length === 0)
      setCenter([results[0].longitude, results[0].latitude]);
    const allMarkers = document.querySelectorAll(
      "[data-mural_registration_id]",
    );
    const allMuralRegistrationIds = results.map(
      (r) => r[1].mural_registration_id,
    );
    // markersToBeRemoved
    allMarkers.forEach((marker) => {
      if (
        !allMuralRegistrationIds.includes(marker.dataset.mural_registration_id)
      ) {
        marker.remove();
      }
    });

    // markersToBeAdded
    results.forEach((result) => {
      /** tried mapRef.current.on('idle',function()), only ran when map was more zoom out */
      if (
        !document.querySelector[
          `data-mural_registration_id=${result[1].mural_registration_id}`
        ]
      ) {
        const result_artwork = result[1];
        var popup = new mapboxgl.Popup({
          closeButton: false,
          offset: [0, -30],
        }).setHTML(
          `<i style="padding: 10px; font-size: 20px">${result_artwork.artwork_title ?? "untitled"}</i>`,
        );
        const marker = new mapboxgl.Marker({ color: "green" }).setLngLat([
          result_artwork.longitude,
          result_artwork.latitude,
        ]);

        // get the marker element (https://stackoverflow.com/a/59090140)
        const element = marker.getElement();
        element.id = "marker";
        element.dataset.key = result_artwork.artwork_title ?? "untitled";
        element.dataset.mural_registration_id =
          result_artwork.mural_registration_id;

        // hover event listener
        element.addEventListener("mouseenter", () =>
          popup.addTo(mapRef.current),
        );
        element.addEventListener("mouseleave", () => popup.remove());
        element.addEventListener("click", () => {
          setFinalSearchInput(result_artwork.artwork_title ?? "untitled");
        });
        // add popup to marker
        marker.setPopup(popup);
        // add marker to map
        if (marker && mapRef.current) marker.addTo(mapRef.current);
      }
    });
    const boundsTypeLatLng =
      Array.isArray(bounds) &&
      bounds.length > 0 &&
      bounds[0].lng &&
      bounds[0].lat &&
      bounds[1].lng &&
      bounds[1].lat;
    if (boundsTypeLatLng && mapRef.current) mapRef.current.fitBounds(bounds);
  }, [results]);

  useEffect(() => {
    // source: https://codesandbox.io/p/sandbox/hccf4q
    mapboxgl.accessToken =
      "pk.eyJ1IjoibWF0aGV3ciIsImEiOiJjams5dzgwZWIwZnBkM3N0NGhiNmczZ3dpIn0.kVk8ruKknkfu7FCuR_uWxA";
    mapRef.current = new mapboxgl.Map({
      container: "map-container",
      style: "mapbox://styles/mapbox/streets-v12",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <>
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0 }}
      ></div>
    </>
  );
}

export default Map;
