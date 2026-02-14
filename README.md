# chicagoArtLocations

Summary: Taking location data from [here](https://data.cityofchicago.org/resource/we8h-apcf.json) ([Official website](https://data.cityofchicago.org/Parks-Recreation/Parks-Chicago-Park-District-Artworks-current-/e9ef-hrzb))and finding the nearest art locations to the user's current coordinate. The user can search in the search bar to find the closest points that also contain a certain keyword. When the search query has quotations around it, then an exact search is done, comparing the query to the artwork_title field. Some results will initially appear, and then when the user scrolls to the bottom a loading icon should appear, and then more results should appear.
 
## How to run:
- clone repo
  - Front End:
    - `cd chicagoArtLocationsFE`
    - `npm i`
    - `npm run start`
  - Back end
    - `cd chicagoArtLocationsBE`
    - `make dev`
