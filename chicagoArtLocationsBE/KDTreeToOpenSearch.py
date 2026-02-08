from haversine import haversine, Unit
import time
from opensearch import addResultToIndex
from CoreKDFunctions import (
    createKDTree,
    newsearch,
    whichAxisSplitShouldBe,
    kdTree,
    isTreeBalanced,
    getCoordinates,
)

## setting enviorment vars in termial: https://askubuntu.com/a/58828
## eval(String)
## os.environ['latitude'] returns a String
## if you pass an object into function, object wil get updated

muralCoords = []


def createKDTreeAddResultsToOpenSearch():
    muralCoords = getCoordinates(
        "https://data.cityofchicago.org/resource/we8h-apcf.json"
    )
    createKDTree(muralCoords, whichAxisSplitShouldBe(muralCoords))
    addResultToIndex(muralCoords)
    print(isTreeBalanced(kdTree))
    return kdTree


## MAIN
if __name__ == "__main__":
    start_time = time.time()
    createKDTreeAddResultsToOpenSearch()
    ## tests for 41.8832° N, 87.6424° W
    newsearch(47.8832, -87.6424, 0.7)
    print("Time taken in seconds:", time.time() - start_time)
