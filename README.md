# TalkOps Extension: OpenHAB
![Docker Pulls](https://img.shields.io/docker/pulls/bierdok/talkops-extension-openhab)

A TalkOps Extension made to work with [TalkOps](https://link.talkops.app/talkops).

This Extension based on [OpenHAB](https://www.openhab.org/) allows you to **control your smart home by voice in realtime**.

Features:
* Switchs: Check status, turn on/off
* Shutters: Check status, open, close and stop

## Installation Guide

_[TalkOps](https://link.talkops.app/install-talkops) must be installed beforehand._

* [Generate an API token](https://www.openhab.org/docs/configuration/apitokens.html#generate-an-api-token)

## Integration Guide

Add the service and setup the environment variables if needed:

_compose.yml_
``` yml
name: talkops

services:
...
  talkops-extension-openhab:
    image: bierdok/talkops-extension-openhab
    environment:
      BASE_URL: [your-value]
      API_TOKEN: [your-value]
    restart: unless-stopped
```

## Environment Variables

#### BASE_URL

The base URL of your OpenHAB server.
* Possible values: `http://openhab:8080` `https://openhab.mydomain.net`

#### API_TOKEN

The copied API token.

#### AGENT_URLS

A comma-separated list of WebSocket server URLs for real-time communication with specified agents.
* Default value: `ws://talkops`
* Possible values: `ws://talkops1` `ws://talkops2`
