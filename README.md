# drawing-game
### Jesse Dijkman

## Assignment
For this course we're going to make a real-time-application, with the use of websockets. The app is going to maintain live connections between the server and clients and enable communication between the clients. To make the use of websockets easier I'm going to use [socket.io](https://socket.io/).

---

## Table of Contents
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Running](#running)
- [Concept](#concept)
  - [Version 1](#version-1)
  - [Version 2](#version-2)
  - [Version 3](#version-3)
- [Data Life Cycle](#data-life-cycle)
- [Process](#process)
- [Code](#code)
- [Sources](#sources)
- [License](#license)

---

## Getting Started
### Installation
- `git@github.com:jesseDijkman1/drawing-game.git`
- `cd drawing-game`
- `npm install`

### Running
`npm start`

---

## Concept
During this course I've been struggling with coming up with a concept. This was mainly due to the fact that I **Had** to implement an API; and not a nonsense API.

### Version 1
On the first day of this course I created a simple drawing app, with a chat ([link](https://github.com/jesseDijkman1/real-time-web-1819/tree/master/chatapp)).

### Version 2
My second idea was to create a platform-shooter ([link](https://github.com/jesseDijkman1/platform-shooter)), which was also doable. I just had trouble with coming up with an API.

### Version 3
During my resits I started with another drawing app, with the idea to use a random-image API. The idea was that you would try to mimic the image with a drawing, and the spectators could choose from 4 images; with the one you're drawing. If someone guessed the correct image you (the drawer) and the winner would get points. Fairly simple, but rather stupid I.M.O. So eventually I found a list with nouns and implemented a different API; (Bad Words Filter)[https://www.neutrinoapi.com/api/bad-word-filter/]. With this API I'm filtering the chat for cursewords.

