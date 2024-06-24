# build stage
FROM golang:1.21 AS build

WORKDIR /workspace

COPY . .

RUN go mod download

RUN CGO_ENABLED=0 go build -o webhook -ldflags '-w -extldflags "-static"' .

# final stage
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

COPY --from=build /workspace/webhook /usr/local/bin/webhook

ENTRYPOINT ["webhook"]
