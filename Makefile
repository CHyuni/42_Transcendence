all:
	make up

build:
	docker-compose -f ./docker-compose.yml --env-file .env build

up:
	chmod +x ./setup/setup.sh
	./setup/setup.sh
	docker-compose -f ./docker-compose.yml --env-file .env up --build -d

down:
	docker-compose -f ./docker-compose.yml --env-file .env down

clean:
	docker-compose -f ./docker-compose.yml --env-file .env down
	docker volume rm $$(docker volume ls -q) || true

fclean:
	docker-compose -f ./docker-compose.yml --env-file .env down
	docker rm -f $$(docker ps -a -q) || true
	docker volume rm $$(docker volume ls -q) || true
	docker image rm $$(docker images -aq) || true
	docker network prune -f
	docker system prune -a -f || true
	docker volume prune -f

re:
	make fclean
	make all

.PHONY: all build up down clean fclean re

# DC = docker-compose
# DIR = srcs
# ENV = .env
# NAME = docker-compose.yml

# .PHONY: all up down build clean fclean re

# all: up

# up: build
# 	bash setup.sh
# 	$(DC) -f $(NAME) up -d

# down:
# 	$(DC) -f $(NAME) down

# build:
# 	$(DC) -f $(NAME) build

# clean:
# 	$(DC) -f $(NAME) down --rmi all --volumes --remove-orphans

# fclean: clean

# re: fclean build up
