#!/bin/bash

PROJECT=sphere-activation-service
EB_BUCKET=ninjablocks-sphere-docker

APP_NAME=sphere-activation-service
APP_ENV=Prod-env

DOCKER_ARGS="-H minotaur.local:5555"
DOCKERRUN_FILE=$SHA1-Dockerrun.aws.json
