PROJECT ?= sphere-activation-service
EB_BUCKET ?= ninjablocks-sphere-docker

APP_NAME ?= sphere-activation-service
APP_ENV ?= sphere-activation-prod
CONFIG ?= configs/options.sphere.mine.js

SHA1 := $(shell git rev-parse --short HEAD | tr -d "\n")

DOCKERRUN_FILE := Dockerrun.aws.json
APP_FILE := ${SHA1}.zip

build:
	docker build -t "ninjasphere/${PROJECT}:${SHA1}" .

push:
	docker push "ninjasphere/${PROJECT}:${SHA1}"

local:
	docker run -t -i --rm --name ninja-activation --link ninja-redis:redis --link ninja-mysql:mysql --link ninja-rabbit:rabbitmq -e "DEBUG=*" -e "USVC_CONFIG_ENV=docker" -e "NODE_ENV=development" -p 5100:5100 -t "ninjasphere/${PROJECT}:${SHA1}"

deploy:
	sed "s/<TAG>/${SHA1}/" < Dockerrun.aws.json.template > ${DOCKERRUN_FILE}
	zip -r ${APP_FILE} ${DOCKERRUN_FILE} .ebextensions

	aws s3 cp ${APP_FILE} s3://${EB_BUCKET}/${APP_ENV}/${APP_FILE}

	aws elasticbeanstalk create-application-version --application-name ${APP_NAME} \
	   --version-label ${SHA1} --source-bundle S3Bucket=${EB_BUCKET},S3Key=${APP_ENV}/${APP_FILE}

	# # Update Elastic Beanstalk environment to new version
	aws elasticbeanstalk update-environment --environment-name ${APP_ENV} \
	    --version-label ${SHA1}
clean:
	rm *.zip || true
	rm ${DOCKERRUN_FILE} || true

.PHONY: all build push local deploy clean
