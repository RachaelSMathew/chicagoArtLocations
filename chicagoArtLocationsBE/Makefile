dev:
	pip3 install -r requirements.txt && docker stop $(docker ps -q) && docker system prune -af --volumes && python3 index.py && docker compose up -d

## docker ps -q -- returns a list of all running container ids 
## docker stop $(docker ps -q) -- stops all running containers
## docker system prune -af --volumes -- removes all stopped containers, networks, volumes, and images
## pip install -r requirements.txt (to install all the dependencies)
## python index.py (to get fast api started and server started)
## docker compose up -d (for open search container to start running locally) 

## Reason to use pip3 and python3:
## pip -> system's site-packages folder 
## python -> AWS CLI bundled python version (doesnt have access to site-packages folder)
