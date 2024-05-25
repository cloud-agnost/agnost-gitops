# Get the base node image from docker hub
FROM node:18.17.1-alpine3.18
# Set the working directory in our docker image, anything that is copied from now on
# from local machine to the image will be moved under '/app' directory in docker image
WORKDIR '/app'
# Copy package.json file from local machine to the image under '/app' directory
COPY ./package.json ./
# Set the node environment variable
ENV NODE_ENV production
# Run npm install to install dependent modules
RUN npm install --omit=dev
# Copy everything to the image under '/app' directory
COPY ./ ./
# This will be the start up command of the docker container, run the development react server
CMD ["node", "--expose-gc", "server"]
