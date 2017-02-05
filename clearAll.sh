#!/bin/bash

DIR="$(pwd)"
BC="$DIR/blockchain"
NETWORK_PEER="dev-"
NPM_SCRIPT="start"

clear_all() {
    rm -rf $BC/deployLocal/* 2>/dev/null
    printf "keyValStore removed\n"
    printf "Latest deployed removed\n"
    docker rm -f $(docker ps -a -q) 2>/dev/null
    printf "All docker containers removed\n"
    docker rmi `docker images | grep $NETWORK_PEER | awk '{print $1}'` 2>/dev/null
    printf "All chaincode images removed\n"
    docker rmi $(docker images -qf "dangling=true") 2>/dev/null
    printf "All untagged images removed\n"
}

clear_all
