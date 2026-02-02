from tracemalloc import start
from haversine import haversine
import json
import sys
import os

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
## os.path.dirname(__file__) == '/Users/rachaelmathew/stationInformation/test_material'
sys.path.append(parent_dir)
import collectPointsKDTree

"""
We're not checking for the order of the K closest points, just verifying that the K closest points are correct

1. a test where the points have more vairance in longitude
2. a test where the points have more vairance in latitude
3. a test where the points are all within two miles of another point 
4. do these tests with a point in chicago and one far away (in SC)
"""


def testKDTree():
    files = [
        "test_material/chicago_coordinates_latitude_variance.json",
        "test_material/chicago_coordinates_longitude_variance.json",
        "test_material/chicago_coordinates_within_two_miles.test.json",
    ]

    for file in files:
        points = []
        with open(file, "r") as f:
            points = json.load(f)

        kdTree = collectPointsKDTree.createKDTree(
            points, collectPointsKDTree.whichAxisSplitShouldBe(points)
        )
        dist_of_chicago_to_points = []
        dist_of_south_carolina_to_points = []

        for point in points:
            dist_of_chicago_to_points.append(
                {
                    "id": point["mural_registration_id"],
                    "distance": haversine(
                        (point["latitude"], point["longitude"]), (47.8832, -87.6424)
                    ),
                }
            )
            dist_of_south_carolina_to_points.append(
                {
                    "id": point["mural_registration_id"],
                    "distance": haversine(
                        (point["latitude"], point["longitude"]), (34.0522, -81.0559)
                    ),
                }
            )
        ## sort dist_of_chicago_to_points and dist_of_south_carolina_to_points by distance
        dist_of_chicago_to_points.sort(key=lambda x: x["distance"])
        dist_of_south_carolina_to_points.sort(key=lambda x: x["distance"])
        dist_of_chicago_to_points = [
            d["id"] for d in dist_of_chicago_to_points[:50]
        ].sort()
        dist_of_south_carolina_to_points = [
            d["id"] for d in dist_of_south_carolina_to_points[:50]
        ].sort()

        coord_in_chicago = {"latitude": 47.8832, "longitude": -87.6424}
        coord_in_south_carolina = {"latitude": 34.0522, "longitude": -81.0559}
        for coord in [coord_in_chicago, coord_in_south_carolina]:
            closestPoints = collectPointsKDTree.newsearch(
                coord["latitude"], coord["longitude"], 0, 50
            )
            closestPoints_ids = [
                point[1]["mural_registration_id"] for point in closestPoints
            ].sort()
            assert closestPoints_ids == (
                dist_of_chicago_to_points
                if coord == coord_in_chicago
                else dist_of_south_carolina_to_points
            )
