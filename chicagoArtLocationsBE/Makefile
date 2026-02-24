dev:
	pip3 install -r requirements.txt && docker compose down && docker volume rm chicagoartlocationsbe_opensearch-data1 chicagoartlocationsbe_opensearch-data2 && docker stop $$(docker ps -q) 2>/dev/null || true && docker system prune -af --volumes && docker compose up -d 

## docker system prune --volumes only removes unnamed volumes
## 2>/dev/null || true -- suppresses the error when no containers are running
## docker ps -q -- returns a list of all running container ids 
## docker stop $(docker ps -q) -- stops all running containers
## docker system prune -af --volumes -- removes all stopped containers, networks, volumes, and images
## pip install -r requirements.txt (to install all the dependencies)
## python index.py (to get fast api started and server started)
## docker compose up -d (for open search container to start running locally) 

## Reason to use pip3 and python3:
## pip -> system's site-packages folder 
## python -> AWS CLI bundled python version (doesnt have access to site-packages folder)
