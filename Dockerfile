# build stage
FROM golang:alpine AS build-env
COPY . /src
RUN cd /src && go build -o .

# final stage
FROM python:alpine
RUN ["pip3", "install", "youtube-dl"]
# Test youtube-dl
RUN ["youtube-dl", "--version"]
WORKDIR /app
COPY dist ./dist
COPY --from=build-env /src/Jukebox /app/
ENTRYPOINT [ "./Jukebox" ]
