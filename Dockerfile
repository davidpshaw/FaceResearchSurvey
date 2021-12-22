FROM node:11

# Create app directory
WORKDIR /upload

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

ENV PORT=4848
EXPOSE 4848
CMD [ "npm", "start", "index.js" ]
