## functions used in both collectPointsKDTree.py and test_material/kd_tree_validity_test.py
from MinHeap import MinHeapTree
from haversine import haversine, Unit
import urllib.request
import json

kdTree = None


class Tree:
    def __init__(self, val, left, right, axis, length):
        self.left = left
        self.right = right
        self.val = val
        self.axis = axis
        self.length = length


def whichAxisSplitShouldBe(coords):
    sum_x = 0
    sum_y = 0
    sum_x2 = 0
    sum_y2 = 0
    ## find standard deviation instead
    for coord in coords:
        sum_x += coord["latitude"]
        sum_y += coord["longitude"]
        sum_x2 += coord["latitude"] ** 2
        sum_y2 += coord["longitude"] ** 2

    if len(coords) == 0:
        return "latitude"

    mean_x = sum_x / len(coords)
    mean_y = sum_y / len(coords)
    var_x = sum_x2 / len(coords) - mean_x**2
    var_y = sum_y2 / len(coords) - mean_y**2
    return "latitude" if var_x > var_y else "longitude"


def createKDTree(coords, axis):
    global kdTree
    if len(coords) == 1:
        return Tree(coords[0], None, None, axis, 1)
    if len(coords) == 0:
        return None

    coords.sort(key=lambda x: x[axis])  ## O(nlogn)
    mid = int(len(coords) / 2)
    rootNode = coords[mid]
    ## send to dynamo DB
    root = Tree(rootNode, None, None, axis, len(coords))
    root.left = createKDTree(
        coords[:mid], whichAxisSplitShouldBe(coords[:mid])
    )  ## left node
    root.right = createKDTree(
        coords[mid + 1 :], whichAxisSplitShouldBe(coords[mid + 1 :])
    )  ## right node
    kdTree = root
    return root


def newsearch(lat: float, long: float, minDistance=0, k=20):
    global kdTree
    target = {"latitude": lat, "longitude": long}
    closestPoints = kNearestKDTree(kdTree, target, k, minDistance)

    ## check if locations repeat!
    noRepeats = []
    for i in closestPoints:
        print(i)
        noRepeats.append(i[1]["mural_registration_id"])

    if len(noRepeats) == len(set(noRepeats)):
        print("No repeated locations!")

    for i in closestPoints:
        print(
            "latitude",
            i[1]["latitude"],
            "longitude",
            i[1]["longitude"],
            "distance",
            i[0],
        )

    return closestPoints


def kNearestKDTree(main_root, target, k, minDistance=0):
    results = MinHeapTree(val=None, dist=None, maxHeapSize=k)

    def getNearest(root):  ## https://www.youtube.com/watch?v=Glp7THUpGow
        if (
            root == None
            or root.val["latitude"] > 90
            or root.val["latitude"] < -90
            or root.val["longitude"] > 180
            or root.val["longitude"] < -180
        ):
            return None  ## once coordinate in the db has a Latitude 1914109.45 which is out of range [-90, 90]

        nextBranch = None
        otherBranch = None

        # Calculate distance to current node
        dist = haversine(
            (root.val["latitude"], root.val["longitude"]),
            (target["latitude"], target["longitude"]),
            unit=Unit.MILES,
        )

        if dist >= minDistance:
            # Add to results (class manages length to k max)
            results.append(root.val, dist)  ## O(log(n))

        axis = root.axis
        if root.val[axis] < target[axis]:
            nextBranch = root.right
            otherBranch = root.left
        else:
            nextBranch = root.left
            otherBranch = root.right

        temp = getNearest(nextBranch)
        best = (
            root
            if (
                temp == None
                or abs(target[axis] - temp.val[axis])
                > abs(target[axis] - root.val[axis])
            )
            else temp
        )

        ## (visual of exception: https://drive.google.com/file/d/1IbuNENnNDhXTKFEe0Dm7rOzIozFRNBmp/view?usp=sharing)
        distToBest = abs(target[axis] - best.val[axis])
        distToCurrIndex = abs(target[axis] - root.val[axis])

        if distToBest >= distToCurrIndex:
            temp = getNearest(otherBranch)
            best = (
                root
                if (
                    temp == None
                    or abs(target[axis] - temp.val[axis])
                    > abs(target[axis] - root.val[axis])
                )
                else temp
            )

    getNearest(main_root)
    return results.convertToArr()


def isTreeBalanced(root):
    if root == None:
        return True
    leftHeight = findHeight(root.left) if root.left else 0
    rightHeight = findHeight(root.right) if root.right else 0
    return {
        "balanced": abs(leftHeight - rightHeight) <= 1,
        "leftHeight": leftHeight,
        "rightHeight": rightHeight,
    }


def findHeight(root):
    if root == None:
        return 0
    return 1 + max(findHeight(root.left), findHeight(root.right))


def isPointInChicago(point):
    if (
        (point["latitude"]) < 41.64
        or (point["latitude"]) > 42.02
        or (point["longitude"]) < -87.94
        or (point["longitude"]) > -87.52
    ):
        return False
    return True


def getCoordinates(url):
    response = urllib.request.urlopen(url)
    data = json.load(response)
    updatedData = []
    ## convert all latitude and longitude in each object to float
    for object in data:
        floatLat = float(object["latitude"])
        floatLong = float(object["longitude"])
        object["latitude"] = floatLat
        object["longitude"] = floatLong

        if not isPointInChicago(object):
            ## some points are in the wrong order regarding latitude and longitude
            object["latitude"] = floatLong
            object["longitude"] = floatLat
            object["location"] = {
                "type": "Point",
                "coordinates": [floatLong, floatLat],
            }
            if not isPointInChicago(object):
                continue
        updatedData.append(object)
    return updatedData
