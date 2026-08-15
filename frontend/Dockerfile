# Build do Vite. O resultado é HTML/CSS/JS estático — o Node não vai para a
# imagem final, que fica com ~50 MB em vez de ~1 GB.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# O Vite fixa as variáveis VITE_* no bundle durante o build, não em tempo de
# execução: mudar o endereço da API depois exige rebuild da imagem.
ARG VITE_API_URL=/api/
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
