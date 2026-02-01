dev:
	pip3 install -r chicagoArtLocationsBE/requirements.txt && python3 chicagoArtLocationsBE/index.py && docker compose up -d

## pip install -r requirements.txt (to install all the dependencies)
## python index.py (to get fast api started and server started)
## docker compose up -d (for open search container to start running locally) 