**API Calls made**
  - initial page load and current location change [GET Request]:
    ```
    axios.get(
        http://localhost:8000/newsearch/?lat= +
          currentLocation.latitude +
          '&long=' +
          currentLocation.longitude +
          '&searchQuery=' +
          searchQuery +
          '&minDistance=0' ----> minDistance = return only points that are at least as far away from currentLocation as minDistance
      )
    ```
  - when user scrolls to bottom of location results [GET Request]
    ```
    axios.get(
        http://localhost:8000/newsearch/?
         lat=${currentLocation.latitude}
         &long=${currentLocation.longitude}
         &searchQuery=${finalSearchInput}
         &minDistance=${farthestDistance},
    )
    ```
 - when the search query changes [GET Request]
   ```
   axios.get(
         http://localhost:8000/newsearch/?
         lat=${currentLocation.latitude}
         &long=${currentLocation.longitude}
         &minDistance=${0}
         &searchQuery=${searchQuery},
   )
   ```
**Every time the results array gets updated**:
1. collect all the mural_registration_ids of each result(every result has a unique one)
2. remove all markers that are not in the results collection of mural_registration_ids
3. Go through each result and create a new marker of that result if it doesn't exist in the DOM already 

**Exact Search**
- How is exact search triggered?
  1. when a map marker is clicked --> search input is updated with markers name and quotes around it
  2. when a search result is clicked --> search input is updated with search result's name and quotes around it
  3. manually add quotes to the search query in the search bar
- BE there is a condition to check if a search is an exact search (i.e., it is surrounded by quotes)

**Map Animations**

- when results are updated:
  
  bounds of the map are updated to fit all the search results
  method findBounds finds the two extremes of the longitude and latitude and sets the bounds state variable
  
  ```
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
  ```
- when a marker is clicked:
  
  - the search query is updated to be the markers div dataset.key (either `result_artwork.artwork_title` or 'untitled' if the artwork doesn't have a name)
  
  - when a marker is clicked --> finalSearchInput is updated ---> triggers api call ---> results array is updated

## Issues I ran into:
1. Some searches only result in one result even though OpenSearch says there should be more
   - the issue: if there is only one search result, the containerBottom starts off already being less than the windowHeight, so if a user manually scrolls to the bottom, the setLastVisible won't register a change and a GET request will not be sent to load more results
   - the solution: defining `startingContainerBottom` in SingleResult.js at initial load. When scrolling, it checks if the current contaierBottom is less than `startingContainerBottom`
3. the search results were reloading every time I went to another tab and then returned
    - the culprit:
        - `getCurrentLocation` and `watchPosition`
        - most browsers will pause geolocation updates when the tab is not active
        - when tab becomes active again, browser delivers any buffered location changes (i.e., it seems watchPosition and getCurrentPosition are only triggered when tab is changed to active or on initial load)
    - the solution:
      - adding a function outside of the useEffect in SearchResultsProvider.js that checks the currentLocation and the previous currentLocation for a difference of more than 0.01.
     ```
      const isHugeCoordinateDiff = (currentCurrentCoords) => {
        Math.abs(currentCurrentCoords.latitude - currentLocation.latitude) > 0.01 ||
        Math.abs(currentCurrentCoords.longitude - currentLocation.longitude) > 0.01;
      }
     useEffect(() => {
      const watchId = navigator.geolocation.watchPosition((success) => {
       if(isHugeCoordinateDiff) {
         setCurrLocation(...
     ```

      - the issue: currentLocation in isHugeCoordinateDiff is a stale value because of possibly timing and race conditions 
        - Windsurf says it's a closure problem even though isHugeCoordinateDiff is not a closure because it's defined outside the useEffect. **Closures capture variables at creation time, not live references**.

<img width="686" height="228" alt="Screenshot 2026-02-16 at 1 58 06 AM" src="https://github.com/user-attachments/assets/faf75f16-6a7b-4fdf-b863-5fdf8a5c2398" />


- a more robust solution: **functional update** (a function inside setState)

     ```
      useEffect(() => {
        const watchId = navigator.geolocation.watchPosition((success) => {
          setCurrLocation((prevLocation) => { // Guarantee that prevLocation is the most recent state of currLocation
            const isHugeCoordinateDiff =
              !prevLocation ||
              Math.abs(success.coords.latitude - prevLocation.latitude) > 0.01 ||
              Math.abs(success.coords.longitude - prevLocation.longitude) > 0.01;
    
            if (isHugeCoordinateDiff) {
              return {
                latitude: success.coords.latitude,
                longitude: success.coords.longitude,
                zoom: 10,
              };
            }
            return prevLocation; // new state value, in this case, no change to value made
          });
        });
       ...
     ```

    
## On formatting and making files more readable and organized (prettier and eslit)

| Prettier | ESLint |
| :--- | :---: |
| handles **formatting** (e.g., max line length, indentation) and makes the code prettier | a **linter** that provides warnings about bugs and code quality like unused variables and console logs |
| automatically format code | only some [rules](https://eslint.org/docs/latest/rules/) can be auto-fixed. the auto-fix ones have a wrench next to them |
| Minimal configuration needed to help promote formatting consistency across teams | can be highly configurable with many rules |

<img width="282" height="206" alt="Screenshot 2026-01-25 at 10 03 17 PM" src="https://github.com/user-attachments/assets/812e0ac9-7d8b-4b47-89eb-3ccfa9b5b6f9" />

2. In settings.json

<img width="608" height="139" alt="Screenshot 2026-01-25 at 10 07 20 PM" src="https://github.com/user-attachments/assets/fb3967bf-ba0c-45bb-81e3-5f4153b78e84" />

Install prettier as a VSCode extension 

Set Prettier as the default formatter

<img width="456" height="257" alt="Screenshot 2026-01-25 at 10 17 10 PM" src="https://github.com/user-attachments/assets/2a498fd6-fdd5-4595-b67e-6e5e3e29c760" />


Then add to settings.json
* `editor.formatOnSave`: Runs Prettier on save
* `source.fixAll.eslint`: configures ESLint to fix all auto-fixable ESLint problems 


3. Purpose of eslint-config-prettier in eslint.config.mjs file: CONFLICT RESOLUTION

<img width="554" height="89" alt="Screenshot 2026-01-25 at 10 21 20 PM" src="https://github.com/user-attachments/assets/cb07617a-5e51-4994-8620-bfe9739b7a89" />

When conflicts can arise between ESLint rules and Prettier when it comes to formatting rules:
  eslit turns off their formatting rules and prettier handles that instead

4. `Npc tsc -p . —noEmit`
 `noEmit` option tells TypeScript that we only want to run type checking and do not want the compiler to output any transpiled code
