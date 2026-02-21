dev:
	pip3 install -r requirements.txt && python3 index.py && docker system prune -af && docker volume rm -f && docker compose up -d

## pip install -r requirements.txt (to install all the dependencies)
## python index.py (to get fast api started and server started)
## docker compose up -d (for open search container to start running locally) 

## Reason to use pip3 and python3:
## pip -> system's site-packages folder 
## python -> AWS CLI bundled python version (doesnt have access to site-packages folder)
