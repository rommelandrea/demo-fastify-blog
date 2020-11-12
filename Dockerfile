FROM node:12-alpine

COPY . .

CMD ["npm", "run", "start"]