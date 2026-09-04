# Docker

- Docker Compose is the standard local environment; preserve `docker compose up --build`.
- Update documentation when services, ports, or environment variables change.
- Never bake secrets into images, and maintain appropriate `.dockerignore` files.
- Preserve PostgreSQL data with a named volume.
- Never delete volumes unless the human explicitly requests it.
