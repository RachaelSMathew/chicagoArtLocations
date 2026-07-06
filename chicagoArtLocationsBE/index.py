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
    from opensearch import (
        searchIndex,
        addResultToIndex,
    )

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
def startup_event():
    global kdTree
    muralCoords = getCoordinates(
        "https://data.cityofchicago.org/resource/we8h-apcf.json"
    )
    kdTree = createKDTree(muralCoords, whichAxisSplitShouldBe(muralCoords))
    if os.getenv("NODE_ENV") != "production":
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
                result[1].get("artwork_title", "")
                + " "
                + result[1].get("artist_credit", "")
                + " "
                + (result[1].get("description_of_artwork", "") + " ")
                + result[1].get("street_address", "")
            )
            if (
                isExactSearch
                and result[1].get("artwork_title", "").lower()
                == searchQuery.replace('"', "").lower()
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


def updateScoreBasedOnDistance(results, lat, long):
    for result in results:
        dist_mi = haversine(
            (result["_source"]["latitude"], result["_source"]["longitude"]),
            (lat, long),
            unit=Unit.MILES,
        )
        geo_score = 1 / (1 + dist_mi)
        ## closer = higher
        result["_score"] = (0.90 * result["_score"]) + (0.10 * geo_score)
    ## sort results based on updated score
    results.sort(key=lambda x: x["_score"], reverse=True)  ## O(nlogn)


## handles exact search and return all results from opensearch at once
def searchingWithQueryDev(searchQuery, lat, long, minDistance):
    opensearchReturn = (
        searchIndex(searchQuery, lat, long, minDistance).get("hits", []).get("hits", [])
    )
    if not (len(searchQuery) > 0 and searchQuery[-1] == '"' and searchQuery[0] == '"'):
        updateScoreBasedOnDistance(opensearchReturn, lat, long)
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
            resultsFurtherFiltered = searchingWithQueryDev(
                searchQuery, lat, long, minDistance
            )
        else:
            resultsFurtherFiltered = searchingWithQueryDev(
                searchQuery, lat, long, minDistance
            )[:20]
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
