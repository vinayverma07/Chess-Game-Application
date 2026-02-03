<div align="center">

<h1 style="color:#4F46E5;">Real-Time Multiplayer Chess Game</h1>

<p><b style="color:#0F172A;">Full-Stack Web Application </b></p>

<p>
  <img src="https://img.shields.io/badge/Node.js-Backend-green" />
  <img src="https://img.shields.io/badge/Socket.IO-WebSockets-blue" />
  <img src="https://img.shields.io/badge/Domain-Real--Time%20Applications-purple" />
</p>

</div>

---

## Overview

This project is a **real-time, browser-based multiplayer chess application** designed to enable two players to compete live with synchronized gameplay. It leverages **WebSocket-based communication** to ensure instant move updates and seamless game interaction.

The application demonstrates **industry-level full-stack development practices** and is well-suited for **Backend Developer**, **Full-Stack Developer**, and **Software Engineer Intern** roles.

---

## Problem Statement

Traditional turn-based web games often suffer from latency and inconsistent state management. Building a real-time multiplayer game requires robust backend logic, efficient communication protocols, and synchronized client-server interaction.

**Objectives:**

* Enable real-time chess gameplay between two players
* Ensure accurate move validation and turn-based control
* Maintain synchronized board state across clients
* Store and retrieve game history for users

---

## Application Features

* Real-time multiplayer chess gameplay
* Automatic player role assignment (White / Black)
* Spectator support for ongoing matches
* Move validation using standard chess rules
* Game history storage and retrieval
* Room-based matchmaking system

---

## System Architecture

| Layer        | Technology Used               |
|-------------|-------------------------------|
| Frontend    | EJS, HTML, CSS, JavaScript     |
| Backend     | Node.js, Express.js            |
| Real-Time   | Socket.IO (WebSockets)         |
| Game Engine | Chess.js                       |
| Database    | MongoDB, Mongoose              |

---

## Core Functionalities

### 1. Real-Time Communication
* Implemented bidirectional communication using Socket.IO
* Instant move broadcasting and board synchronization

### 2. Game Logic Handling
* Turn management and role enforcement
* Move validation using Chess.js engine
* Game reset and disconnect handling

### 3. Room & Player Management
* Dynamic room creation and joining
* Player and spectator role assignment
* Seamless reconnect and game reset logic

### 4. Game History
* Automatic storage of completed games
* User-specific game history retrieval
* Win, loss, and draw tracking

---

## Technologies Used

| Category       | Tools & Libraries                          |
|---------------|---------------------------------------------|
| Language      | JavaScript                                  |
| Backend       | Node.js, Express.js                         |
| Real-Time     | Socket.IO (WebSockets)                      |
| Game Engine   | Chess.js                                   |
| Database      | MongoDB, Mongoose                           |
| Frontend      | EJS, HTML, CSS                              |
| Tools         | Git, GitHub                                 |

---

## Skills Demonstrated

* Full-Stack Web Development
* Real-Time Communication (WebSockets)
* Backend Game Logic Implementation
* Database Design & Integration
* Event-Driven Programming
* Scalable Application Architecture

---

## How to Run

```bash
git clone https://github.com/vinayverma07/Chess-Game-Application.git
cd Chess-Game-Application
npm install
node app.js
