from opensearchpy import OpenSearch, RequestsHttpConnection
from opensearch_py_ml.ml_commons import MLCommonClient

index_name = "chicago_art_installations"
model_id = "MSJxd54BZIOukBdnJyJs"

client = OpenSearch(
    hosts=[{"host": "localhost", "port": 9200}],
    http_auth=("admin", "StrongPassword123!"),  # Use correct password
    use_ssl=False,  # Disable SSL - use HTTP
    verify_certs=False,  # Don't verify certs for local dev
    ssl_assert_hostname=False,
    ssl_show_warn=False,
    connection_class=None,
    timeout=60,
)

# Initialize the ML client
ml_client = MLCommonClient(client)


def registerModel():
    global model_id

    # --- 3. Register the model first ---
    try:
        model_id = ml_client.register_pretrained_model(
            model_name="huggingface/sentence-transformers/all-MiniLM-L6-v2",
            model_format="TORCH_SCRIPT",
            model_version="1.0.2",
            deploy_model=False,  # Don't auto-deploy
        )
        print(f"Model was registered successfully. Model Id: {model_id}")

        # --- 4. Deploy the model manually ---
        try:
            task_id = ml_client.deploy_model(model_id)
            print(f"Model deployment started. Task ID: {task_id}")
        except Exception as deploy_error:
            print(f"Model deployment failed: {deploy_error}")

    except Exception as e:
        print(f"An error occurred during model registration: {e}")


def createIngestPipeline():
    global model_id
    pipeline_body = {
        "description": "A text embedding pipeline",
        "processors": [
            {
                "text_embedding": {
                    "model_id": model_id,
                    "field_map": {
                        "description_of_artwork": "description_embedding",
                        "artwork_title": "title_embedding",
                    },
                }
            }
        ],
    }
    pipeline_name = "art_ingest_pipeline"
    client.ingest.put_pipeline(id=pipeline_name, body=pipeline_body)


def createSearchPipeline():
    pipeline_body = {
        "description": "Post processor for hybrid search",
        "phase_results_processors": [
            {
                "normalization-processor": {
                    "normalization": {"technique": "min_max"},
                    "combination": {
                        "technique": "arithmetic_mean",
                        "parameters": {"weights": [0.8, 0.2]},
                    },
                }
            }
        ],
    }

    pipeline_name = "art_search_pipeline"

    client.transport.perform_request(
        method="PUT",
        url=f"/_search/pipeline/{pipeline_name}",
        body=pipeline_body,
    )


def createIndex():
    global index_name
    index_body = {
        "settings": {
            "number_of_shards": 1,
            "default_pipeline": "art_ingest_pipeline",
            "number_of_replicas": 0,
            "index.knn": True,
        },
        "mappings": {
            "properties": {
                "artwork_title": {"type": "text"},
                "description_of_artwork": {"type": "text"},
                "street_address": {"type": "text"},
                "media": {"type": "text"},
                "affiliated_or_commissioning": {"type": "text"},
                "year_installed": {"type": "text"},
                "artist_credit": {"type": "text"},
                "location_description": {"type": "text"},
                "latitude": {"type": "float"},
                "longitude": {"type": "float"},
                "title_embedding": {
                    "type": "knn_vector",
                    "dimension": 384,
                    "space_type": "l2",
                    "method": {
                        "engine": "lucene",
                        "space_type": "l2",
                        "name": "hnsw",
                        "parameters": {},
                    },
                },
                "description_embedding": {
                    "type": "knn_vector",
                    "dimension": 384,
                    "space_type": "l2",
                    "method": {
                        "engine": "lucene",
                        "space_type": "l2",
                        "name": "hnsw",
                        "parameters": {},
                    },
                },
            }
        },
    }
    ## check if index already exists
    if client.indices.exists(index=index_name):
        client.indices.delete(index=index_name)
    client.indices.create(index=index_name, body=index_body, ignore=400)


def addResultToIndex(muralCoords):
    global index_name
    for muralCoord in muralCoords:
        document = {
            "artwork_title": muralCoord.get("artwork_title", "untitled"),
            "description_of_artwork": muralCoord.get(
                "description_of_artwork", "untitled"
            ),
            "street_address": muralCoord.get("street_address", ""),
            "media": muralCoord.get("media", ""),
            "affiliated_or_commissioning": muralCoord.get(
                "affiliated_or_commissioning", ""
            ),
            "year_installed": muralCoord.get("year_installed", ""),
            "artist_credit": muralCoord.get("artist_credit", ""),
            "location_description": muralCoord.get("location_description", ""),
            "latitude": muralCoord.get("latitude", None),
            "longitude": muralCoord.get("longitude", None),
            "location": {
                "lat": muralCoord.get("latitude", None),
                "lon": muralCoord.get("longitude", None),
            },
        }
        client.index(
            index=index_name, body=document, id=muralCoord["mural_registration_id"]
        )


def searchIndex(query_string, lat, long, minDistance):
    global model_id
    isExactSearch = False
    if (
        query_string
        and len(query_string) > 1
        and query_string[-1] == '"'
        and query_string[0] == '"'
    ):
        isExactSearch = True
    if isExactSearch:
        query = {
            "query": {"match_phrase": {"artwork_title": query_string.replace('"', "")}}
        }
    else:
        query = {
            "_source": {"exclude": ["title_embedding", "description_embedding"]},
            "query": {
                "hybrid": {
                    "queries": [
                        {
                            "multi_match": {
                                "query": query_string,
                                "type": "best_fields",
                                "operator": "or",
                                "fields": [
                                    "artwork_title^2.0",
                                    "description_of_artwork^1.5",
                                    "street_address^1.1",
                                    "media^1",
                                    "affiliated_or_commissioning^1",
                                    "year_installed^1",
                                    "artist_credit^2",
                                    "location_description^1.0",
                                ],
                            }
                        },
                    ]
                }
            },
            "sort": [{"_score": {"order": "desc"}}],
            "min_score": 0.1,
            "size": 500,
        }
        if minDistance > 0:
            query["post_filter"] = {
                "bool": {
                    "must_not": {
                        "geo_distance": {  ## only supports an upper bound (only returns distances less than minDistance)
                            "distance": str(minDistance) + "mi",
                            "location": {"lat": lat, "lon": long},
                        }
                    }
                }
            }
        if len(query_string) > 0:  ## query_string cannot be empty for a neural query
            query["query"]["hybrid"]["queries"].append(
                {
                    "neural": {
                        "description_embedding": {
                            "query_text": query_string,
                            "model_id": model_id,
                            "k": 50,
                        }
                    }
                }
            )
            query["query"]["hybrid"]["queries"].append(
                {
                    "neural": {
                        "title_embedding": {
                            "query_text": query_string,
                            "model_id": model_id,
                            "k": 50,
                        }
                    }
                }
            )
    try:
        response = client.search(
            body=query,
            index=index_name,
            search_pipeline="art_search_pipeline",
        )
    except Exception as e:
        import json

        print("This is the search error", json.dumps(e.info, indent=2))
    return response
