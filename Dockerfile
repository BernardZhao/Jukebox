# build stage
FROM golang:alpine AS build-env
RUN ["apk", "--no-cache", "add", "build-base", "git", "bzr", "mercurial", "gcc"]
ADD . /src
RUN cd /src && go build -o .

# final stage
FROM alpine
RUN ["apk", "--no-cache", "add", "python3"]
RUN ["pip3", "install", "youtube-dl"]
# Try to run it so we know it works
RUN youtube-dl --version
WORKDIR /app
COPY --from=build-env /src/Jukebox /app/
ENTRYPOINT ./Jukebox