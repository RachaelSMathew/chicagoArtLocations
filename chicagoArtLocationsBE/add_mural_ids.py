import json

def add_mural_registration_ids(input_file, output_file, start_id=19167):
    """
    Add mural_registration_id to each coordinate dictionary in the JSON file.
    """
    # Read the existing coordinates
    with open(input_file, 'r') as f:
        coordinates = json.load(f)
    
    # Add mural_registration_id to each coordinate
    for i, coord in enumerate(coordinates):
        coord['mural_registration_id'] = str(start_id + i)
    
    # Save the updated coordinates
    with open(output_file, 'w') as f:
        json.dump(coordinates, f, indent=2)
    
    print(f"Added mural_registration_id to {len(coordinates)} coordinates")
    print(f"ID range: {start_id} to {start_id + len(coordinates) - 1}")
    print(f"Saved to: {output_file}")

if __name__ == "__main__":
    input_file = 'chicago_coordinates_within_two_miles.test.json'
    output_file = 'chicago_coordinates_within_two_miles_with_ids.test.json'
    
    add_mural_registration_ids(input_file, output_file, 19167)
