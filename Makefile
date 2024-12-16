all:
	make up

build:
	docker-compose -f ./docker-compose.yml --env-file .env build

up:
	docker-compose -f ./docker-compose.yml --env-file .env up --build -d
#	docker exec -it django /bin/bash

down:
	docker-compose -f ./docker-compose.yml --env-file .env down

clean:
	docker-compose -f ./docker-compose.yml --env-file .env down
	docker volume rm $$(docker volume ls -q) || true

fclean:
	docker-compose -f ./docker-compose.yml --env-file .env down
	docker volume rm $$(docker volume ls -q) || true
	docker image rm $$(docker images -aq) || true

re:
	make fclean
	make all

.PHONY: all build up down clean fclean re
