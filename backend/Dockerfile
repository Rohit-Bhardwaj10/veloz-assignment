FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Apply migrations, seed the database (ignore errors if already seeded), and start the dev server
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run seed || true) && npm run dev"]
