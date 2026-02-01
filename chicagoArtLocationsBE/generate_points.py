import random
import math
import collectPointsKDTree
from haversine import haversine

def generate_points_near_center(center_lat, center_lon, radius_miles, num_points):
    """
    Generate random points within a given radius of a center point.
    
    Args:
        center_lat: Center latitude
        center_lon: Center longitude  
        radius_miles: Radius in miles
        num_points: Number of points to generate
        
    Returns:
        List of dictionaries with latitude, longitude, and location info
    """
    points = []
    
    # Earth radius in miles
    earth_radius = 3959.0
    
    for _ in range(num_points):
        # Generate random angle and distance
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, radius_miles)
        
        # Convert to radians
        lat1_rad = math.radians(center_lat)
        lon1_rad = math.radians(center_lon)
        
        # Calculate new coordinates using haversine formula
        lat2_rad = math.asin(
            math.sin(lat1_rad) * math.cos(distance / earth_radius) +
            math.cos(lat1_rad) * math.sin(distance / earth_radius) * math.cos(angle)
        )
        
        lon2_rad = lon1_rad + math.atan2(
            math.sin(angle) * math.sin(distance / earth_radius) * math.cos(lat1_rad),
            math.cos(distance / earth_radius) - math.sin(lat1_rad) * math.sin(lat2_rad)
        )
        
        # Convert back to degrees
        new_lat = math.degrees(lat2_rad)
        new_lon = math.degrees(lon2_rad)
        
        # Create point dictionary
        point = {
            'latitude': round(new_lat, 8),
            'longitude': round(new_lon, 8),
            'location': {
                'type': 'Point',
                'coordinates': [round(new_lat, 8), round(new_lon, 8)]
            }
        }
        
        points.append(point)
    
    return points

# Generate 15 points within 2 miles of (41.906255, -87.69942)
center_lat = 41.906255
center_lon = -87.69942
points = generate_points_near_center(center_lat, center_lon, 2.0, 100)

# Print the array
print("points = [")
for i, point in enumerate(points):
    if i == len(points) - 1:
        print(f"    {point}")
    else:
        print(f"    {point},")
print("]")

# Also print just the coordinates for verification
print("\nCoordinates for verification:")
for i, point in enumerate(points):
    dist = math.sqrt((point['latitude'] - center_lat)**2 + (point['longitude'] - center_lon)**2) * 69.0  # Rough approximation
    print(f"Point {i+1}: ({point['latitude']}, {point['longitude']}) - approx {dist:.2f} miles")