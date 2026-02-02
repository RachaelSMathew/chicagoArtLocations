## Pipeline
1. Render taking the chicago coordiates json and converting to a KD Tree and stores it 
2. Opensearch is locally used to do advanced search of the description, artists name, location etc.

### If opensearch has vector search, why not use that instead of a KD Tree?
- wanted to challenge myself with a new data structure
- opensearch's vector search uses L2 Euclidean distance and not haversine distance
- opensearch uses KNN search --> KD tree search is faster for lower-dimensional data

<img width="413" height="187" alt="Screenshot 2026-02-01 at 9 38 27 PM" src="https://github.com/user-attachments/assets/9423ab95-1ffe-431d-83d5-4cb97695c4a9" />

## Render
- using FREE tier --> web service instance spins down after 15 min. of inactivity
- When you push to GitHub and render starts deploying, it runs through your GitHub workflow
  - (e.g. if you specify requirements.txt installation and python3 index.py in the GitHub workflow, it will show in render)
  - KD tree is not created on every API GET Request 
<img width="437" height="776" alt="Screenshot 2026-01-18 at 8 53 31 PM" src="https://github.com/user-attachments/assets/d1f597dd-dfd8-4d12-9125-21f3357f6a35" />
<img width="411" height="406" alt="Screenshot 2026-01-18 at 11 22 03 PM" src="https://github.com/user-attachments/assets/54c8e907-0063-44fd-a69a-0fe0d6215031" />

How Render accesses env variables: in UI settings
<img width="1396" height="654" alt="Screenshot 2026-01-19 at 1 22 35 AM" src="https://github.com/user-attachments/assets/558ef90d-4bca-4af5-b27b-928e7a3e208a" />

How GitHub accesses env variables:
In repo secrets and defining env variables in the GitHub workflow yml file 

<img width="584" height="424" alt="Screenshot 2026-01-19 at 1 21 25 AM" src="https://github.com/user-attachments/assets/86a94ce3-b951-4236-8418-759d9eaa3f13" />

## How to make KD Tree more faster
- split on axis that has more variance --> better spatial partioning and tree will be more balanced
- something for the future: usig a bucket pr kd tree

## OpenSearch Query and indexing:

Making search case-insensitive 
{
  "mappings": {
    "properties": {
      "product_name": {
        "type": "text"
      }
    }
  }
}

When field is mapped as text in open search, it undergoes analysis during index time —> standard analysis makes the text in document case insensitive (lowercased) so when you do match or query_string against the text field —> it is analyzed (i.e., lowercased)
indexed data and the query string are lowercased during analysis

If you want to ensure the case insensitiveness at query time do this
("analyzer": "standard”) —> but will get lower performance 
{
  "query": {
    "query_string": {
      "query": "BlUe ShOeS",
      "analyzer": "standard"
    }
  }
}

# getClosestLocations
<img width="395" height="401" alt="Screenshot 2025-12-30 at 12 34 22 AM" src="https://github.com/user-attachments/assets/b01c57da-fc71-4d5f-8f27-5d2bb459b84d" />

Example of point data being stored in KDTree:
```
{
  'mural_registration_id': '19117',
  'artist_credit': 'Chris Silva with Yollocalli',
  'artwork_title': 'Flight Patterns',
  'media': 'spray',
  'year_installed': '2018',
  'location_description': 'Lakeview Low Line',
  'street_address': '3410 N Southport Ave',
  'zip': '60657',
  'ward': '44',
  'affiliated_or_commissioning': 'Yollocalli Arts Reach',
  'description_of_artwork': 'Flight Patterns was done in collaboration with young Artists from Yollocalli Arts Reach. Our Yollocalli team created stencil designs, assisted in making on the fly color decisions, and helped to get everything painted while amping up the overall enjoyment factor of producing this vibrant piece of public art.',
  'community_areas': '57',
  'latitude': 41.94375528,
  'longitude': -87.66407359,
  'location': {
    'type': 'Point',
    'coordinates': [-87.66407359, 41.94375528]
  }
}
```
