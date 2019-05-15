FROM node:latest

MAINTAINER Taehyeon Yun <yth0625@gmail.com>
RUN mkdir /home/APP
COPY . /home/APP
WORKDIR /home/APP
RUN npm install
CMD node index.js 