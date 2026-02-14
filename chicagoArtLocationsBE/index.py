# index.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from CoreKDFunctions import (
    createKDTree,
    newsearch,
    whichAxisSplitShouldBe,
    isTreeBalanced,
    getCoordinates,
)
import time
import os
import copy
from haversine import haversine, Unit

if (
    os.getenv("NODE_ENV") != "production"
):  ## https://allanderek.github.io/posts/import-placement/
    from opensearch import createIndex, searchIndex, addResultToIndex

sys.path.append(".")  ## appends . to end of PYTHONPATH
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

kdTree = None


@app.on_event("startup")  # Runs once at startup, after server/uvicorn.run starts
async def startup_event():
    """Initialize KD-tree when FastAPI starts"""
    muralCoords = getCoordinates(
        "https://data.cityofchicago.org/resource/we8h-apcf.json"
    )
    global kdTree
    kdTree = createKDTree(muralCoords, whichAxisSplitShouldBe(muralCoords))
    if os.getenv("NODE_ENV") != "production":
        createIndex()  # only create opensearch index in development
        addResultToIndex(muralCoords)  # add to opensearch index
        print(isTreeBalanced(kdTree))


## handles basic search and exact search when searching in production env
def searchingWithQueryProd(results, searchQuery, lat, long):
    global kdTree
    resultsFurtherFiltered = []
    stillSearching = True
    numClosestNeighbors = 20
    isExactSearch = (
        searchQuery
        and len(searchQuery) > 1
        and searchQuery[-1] == '"'
        and searchQuery[0] == '"'
    )
    while stillSearching:
        for result in results:
            resultConcatenated = (
                result[1]["artwork_title"]
                + " "
                + result[1]["artist_credit"]
                + " "
                + (
                    result[1]["description_of_artwork"] + " "
                    if "description_of_artwork" in result[1]
                    else ""
                )
                + result[1]["street_address"]
            )
            if (
                isExactSearch
                and result[1]["artwork_title"].lower() == searchQuery.lower()
            ):
                resultsFurtherFiltered.append(copy.deepcopy(result))
            elif searchQuery.lower() in (resultConcatenated).lower():
                resultsFurtherFiltered.append(copy.deepcopy(result))

        if (
            numClosestNeighbors < kdTree.length
            and len(resultsFurtherFiltered) == 0
            and len(results) > 0
        ):
            results = newsearch(lat, long, results[-1][0], numClosestNeighbors)
            numClosestNeighbors += 20
        else:
            stillSearching = False
    return resultsFurtherFiltered


## handles exact search and return all results from opensearch at once
def exactSearchingWithQueryDev(searchQuery, lat, long):
    opensearchReturn = searchIndex(searchQuery).get("hits", []).get("hits", [])
    resultsFormatted = []
    for i in opensearchReturn:
        newFormatted = []
        newFormatted.append(
            haversine(
                (i["_source"]["latitude"], i["_source"]["longitude"]),
                (lat, long),
                unit=Unit.MILES,
            )
        )
        i["mural_registration_id"] = i["_id"]
        i["location"] = {
            "type": "Point",
            "coordinates": [i["_source"]["longitude"], i["_source"]["latitude"]],
        }
        i.update(i["_source"])
        del i["_source"]
        del i["_index"]
        del i["_id"]
        del i["_score"]
        newFormatted.append(i)
        resultsFormatted.append(newFormatted)
    return resultsFormatted


# handles search using opensearch (not exact search)when searching in development environment
def searchingWithQueryDev(results, searchQuery, lat, long):
    global kdTree
    resultsFurtherFiltered = []
    opensearchReturn = searchIndex(searchQuery).get("hits", []).get("hits", [])
    stillSearching = True
    numClosestNeighbors = 40
    while stillSearching:
        for i in opensearchReturn:
            for result in results:
                if result[1]["mural_registration_id"] == i.get("_id"):
                    resultsFurtherFiltered.append(copy.deepcopy(result))
        if (
            len(resultsFurtherFiltered) == 0
            and numClosestNeighbors < kdTree.length
            and len(results) > 0
        ):
            results = newsearch(lat, long, results[-1][0], numClosestNeighbors)
            numClosestNeighbors += 20
        else:
            stillSearching = False
    return resultsFurtherFiltered


# This runs EVERY time someone visits /api/search
@app.get("/newsearch/")
async def search(
    lat: float, long: float, minDistance: float = 0, searchQuery: str = ""
):
    start_time = time.time()
    results = newsearch(
        lat, long, minDistance
    )  ## returns 20 nearest points with a minimum distance of minDistance

    resultsFurtherFiltered = []
    if os.getenv("NODE_ENV") == "production":
        resultsFurtherFiltered = searchingWithQueryProd(results, searchQuery, lat, long)
    else:
        isExactSearch = (
            searchQuery
            and len(searchQuery) > 1
            and searchQuery[-1] == '"'
            and searchQuery[0] == '"'
        )
        if isExactSearch:
            if minDistance > 0:
                return {
                    "results": [],
                    "count": 0,
                    "time_seconds": time.time() - start_time,
                }
            resultsFurtherFiltered = exactSearchingWithQueryDev(searchQuery, lat, long)
        else:
            resultsFurtherFiltered = searchingWithQueryDev(
                results, searchQuery, lat, long
            )
    return {
        "results": results if searchQuery == "" else resultsFurtherFiltered,
        "count": len(results if searchQuery == "" else resultsFurtherFiltered),
        "time_seconds": time.time() - start_time,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app, host="0.0.0.0", port=8000
    )  # This starts server(does not happen at every request), blocks forever
