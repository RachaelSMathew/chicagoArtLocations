# index.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from CoreKDFunctions import (
    createKDTree,
    newsearch,
    whichAxisSplitShouldBe,
    kdTree,
    isTreeBalanced,
    getCoordinates,
)
import time
import os
import copy

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


@app.on_event("startup")  # Runs once at startup, after server/uvicorn.run starts
async def startup_event():
    """Initialize KD-tree when FastAPI starts"""
    muralCoords = getCoordinates(
        "https://data.cityofchicago.org/resource/we8h-apcf.json"
    )
    createKDTree(muralCoords, whichAxisSplitShouldBe(muralCoords))
    if os.getenv("NODE_ENV") != "production":
        createIndex()  # only create opensearch index in development
        addResultToIndex(muralCoords)  # add to opensearch index
        print(isTreeBalanced(kdTree))


# This runs EVERY time someone visits /api/search
@app.get("/newsearch/")
async def search(
    lat: float, long: float, minDistance: float = 0, searchQuery: str = ""
):
    start_time = time.time()
    results = newsearch(lat, long, minDistance)
    resultsFurtherFiltered = []

    if os.getenv("NODE_ENV") == "production":
        for result in results:
            resultConcatenated = (
                result[1]["artwork_title"]
                + " "
                + result[1]["artist_name"]
                + " "
                + result[1]["artwork_description"]
                + " "
                + result[1]["street_address"]
            )
            if searchQuery.lower() in (resultConcatenated).lower():
                resultsFurtherFiltered.append(copy.deepcopy(result))
    else:
        opensearchReturn = searchIndex(searchQuery).get("hits", []).get("hits", [])
        for i in opensearchReturn:
            for result in results:
                if result[1]["mural_registration_id"] == i.get("_id"):
                    resultsFurtherFiltered.append(copy.deepcopy(result))
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
