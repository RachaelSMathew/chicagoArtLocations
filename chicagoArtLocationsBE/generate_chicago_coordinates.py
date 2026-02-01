import random
import json


def generate_chicago_coordinates(count=100):
    """
    Generate coordinates in Chicago with minimal longitude variance but varied latitude.
    Returns list of dictionaries in the specified format.
    """
    coordinates = []

    # Chicago approximate bounds
    # Latitude: 41.6 to 42.0 (North-South range)
    # Longitude: -87.9 to -87.5 (East-West range, but we'll keep tight)

    base_latitude = 41.8781  # Chicago center latitude
    base_longitude = -87.6298  # Chicago center longitude

    for i in range(count):
        # Vary latitude more (±0.1 degrees ≈ ±7 miles)
        latitude = base_latitude + random.uniform(-0.01, 0.01)

        # Keep longitude very tight (±0.01 degrees ≈ ±0.5 miles)
        longitude = base_longitude + random.uniform(-0.1, 0.1)

        coord_dict = {
            "latitude": round(latitude, 8),
            "longitude": round(longitude, 8),
            "location": {
                "type": "Point",
                "coordinates": [round(latitude, 8), round(longitude, 8)],
            },
        }
        coordinates.append(coord_dict)

    return coordinates


if __name__ == "__main__":
    # Generate 100 coordinates
    chicago_coords = generate_chicago_coordinates(100)

    # Save to file
    with open("chicago_coordinates_longitude_variance.json", "w") as f:
        json.dump(chicago_coords, f, indent=2)

    # Print first 5 as example
    print("Generated 5 sample coordinates:")
    for i, coord in enumerate(chicago_coords[:5]):
        print(f"{i+1}: {coord}")

    print(f"\nTotal coordinates generated: {len(chicago_coords)}")
    print("Saved to: chicago_coordinates.json")
