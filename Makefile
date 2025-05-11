
# Default compose file if not specified by the command
COMPOSE_FILE_DEV = compose.dev.yaml
# COMPOSE_FILE_PROD = compose.prod.yaml # Assuming you'll have one later

# Variables for service names (matching your docker-compose.yaml)
NEXT_APP_SERVICE = next-app
DB_SERVICE = postgres-db

# Load .env file to make variables available to make itself (optional, but can be useful)
# This line tries to include .env. If .env doesn't exist, it silences the error.
# Docker Compose will also read .env independently.
-include .env
export $(shell sed 's/=.*//' .env) # Exports variables from .env to the environment for make commands

# Define the base compose commands
# Use "docker compose" (with a space) for Docker Compose V2
COMPOSE_DEV = docker compose -f $(COMPOSE_FILE_DEV)
# COMPOSE_PROD = docker compose -f $(COMPOSE_FILE_PROD)

.PHONY: all dev down-dev down-dev-volumes logs-dev logs-db \
        migrate migrate-dev-new migrate-status seed-db \
        exec-next-app exec-db psql \
        build-dev prune-dev \
        lint format test \
		  help

all: dev

# ─── DEVELOPMENT ENVIRONMENT ───────────────────────────────────────────────────
dev: ## Start development environment (builds images if necessary)
	@echo "Starting development environment..."
	$(COMPOSE_DEV) up --build -d

up-dev: dev # Alias for dev

down-dev: ## Stop development environment
	@echo "Stopping development environment..."
	$(COMPOSE_DEV) down

down-dev-volumes: ## Stop development environment and remove volumes
	@echo "Stopping development environment and removing volumes..."
	$(COMPOSE_DEV) down --volumes

restart-dev: ## Restart development services
	$(COMPOSE_DEV) restart

logs-dev: ## Tail logs for all development services
	$(COMPOSE_DEV) logs -f

logs-next-app: ## Tail logs for the next-app service
	$(COMPOSE_DEV) logs -f $(NEXT_APP_SERVICE)

logs-db: ## Tail logs for the database service
	$(COMPOSE_DEV) logs -f $(DB_SERVICE)

build-dev: ## Build or rebuild development images
	@echo "Building development images..."
	$(COMPOSE_DEV) build

prune-dev: ## Remove stopped development containers and unused networks
	@echo "Pruning stopped development containers and unused networks..."
	$(COMPOSE_DEV) down --remove-orphans
	docker network prune -f
	docker container prune -f

# ─── DATABASE (Prisma Migrations for Dev) ──────────────────────────────────────
# Assumes prisma commands are run via npx within the next-app container

migrate: migrate-deploy ## Apply all pending migrations (production-like)
	@echo "Applying all pending migrations..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npx prisma migrate deploy

migrate-dev: ## Apply pending migrations or create new if schema changed (interactive)
	@echo "Running prisma migrate dev (interactive)..."
	$(COMPOSE_DEV) exec -it $(NEXT_APP_SERVICE) npx prisma migrate dev

migrate-dev-new: ## Create a new migration based on schema changes (prompts for name)
	@echo "Creating a new migration (prompts for name)..."
	$(COMPOSE_DEV) exec -it $(NEXT_APP_SERVICE) npx prisma migrate dev --create-only

migrate-reset: ## Reset the development database and apply migrations
	@echo "Resetting development database and applying migrations..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npx prisma migrate reset --force

migrate-status: ## Check the status of migrations
	@echo "Checking migration status..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npx prisma migrate status

generate-prisma: ## Generate Prisma client
	@echo "Generating Prisma client..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npx prisma generate

seed-db:
	@echo "Seeding development database..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npm run db:seed

# ─── EXEC / Shell Access ───────────────────────────────────────────────────────

exec-next-app: ## Execute a shell (sh) in the next-app container
	@echo "Accessing shell in $(NEXT_APP_SERVICE)..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) sh

shell-next-app: exec-next-app # Alias

exec-db: psql ## Connect to PostgreSQL using psql (alias for psql)

psql: ## Connect to PostgreSQL using psql client
	@echo "Connecting to PostgreSQL database '$(POSTGRES_DB)' as user '$(POSTGRES_USER)'..."
	$(COMPOSE_DEV) exec -it $(DB_SERVICE) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

# ─── Quality & Testing (Examples) ──────────────────────────────────────────────
# These assume you have lint, format, test scripts in your next-app's package.json

lint: ## Run linter inside the next-app container
	@echo "Running linter..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npm run lint # or yarn lint

format: ## Run formatter inside the next-app container
	@echo "Running formatter..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npm run format # or yarn format

test: ## Run tests inside the next-app container
	@echo "Running tests..."
	$(COMPOSE_DEV) exec $(NEXT_APP_SERVICE) npm run test # or yarn test

# ─── HELP ───────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
