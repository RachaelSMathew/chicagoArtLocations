import math
import copy


class MinHeapTree:
    def __init__(self, val, dist, maxHeapSize):
        self.maxHeapSize = maxHeapSize
        if val == None or dist == None:
            self.tree = None
        else:
            self.tree = [{"distance": dist, "value": val}]

    def len(self):
        return len(self.tree)

    def append(self, val, dist):
        if self.tree == None:
            self.tree = [{"distance": dist, "value": val}]
            return
        self.tree.append({"distance": dist, "value": val})
        index = len(self.tree) - 1
        isIndexDivBy2 = index % 2 == 0
        newIndex = (
            math.floor(index / 2)
            if isIndexDivBy2 == False
            else math.floor((index / 2) - 1)
        )
        while newIndex >= 0:
            if dist < self.tree[newIndex]["distance"]:
                parentVal = self.tree[newIndex]
                self.tree[newIndex] = {"distance": dist, "value": val}
                self.tree[index] = parentVal
                index = newIndex
                newIndex = (
                    math.floor(index / 2)
                    if isIndexDivBy2 == False
                    else math.floor((index / 2)) - 1
                )
            else:
                break

        self.tree = self.tree[0 : self.maxHeapSize]

    def remove(self, treeCopy):
        if treeCopy == None:
            return None
        firstVal = treeCopy[0]
        treeCopy[0] = treeCopy[len(treeCopy) - 1]
        treeCopy.pop()
        index = 0
        rightIndex = 2 * index + 2
        leftIndex = 2 * index + 1
        while leftIndex <= len(treeCopy) - 1:
            if (
                rightIndex > len(treeCopy) - 1
                or treeCopy[rightIndex]["distance"] <= treeCopy[leftIndex]["distance"]
            ) and treeCopy[leftIndex]["distance"] >= treeCopy[index]["distance"]:
                leftVal = treeCopy[leftIndex]
                treeCopy[leftIndex] = treeCopy[index]
                treeCopy[index] = leftVal
                index = leftIndex
            elif (
                rightIndex <= len(treeCopy) - 1
                and treeCopy[leftIndex]["distance"] <= treeCopy[rightIndex]["distance"]
                and treeCopy[index]["distance"] <= treeCopy[rightIndex]["distance"]
            ):
                rightVal = treeCopy[rightIndex]
                treeCopy[rightIndex] = treeCopy[index]
                treeCopy[index] = rightVal
                index = rightIndex
            else:
                break
            rightIndex = 2 * index + 2
            leftIndex = 2 * index + 1
        return firstVal

    def convertToArr(self):
        arr = []
        treeCopy = copy.deepcopy(self.tree)
        for _ in range(len(treeCopy)):
            firstVal = self.remove(treeCopy)
            arr.append((firstVal["distance"], firstVal["value"]))
        return arr
