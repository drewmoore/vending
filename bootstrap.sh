#!/usr/bin/env bash

sudo apt-get update

sudo apt-get install -y curl
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install -y nodejs

#sudo apt-get install -y npm

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-get update
sudo apt-get install -y mongodb-org

sudo apt-get upgrade
sudo apt-get install -y redis-server

sudo service mongod start

sudo service redis-server


cd /vagrant
sudo npm install
sudo npm install -g mocha


mocha test/ --recursive --reporter nyan

DBNAME='vending' PORT=3000 node app/app.js
