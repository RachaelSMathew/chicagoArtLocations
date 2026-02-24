## Pipeline
1. Render taking the [chicago coordiates json](https://data.cityofchicago.org/resource/we8h-apcf.json) and converting to a KD Tree and stores it
2. KD Tree: finds the n closest locations to the current location with a minimum distance of minDistance 
3. In Development env: Opensearch is __only used locally__ ([why?](https://github.com/RachaelSMathew/chicagoArtLocations/blob/main/chicagoArtLocationsBE/README.md#why-im-using-opensearch-locally-only)) to do advanced search of the description, artists name, location etc.
4. In Prod env: Basic search is used which involves searching for the query within the concatenated version of mural fields.
5. If you click on a map marker or a search result --> Exact search is used to find results whose artwork_title field match the query (this is done in both [prod](https://github.com/RachaelSMathew/chicagoArtLocations/blob/main/chicagoArtLocationsBE/index.py#L76-L79) and [dev](https://github.com/RachaelSMathew/chicagoArtLocations/blob/main/chicagoArtLocationsBE/opensearch.py#L88-L90))

### If OpenSearch has vector search, why not use that instead of a KD Tree?
- wanted to challenge myself with a new data structure
- opensearch's vector search uses [L2 Euclidean distance](https://docs.opensearch.org/latest/vector-search/getting-started/index/#step-1-create-a-vector-index) and not haversine distance
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

## How to make KD Tree more accurate and faster
**Note**: KD Trees guarantee they will return the K closest points to the query point, but <ins>will not guarantee that those K points will be returned in order</ins> 

Want to test accuracy of my KDTree?: command `pytest` in root directory will run `chicagoArtLocationsBE/test_material/kd_tree_validity_test.py`

- [x] split on axis that has more variance
    - this results in better spatial partioning, and the tree will be more balanced
    - this is being done using the [whichAxisShouldSplitBeDone function](https://github.com/RachaelSMathew/chicagoArtLocations/blob/main/chicagoArtLocationsBE/CoreKDFunctions.py#L19)

- [ ] using a bucket pr KD tree (i.e., [an rednaxela tree](https://gitlab.com/agschultz/robocode-knn-benchmark/-/blob/master/ags/utils/dataStructures/trees/thirdGenKD/KdTree.java?ref_type=heads) where only leaf nodes store data) 

## Making search in OpenSearch case-insensitive 

#### Analysis during index time:

Happens when a field is mapped as text in OpenSearch:

```
{
  "mappings": {
    "properties": {
      "product_name": {
        "type": "text"
      }
    }
  }
}
```

Standard analysis (default analyzer) makes the text in the document case insensitive (lowercased)
  --> when you do match or query_string against the text field, it's analyzed as lowercase

#### Analysis during query time: 

`("analyzer": "standard”)` in the query **but** lower performance
```
{
  "query": {
    "query_string": {
      "query": "BlUe ShOeS",
      "analyzer": "standard"
    }
  }
}
```

## Hybrid search in OpenSearch and issues with memory when doing automated function from python cliet 
Goal: combining keyword search with semantic search (i.e., comparing embeddings)

I was initially wanting to automate the process of creating the index, the search pipeline, the ingest pipeline(see index.py) but that kept on causing OOM errors and `Connection refused errors`

`opensearchpy.exceptions.ConnectionError: ConnectionError(<urllib3.connection.HTTPSConnection object at 0x150d4a150>: Failed to establish a new connection`

I kept getting `opensearchpy.exceptions.TransportError: TransportError(429, 'circuit_breaking_exception', 'Memory Circuit Breaker is open, please check your resources!’)`

Solution: Timing issue, add sleep intervals between each function!

### My old Python client approach (simultaneous pressure):
Time 0s: OpenSearch starts up

Time 5s: Python client connects + model download starts + pipeline creation attempts

Time 6s: CIRCUIT BREAKER TRIPS (too much simultaneous pressure)

<img width="584" height="273" alt="Screenshot 2026-02-23 at 11 05 34 PM" src="https://github.com/user-attachments/assets/dd7ded42-11ff-45ce-942b-8d9235676da1" />

### Dashboards approach (sequential pressure):
Time 0s: OpenSearch starts up  

Time 30s: You manually register model (completes)

Time 60s: You manually create pipeline (completes) 

Time 90s: You manually create index (completes)

#### No circuit breaker because each operation finishes before next starts

**So the ML operations DO cause circuit breaker errors - the manual approach just avoids the simultaneous memory pressure that makes your Python client fail.**

Requests in Opensearch Dashboard API:
- Dashboards container has its own memory allocation
- Direct API calls avoid the Python client's memory overhead
- Model loading happens in the OpenSearch JVM, not your Python process

What happens when you send automated requests from your python client to opensearch:
- Python client sends small JSON request to OpenSearch
- OpenSearch downloads the 400MB model from HuggingFace into its own JVM memory
- OpenSearch loads the model into memory
- Python client just gets back a model ID

## Why I'm using OpenSearch locally only: the bill

<img width="1149" height="450" alt="Screenshot 2026-01-20 at 11 59 07 PM" src="https://github.com/user-attachments/assets/c1b94a43-30c3-433c-8446-43e3a6c6608f" />

**Open search domain service** relies on instance types, storage, and ocu :(

<img width="279" height="362" alt="Screenshot 2026-01-22 at 10 36 17 PM" src="https://github.com/user-attachments/assets/4275de95-723e-4455-b8f5-779a94088763" /><img width="280" height="324" alt="Screenshot 2026-01-21 at 12 11 56 AM" src="https://github.com/user-attachments/assets/01bbef31-58ef-4c96-affe-67678b28543e" /><img width="286" height="361" alt="Screenshot 2026-01-21 at 5 39 52 PM" src="https://github.com/user-attachments/assets/1dcc3296-18ea-44b1-b81b-e02372a9f87d" />

#### [How AWS Serverless Pricing Works](https://aws.amazon.com/opensearch-service/pricing/)

<img width="438" height="443" alt="Screenshot 2026-02-14 at 4 42 18 PM" src="https://github.com/user-attachments/assets/993ff50e-6ced-4d0e-8bd2-7e29c751935b" />
<img width="1253" height="232" alt="Screenshot 2026-02-14 at 4 45 14 PM" src="https://github.com/user-attachments/assets/72b329ab-2f53-4f3a-9de6-8a8ae4f8c43d" />


#### How I set up OpenSearch Collections settings: 

<img width="932" height="673" alt="Screenshot 2026-01-20 at 11 53 25 PM" src="https://github.com/user-attachments/assets/580e8612-80a9-4971-8268-c6b9e4183f8c" />

<img width="1440" height="665" alt="Screenshot 2026-01-20 at 11 52 42 PM" src="https://github.com/user-attachments/assets/31d48fe6-0dcb-4338-a1f0-493e1052566e" />
<img width="1440" height="679" alt="Screenshot 2026-01-20 at 11 52 35 PM" src="https://github.com/user-attachments/assets/0dce3321-d4b0-4634-8c4d-41d82d0e61b7" />
<img width="1440" height="755" alt="Screenshot 2026-01-20 at 11 52 29 PM" src="https://github.com/user-attachments/assets/615fccd6-31f5-4850-aa6d-6c102935c8e2" />


Chicago-art data access policy for open search collection:
```
[
  {
    "Rules": [
      {
        "Resource": [
          "collection/chicago-art-installations"
        ],
        "Permission": [
          "aoss:CreateCollectionItems",
          "aoss:DeleteCollectionItems",
          "aoss:UpdateCollectionItems",
          "aoss:DescribeCollectionItems"
        ],
        "ResourceType": "collection"
      }
    ],
    "Principal": [
      "arn:aws:iam::115044045238:user/RachaelMathewOpenSearchAllAccess"
    ],
    "Description": "ChicagoArtAllowFullAccess_collection"
  },
  {
    "Rules": [
      {
        "Resource": [
          "index/chicago-art-installations/*"
        ],
        "Permission": [
          "aoss:CreateIndex",
          "aoss:DeleteIndex",
          "aoss:UpdateIndex",
          "aoss:DescribeIndex",
          "aoss:ReadDocument",
          "aoss:WriteDocument"
        ],
        "ResourceType": "index"
      }
    ],
    "Principal": [
      "arn:aws:iam::115044045238:user/RachaelMathewOpenSearchAllAccess"
    ],
    "Description": "ChicagoArtAllowFullAccess_index"
  }
]
```

# Example of a data point being stored in KDTree

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
