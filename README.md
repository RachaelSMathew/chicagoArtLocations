# chicagoArtLocations

Using the [official Chicago city data catalogue](https://data.cityofchicago.org/Parks-Recreation/Parks-Chicago-Park-District-Artworks-current-/e9ef-hrzb) and sending a GET request to [this endpoint](https://data.cityofchicago.org/resource/we8h-apcf.json) which stores location data, I am finding the nearest art locations to the user's current coordinate. 

**How it works**: After the initial load, 20 results will initially appear, and when the user scrolls to the bottom, a loading icon should appear, and then more results should appear. The user can use the search bar to find the closest points that also contain a certain keyword. When the search query has quotations around it, then an exact search is done, searching for an artwork_title field that matches the query. Exact search(can also be triggered by clicking on a search result or a map marker) will return all the results at once because the results are taken directly from OpenSearch.

**Note**: The very first time you enter the website, it may take a couple of minutes to load because the Render server, which is storing the art location data, (specifically the web service instance) spins down after 15 min. of inactivity

## Tools used
- BE
  - KD Tree
    - to find 20 closest locations to the current point
  - Binary tree
    - to sort the 20 locations the KD tree returns
    - has the same sorting runtime and storage as `array.sort()`
  - Opensearch (only used locally)
    - uses advanced search to find a location that contains or partially contains the query search
  - Render
    - stores and creates the KD Tree used to find k nearest points to current location  
  - FastAPI
    - used to create the endpoint to do a search (`/newsearch/`), which is called from the FE
  - Python 
- FE
  - mapbox
  - React.js
  - haversine-distance npm package
  - axios

## How to run:
- clone repo
  - Front End:
    - `cd chicagoArtLocationsFE`
    - `npm i`
    - `npm run start`
  - Back end
    - `cd chicagoArtLocationsBE`
    - `make dev`
  - In [Opensearch Dashboard](http://localhost:5601/app/dev_tools#/console)
    - follow the API requests mentioned in this file(opensearch_commands_hybrid_search.json)
      - register and deploy a model
      - create the ingest pipeline (as art locations are added to the index, the ingest pipeline will add two new fields that store vector embedding version of the description and artwork_title field)
      - create the opensearch index (to store the collection of art locations)
      - create the search pipeline (normalization and combination of hybrid search results)
  - in opensearch.py, replace `modelId = None` with the modelId found here in OpenSearch Dashboards

 <img width="1429" height="471" alt="Screenshot 2026-05-05 at 1 08 18 AM" src="https://github.com/user-attachments/assets/ee505f8b-904d-47ca-b67a-241a8c3bbdfc" />

  - then in `chicagoArtLocationsBE` run `python3 index.py`
   
## Data inconsistencies in the JSON from the Chicago Data Portal
- Four instances of Alley Wall Project
- Two instances of Light the spark
- two instances of Where There Is Discord, Harmony:The Power of Art
- 32 instances of Las Puertas de Paseo Boricua


## Future Plans:
- When a user inputs a search query, right now OpenSearch only filters out results that have a score of 0.01 or greater. I want to advance this search by decreasing the filter score in OS as the user scrolls down the search results from the front end. 
