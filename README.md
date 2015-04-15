# Activation Service

This service manages nodes and their tokens, and is the companion of mqtt-proxy.

Provides an internal RPC for activating nodes and their tokens.

Database schema can be set up using:

```
  mysql -u... < mysql/table_schema.sql
```

# RPC methods

```
// used by spheres to wait on activation
nodeAwaitingActivation(nodeId, metaData)

// used by the mobile app to claim a node
userClaimingNode(user, nodeId)

// list activated nodes
listUserActivatedNodes(user)

// used by the mobile app to deactivate a node
userDeactivateNode(user, nodeId)

// used by a node to promote a paired node
userPromoteNode(user, siteId, nodeId)

// list user sites
listSites(user)

// get the details for a site
getSite(user, siteId)
```

# Overview

This API manages sites, users and nodes which form the basis of activation for a users spheres.

* *site*, this is a the home or work place, typically comprised of one internal ip network behind a internet router.
* *user*, the user / account that owns the sites and nodes, at the moment just the user's identifier from oauth is stored.
* *node*, the spheramid which is installed in a home.

## Pairing process

1. User authenticates using a mobile device to id.sphere.ninja then sets up a user, default site, and node for the phone.
2. User then uses this phone to pair a sphere with the system, this adds a node, attaches it to the same site as the phone and promotes it to the master of that site.
3. Sphere then connects to the system using the credentials saved during pairing, this includes meta data about the site such as master and a key.

## Un pairing process

1. User deletes the sphere from their app,
1a. Mobile device tells the sphere to reset itself if it is available,
2a. Mobile device then tells the API to remove the node, this also clears the master for that site if it was this node.

## Factory Reset

1. User resets sphere using factory reset process, if possible the s[here tells the API to remove the node, which also clears the master for that site if it was this node.

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

# Licensing

sphere-cloud-rpc-service is licensed under the MIT License. See LICENSE for the full license text.
