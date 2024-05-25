# Build Stage
# Use a Node.js base image
FROM node:18.17.1-alpine3.18 as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use yarn)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build your app
RUN npm run build

# Run Stage
# Use an Nginx base image
FROM nginx:alpine

# Copy the built app from the build stage to Nginx's serve directory
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 4000
EXPOSE 4000

# Start Nginx and keep it running
CMD ["nginx", "-g", "daemon off;"]
