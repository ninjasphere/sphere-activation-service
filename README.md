# Activation Service

This service manages nodes and their tokens, and is the companion of mqtt-proxy.

Provides an internal RPC for activating nodes and their tokens.

Database schema can be set up using:

```
  mysql -u... < mysql/table_schema.sql
```

# docker

Deployment and local testing is done using docker.

To build an image.

```
make build
```

To test locally.

```
make local
```

To deploy 

```
make deploy
```

To point to a docker in a vm use.

```
export DOCKER_ARGS="-H crusty.local:5555"
```
