# Node.js-Based Game "Alias" with Chat and Word Checking

## Table of Contents

1. [Description](#description)
2. [System requirements](#system-requirements)
3. [Base URL](#base-url)
4. [API Documentation](#api-documentation)

   4.1 [User Management](#user-management)

   - User data model.
   - Endpoint **/api/v1/auth/register**
   - Endpoint **/api/v1/auth/login**
   - Endpoint **/api/v1/auth/refresh**
   - Endpoint **/api/v1/auth/logout**
   - Endpoint **/api/v1/users**
   - Endpoint **/api/v1/users/{userId}**
   - Endpoint **/api/v1/users/{userId}/room/join**
   - Endpoint **/api/v1/users/{userId}/room/leave/{roomId}**
   - Endpoint **/api/v1/users/{userId}/team/join/{teamId}**
   - Endpoint **/api/v1/users/{userId}/team/leave/{teamId}**
   - Endpoint **/api/v1/leaderboards**

   4.2 [Room Management](#room-management)

   - Room data model.
   - Endpoint **/api/v1/rooms**
   - Endpoint **/api/v1/rooms/{roomId}**

   4.3 [Team Management](#team-management)

   - Team data model.
   - Endpoint **/api/v1/rooms/{roomId}/teams**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/players**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/roles**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/reset**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/calculate-scores**

   4.4 [Chat Management](#chat-management)

   - Chat data model.
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/chat**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/chats/{chatId}**
   - Endpoint **/api/v1/rooms/{roomId}/teams/{teamId}/chats/{chatId}**

   4.5 [Message Management](#message-management)

   - Message data model.
   - Endpoint
     **/api/v1/rooms/{roomId}/teams/{teamId}/chats/{chatId}/user/{userId}/message**
   - Endpoint
     **/api/v1/rooms/{roomId}/teams/{teamId}/chats/{chatId}/user/{userId}/messages**

   4.6 [Word Management](#word-management)

   - Word data model.
   - Endpoint **POST /api/v1/words**
   - Endpoint **GET /api/v1/words**
   - Endpoint **GET /api/v1/words/:wordId**
   - Endpoint **PATCH /api/v1/words/:wordId**
   - Endpoint **DELETE /api/v1/words/:wordId**
   - Endpoint **POST /api/v1/words/random**
   - Endpoint **POST /api/v1/words/:wordId/check-answer**
   - Endpoint **POST /api/v1/words/:wordId/check-description**

5. [Security](#security)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Future Enhancements](#future-enhancements)

## Description

Alias is a word-guessing game where players form teams. Each team takes turns
where one member describes a word and others guess it. The game includes a chat
for players to communicate and a system to check for similar words.

### Objective

Teams try to guess as many words as possible from their teammates' descriptions.

### Turns

Each turn is timed. Describers cannot use the word or its derivatives.

### Scoring

Points are awarded for each correct guess. Similar words are checked for
validation.

### End Game

The game concludes after a predetermined number of rounds, with the
highest-scoring team winning.

## System Requirements

- **Programming language**: JavaScript, TypeScript
- **Backend**: Node.js framework - Nest.js
- **Frontend framework**: React.js
- **Database**: MongoDB
- **Containerization**: Docker

## Base URL

The base URL for accessing the Game "Alias" with Chat and Word Checking API is:

`http://localhost:8080/api/v1/`

All endpoints for the Game "Alias" API can be accessed through this base URL.

**Example Usage** To make a request to the API, prepend the base URL to the
endpoint path. For instance, to access the registration endpoint:

`GET http://localhost:8080/api/v1/auth/register`

## API Documentation

### User Management

#### 1. User data model

Information about the user.

| Column Name    | Data Type | Description                                  |
| :------------- | :-------- | :------------------------------------------- |
| userId         | ObjectId  | Unique identifier for each user              |
| username       | string    | Username chosen by the user (must be unique) |
| hashedPassword | string    | Hashed password for user authentication      |
| score          | int       | Total points scored by the user in the game  |
| played         | int       | Number of games the user has participated in |
| wins           | int       | Number of games the user has won             |

#### 2. Register a new user

Endpoint

- URL Path: **_/api/v1/auth/register_**
- Description: This endpoint registers a new user. It accepts user details in
  the request body and returns a response indicating the result of the
  registration process.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body must be in JSON format and include the following fields:

- username (string, required): The username of the new user. Must be unique and
  between 3-20 characters;
- password (string, required): The password for the new user. It should meet the
  following security requirements: a minimum length of 8 characters, and must
  include at least one number, one uppercase letter, one lowercase letter, and
  at least one symbol (e.g., !@#$%^&\*).

**Example Request**

Description: A `POST` request to the user registration endpoint. It includes a
JSON payload in the request body with the user's name, and password for
registration.

```

curl -X POST http://localhost:8080/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "username": "Alex",
  "password": "SecurePass!123"
}'

```

**Example Responses**

Status code: **201 Created**

Description: The user has been successfully registered. The response includes a
success message and the data with the userId of the newly created user.

```
{
    "message": "User registered successfully.",
    "data": {
        "userId": "64a0d5fa3b9c680017d68c3s"
    }
}
```

Status code: **400 Bad Request**

Description: The request was invalid because one or more of the provided fields
(username, or password) did not meet the required format or were missing.

```
{
    "message": "All fields are required and must be in a valid format."
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the username is already in use.

```
{
    "message": "Username already in use."
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
registration process.

```
{
    "message": "An unexpected error occurred during registration."
}
```

#### 3. Logs a user into the system

Endpoint

- URL Path: **_/api/v1/auth/login_**
- Description: This endpoint logs a user into the system by validating their
  username and password. Upon successful authentication, the user receives both
  an access token and a refresh token. The access token is used for subsequent
  authenticated requests, while the refresh token is used to obtain a new access
  token when the original expires.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body should be in JSON format and include the following fields:

- username: The user's username;
- password: The user's password.

**Example Request**

Description: A `POST` request to the login endpoint for user authentication. It
includes a JSON payload in the request body with the user's username and
password.

```

curl -X POST http://localhost:8080/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "username": "Alex",
  "password": "SecurePass!123"
}'

```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the login request was successful. The
server responds with a JSON object containing an access token, a refresh token,
and a success message.

```
{
    "message": "User logged successfully.",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiO5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "refresh_token": "d1Gh9zG8eXpz1I2kA6vR"
    }
}
```

Status code: **400 Bad Request**

Description: The provided username or password is missing.

```
{
    "message": "Username and password are required."
}
```

Status code: **401 Unauthorized**

Description: The login request failed due to incorrect username.

```
{
    "message": ""Token not found"
}
```

Description: The login request failed due to incorrect password.

```
{
    "message": "Incorrect username or password."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected condition that prevented it
from processing the request. This issue may occur during token creation or other
parts of the login process, preventing the user from receiving a valid access or
refresh token.

```
{
    "message": "An unexpected error occurred during login."
}
```

#### 4. Refresh user's access token

Endpoint

- URL Path: **_/api/v1/auth/refresh_**
- Description: This endpoint allows a user to obtain a new access token by
  providing a valid refresh token. When the user's access token expires, they
  can use their refresh token to request a new access token without needing to
  log in again. This ensures continued access to the system without frequent
  re-authentication.
- Authentication: This endpoint does not require an access token but does
  require a valid refresh token, which must be provided in the request body.

**Request Body**

The request body should include the refresh token in JSON format.

- refresh_token: The valid refresh token that was previously issued to the user.
  This token will be used to generate a new access token.

**Example Request**

Description: A `POST` request to refresh the user's access token using the
refresh token. The new access token is issued if the refresh token is valid.

```

curl -X POST http://localhost:8080/api/v1/auth/refresh \
-H "Content-Type: application/json" \
-d '{
  "refresh_token": "eyJhbGciOiInR5cCI6IkpXVCJ9.eyJ1c2VMGY0ZmIsImV4cCI6MTcyOTMzNDk2Mn0.M2OwSoTCuivAI2BeS2BLvX1cfw3nc"
}'

```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the refresh request was successful. A
new access token is returned.

```
{
    "message": "Access token updated successfully.",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiO5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQss"
    }
}
```

Status code: **400 Bad Request**

Description: The refresh token is missing or improperly formatted.

```
{
    "message": "Invalid refresh token"
}
```

Status code: **401 Unauthorized**

Description: The provided refresh token is invalid or expired. The user must log
in again to obtain a new token.

```
{
    "message": "Token not found"
}
```

Status code: **500 Internal Server Error**

Description: An unexpected error occurred on the server, possibly during the
token verification or creation process.

```
{
    "message": "An unexpected error occurred while refreshing the token."
}
```

#### 5. Logs a user out of the system

Endpoint

- URL Path: **_/api/v1/auth/logout_**
- Description: This endpoint allows users to log out of the application by
  invalidating the refresh token, and optionally clearing any session data.
  After logging out, the user must authenticate again to access protected
  resources.
- Authentication: Requires the user to provide a valid access token in the
  request headers to authorize the logout operation.

**Request Body**

This endpoint does not require a request body. Logout actions are handled based
on the authenticated user's token.

**Example Request**

Description: A `POST` request to log out the authenticated user. It requires the
user to pass their access token in the request header.

```

curl -X POST http://localhost:8080/api/v1/auth/login \
-H "Authorization: Bearer access_token" \

```

**Example Responses**

Status code: **200 OK**

Description: The logout request was successful. The refresh token is
invalidated, and the user is logged out from the system. The user should delete
any stored tokens.

```
{
    "message: 'User logged out successfully, refresh token deleted."
}
```

Status code: **401 Unauthorized**

Description: The request failed because the access token is missing, invalid, or
expired.

```
{
    "message": "Token not found"
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected error while processing the
logout request. This may happen due to issues during token invalidation or other
server-side problems.

```
{
    "message": "An unexpected error occurred during logout."
}
```

#### 6. Retrieves a list of all users

Endpoint

- URL Path: **_/api/v1/users_**
- Description: This endpoint retrieves a list of all registered users in the
  system. The response includes details for each user.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Example Request**

Description: A `GET` request to retrieve a list of all users.

```

curl -X GET http://localhost:8080/api/v1/users \
-H "Authorization: Bearer access_token" \

```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the request was successful, and the
response contains an array of user objects, or an empty array if no users are
found.

```
[
    {
        "userId": "64a0d5fa3b9c680017d68c3s",
        "username": "Alex",
        "score": 1800,
        "played": 20,
        "wins": 10
    },
    {
        "userId": "64a0d5fa3b9c680017d68c37",
        "username": "JaneDoe",
        "score": 1500,
        "played": 25,
        "wins": 15
    }
]
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform
this operation.

```
{
    "message": "Access denied. Admin privileges required."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected error while processing the
request.

```
{
    "message": "An unexpected error occurred while retrieving the user list."
}
```

#### 7. Retrieve a specific user by ID

Endpoint

- URL Path: **_/api/v1/users/{userId}_**
- Description: This endpoint retrieves the details of a specific user based on
  the provided user ID. It returns user information such as username, score,
  total games played, and wins.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request should include the following path parameter:

- userId: The unique identifier of the user to retrieve.

**Example Request**

Description: A `GET` request to the user details endpoint, including the user's
ID in the URL.

```

curl -X GET http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37 \
-H "Authorization: Bearer access_token" \

```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the request was successful, and the
server returns the requested user details.

```
{
    "userId": "64a0d5fa3b9c680017d68c37",
    "username": "JaneDoe",
    "score": 1800,
    "played": 25,
    "wins": 15
}
```

Status code: **400 Bad Request**

Description: The valid user ID must be provided to proceed.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **404 Not Found**

Description: This status indicates that the specified user ID does not exist in
the system.

```
{
    "message": "User not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "An unexpected error occurred while retrieving the user."
}
```

#### 8. Delete a specific user

Endpoint

- URL Path: **_/api/v1/users/{userId}_**
- Description: This endpoint allows a user to delete their own account. It
  supports both soft and hard deletes.
  - Soft Delete: Marks the user account as inactive by moving it to an archived
    collection.
  - Hard Delete: Permanently removes the user's account and all associated data.
    This action requires special query parameter (hardDelete).
- Authentication: The request must include a valid access token for the
  authenticated user.

**Request Parameter**

The request must include the following path parameter:

- userId: The unique identifier of the user requesting the deletion (the
  logged-in user's ID).

Optional query parameter:

- hardDelete: If set to true, attempts a hard delete (permanent removal of the
  user).

**Example Request**

Description: A `DELETE` request to soft delete the authenticated user’s account.
This request must include an authorization token for the user.

```

curl -X DELETE http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37 \
-H "Authorization: Bearer access_token" \

```

Description: A `DELETE` request to hard delete the authenticated user’s account.

```

curl -X DELETE http://localhost:8080/api/v1/userId/123?hardDelete=true \
-H "Authorization: Bearer access_token" \

```

**Example Responses**

Status Code: **200 OK**

Description: The user account was successfully deleted (soft or hard).

```
{
    "message": "User account permanently deleted."
}
```

```
{
    "message": "User account soft deleted and moved to archive successfully."
}
```

Status Code: **400 Bad Request**

Description: The provided user ID is invalid or missing.

```
{
    "message": "Invalid ObjectId."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: This status indicates that the specified user ID does not exist in
the system.

```
{
    "message": "User not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "An unexpected error occurred while deleting the user's account."
}
```

#### 9. Update a specific user

Endpoint

- URL Path: **_/api/v1/users/{userId}_**
- Description: This endpoint allows an authenticated user to update their
  account details. The fields that can be updated user-specific attributes such
  as username.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameter:

- userId: The unique identifier of the user whose information is being updated.

Request Body:

The request body must include at least one of the following fields to update:

- username: The new, unique username;
- password: The new password.

**Example Request**

Description: A `PUT` request to update the authenticated user's details. Only
the provided fields will be updated.

```
curl -X PUT http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37 \
-H "Authorization: Bearer access_token" \
-d `{
  "username": "Mike",
}`
```

**Example Responses**

Status Code: **200 OK**

Description: This status indicates that the request was successful, and the
user’s information was updated.

```
{
    "userId": "64a0d5fa3b9c680017d68c37",
    "username": "Mike",
    "score": 1500,
    "played": 20,
    "wins": 10
}
```

Status Code: **400 Bad Request**

Description: The request contains invalid or missing data, such as an improperly
formatted field.

```
{
    "message": "At least one field (username or password) is required for update."
}
```

Description: The provided user ID is invalid.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: This status indicates that the specified user ID does not exist in
the system.

```
{
    "message": "User not found."
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the username is already in use.

```
{
    "message": "Username already in use."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "An unexpected error occurred while updating the user."
}
```

#### 10. Add a specific user to a room

Endpoint

- URL Path: **_/api/v1/users/{userId}/room/join_**
- Description: This endpoint allows an authenticated user to join an available game room. If the room reaches its maximum capacity, a new room will be created.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameter:

- userId: The unique identifier of the user to be added to a room.

**Example Request**

Description: A `POST` request to add the user to an available room. If the room reaches maximum capacity, a new room will be created automatically.

```
curl -X PUT http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37/room/join \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The user was successfully added to the room, and the room details are returned.

```
{
    "roomId": "64a0d5fa3b9c680017d68c3e",
    "name": "Room1695558912345",
    "joinedUsers": ["64a0d5fa3b9c680017d68c3e", "64a0d5fa3b9c680017d68c4f"],
    "teams": [],
    "turnTime": 60
}
```

Status Code: **400 Bad Request**

Description: The provided user ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: No available room exists for the user to join.

```
{
    "message": "No available rooms to join."
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the username is already in use.

```
{
    "message": "User is already in the room."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred while adding the user to the room.

```
{
    "message": "Could not add user to room."
}
```

#### 11. Remove a specific user from a room

Endpoint

- URL Path: **_/api/v1/users/{userId}/room/leave/{roomId}_**
- Description: This endpoint allows an authenticated user to leave a specified room.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameters:

- userId: The unique identifier of the user to be removed from the room.
- roomId: The unique identifier of the room from which the user is being removed.

**Example Request**

Description: A `DELETE` request to remove the authenticated user from a specified room.

```
curl -X PUT http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37/room/leave/64a0d5fa3b9c680017d68c3e \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The user was successfully added to the room, and the room details are returned.

```
{
    "roomId": "64a0d5fa3b9c680017d68c3e",
    "name": "Room1695558912345",
    "joinedUsers": ["64a0d5fa3b9c680017d68c3f"],
    "teams": [],
    "turnTime": 60
}
```

Status Code: **400 Bad Request**

Description: The provided userId or roomId is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified room does not exist.

```
{
    "message": "Room does not exist."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred while removing the user from the room.

```
{
    "message": "Could not remove user from a room."
}
```

#### 12. Add a specific user to a team

Endpoint

- URL Path: **_/api/v1/users/{userId}/team/join/{teamId}_**
- Description: This endpoint allows an authenticated user to join a specified team. If the team reaches its maximum capacity, an error will be thrown.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameters:

- userId: The unique identifier of the user to be added to the team.
- teamId: The unique identifier of the team to which the user will be added.

**Example Request**

Description: A `POST` request to add the authenticated user to a specified team.

```
curl -X PUT http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37/team/join/64a0d5fa3b9c680017d68c3e \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The user was successfully added to the team. The response includes a success message, along with the room and team IDs.

```
{
    "message": "Player added to the team successfully.",
    "roomId": "64a0d5fa3b9c680017d68c3d",
    "teamId": "64a0d5fa3b9c680017d68c3e"
}
```

Status Code: **400 Bad Request**

Description: The request contains invalid data or the team is already full.

```
{
    "message": "Invalid ObjectId"
}
```

```
{
    "message": "Team is already full."
}
```

```
{
    "message": "User is already in the team.""
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team does not exist.

```
{
    "message": "Team not found."
}
```

#### 13. Remove a specific user from a team

Endpoint

- URL Path: **_/api/v1/users/{userId}/team/leave/{teamId}_**
- Description: This endpoint allows an authenticated user to leave a specified team. If the user is not a member of the team, an error will be thrown.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameters:

- userId: he unique identifier of the user who wants to leave the team.
- teamId: The unique identifier of the team from which the user will be removed.

**Example Request**

Description: A `DELETE` request to remove the authenticated user from a specified team.

```
curl -X PUT http://localhost:8080/api/v1/users/64a0d5fa3b9c680017d68c37/team/leave/64a0d5fa3b9c680017d68c3e \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The user was successfully removed from the team. The response includes a success message, along with the room and team IDs.

```
{
   "message": "Player removed from the team successfully.",
    "roomId": "64a0d5fa3b9c680017d68c3d",
    "teamId": "64a0d5fa3b9c680017d68c3e"
}
```

Status Code: **400 Bad Request**

Description: The request contains invalid data or the user is not a member of the specified team.

```
{
    "message": "Invalid ObjectId"
}
```

```
{
    "message": "User is not in the team."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team does not exist.

```
{
    "message": "Team not found."
}
```

#### 14. Retrieve leaderboards

Endpoint

- URL Path: **_/api/v1/leaderboard_**
- Description: This endpoint retrieves the top players (10) based on their game
  statistics, including score. The response contains a ranked list of players,
  providing insights into the performance of the best players in the game.
- Authentication: This endpoint does not require authentication. Any user can
  access the leaderboards.

**Example Request**

Description: A `GET` request to retrieve the leaderboard.

```

curl -X GET http://localhost:8080/api/v1/leaderboard \

```

**Example Responses**

Status Code: **200 OK**

Description: This status indicates that the request was successful, and the server returns an array of up to 10 user objects (the leaderboards data), ordered by score in descending order. If no users are found, an empty array is returned.

```
[
    {
        "userId": "64a0d5fa3b9c680017d68c37",
        "username": "Alex",
        "score": 1800,
        "played": 28,
        "wins": 15
    },
    {
        "userId": "64a0d5fa3b9c680017d68c3x",
        "username": "Jane",
        "score": 1500,
        "played": 20,
        "wins": 10
    },
    ...
]
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "An unexpected error occurred while retrieving the leaderboards."
}
```

### Room Management

#### 1. Room data model

Information about the room.

| Column Name  | Data Type  | Description                                              |
| :----------- | :--------- | :------------------------------------------------------- |
| roomId       | ObjectId   | A unique identifier for each room                        |
| name         | string     | The name of the room (must be unique)                    |
| joinedUsers  | ObjectId[] | Array of ids of players currently joined in the room     |
| teams        | ObjectId[] | Array of ids for the teams that are part of the room     |
| turnTime     | int        | The time given for a turn                                |

#### 2. Create a new room

Endpoint

- URL Path: **_/api/v1/rooms_**
- Description: This endpoint creates a new room using the provided room data. It requires details such as the room name and other necessary configurations.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Body**

The request body must be in JSON format and include the following fields:

- name: The name of the room. Must be unique
- teams: The array of created teams.
- turnTime: The time given for a turn.

**Example Request**

Description: A `POST` request to the room creation endpoint. It includes a room
name, an empty array or array of created teams and turn time.

```
curl -X POST http://localhost:8080/api/v1/rooms \
-H "Authorization: Bearer access_token" \
-H "Content-Type: application/json" \
-d '{
  "name": "test_room",
  "teams": [],
  "turnTime": 60
}
```

**Example Responses**

Status code: **201 Created**

Description: This status indicates that the room was successfully created, and the server returns the newly created room details.

```
{
    "name": "test_room",
    "joinedUsers": [],
    "teams": [],
    "turnTime": 60,
    "_id": "670bbb213bcef0e9e1d325c3",
    "createdAt": "2024-10-13T12:20:49.767Z",
    "updatedAt": "2024-10-13T12:20:49.767Z",
}
```

Status code: **400 Bad Request**

Description: The request body must contain valid room data. Ensure all required fields are included.

```
{
    "message": [
        "name should not be empty",
        "each value in teams must be a mongodb id",
        "teams must be an array",
        "turnTime must not be greater than 250",
        "turnTime must not be less than 15",
        "turnTime must be an integer number"
    ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the room name is already in use.

```
{
    "message": "Room with name test_room already exists"
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
creation process.

```
{
    "message": "Could not create room"
}
```

#### 3. Update a specific room by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}_**
- Description: This endpoint updates the details of a specific room based on the provided room ID. It allows for partial updates to the room's information.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following parameter:

- roomId: The unique identifier of the room to update.

**Query Parameter**

- joinedUsers: An array of joined users' IDs.
- name (optional): The name of the room. Must be unique
- teams (optional): The array of created teams.
- turnTime (optional): The time given for a turn.

**Example Request**

Description: A `PATCH` request to update a specific room, including the room ID in the URL and the updated data in the body.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670bbb213bcef0e9e1d325c3 \
-H "Authorization: Bearer access_token" \
-H "Content-Type: application/json" \
-d '{
    "joinedUsers": ["64a0d5fa3b9c680017d68c38", "64a0d5fa3b9c680017d68c56"]
}
```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the room was successfully updated, and the server returns the updated room details.

```
{
    "_id": "670bbb213bcef0e9e1d325c3",
    "name": "test_room",
    "joinedUsers": ["64a0d5fa3b9c680017d68c38", "64a0d5fa3b9c680017d68c56"],
    "teams": ["66fdbf1df0eaf8e493933dfe", "66fdbf1df0eaf8e493933drt", "66fdbf1df0eaf8e493933df7"],
    "turnTime": 60,
    "createdAt": "2024-10-13T12:20:49.767Z",
    "updatedAt": "2024-10-13T12:40:49.767Z",
}
```

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Description: The request body must contain valid room data. Ensure all required fields are correctly formatted.

```
{
    "message": [
        "each value in joinedUsers must be a mongodb id",
        "joinedUsers must be an array",
        "joinedUsers should not be empty"
    ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: This status indicates that the specified room ID does not exist in the system.

```
{
    "message": "Room with ID 64a0d5fa3b9c680017d68c38 not found"
}
```

#### 4. Retrieve all rooms

Endpoint

- URL Path: **_/api/v1/rooms_**
- Description: This endpoint retrieves a list of all rooms in the system, providing details for each room.
- Authentication: This endpoint requires the user to be authenticated with a valid access token.

**Example Request**

Description: A `GET` request to retrieve all rooms.

```
curl -X GET http://localhost:8080/api/v1/rooms \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the request was successful, and the server returns a list of all rooms.

```
{
    [
        {
        "_id": "670bbb1f3bcef0e9e1d325b3",
        "name": "Room1",
        "joinedUsers": [],
        "teams": [
            "670bbb1f3bcef0e9e1d325b5",
            "670bbb1f3bcef0e9e1d325b7"
        ],
        "turnTime": 60,
        "createdAt": "2024-10-13T12:20:47.776Z",
        "updatedAt": "2024-10-13T12:20:47.940Z",
    },
    ...
    ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

#### 5. Retrieve a specific room by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}_**
- Description: This endpoint retrieves the details of a specific room based on the provided room ID. It returns room information.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following parameter:

- roomId: The unique identifier of the room to retrieve.

**Example Request**

Description: A `GET` request to the room details endpoint, including the room's ID in the URL.

```
curl -X GET http://localhost:8080/api/v1/rooms/64a0d5fa3b9c680017d68c37 \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the request was successful, and the server returns the requested room details.

```
{
    "_id": "670bbb1f3bcef0e9e1d325b3",
    "name": "Room1",
    "joinedUsers": [],
    "teams": [
        "670bbb1f3bcef0e9e1d325b5",
        "670bbb1f3bcef0e9e1d325b7"
    ],
    "turnTime": 60,
    "createdAt": "2024-10-13T12:20:47.776Z",
    "updatedAt": "2024-10-13T12:20:47.940Z"
}
```

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: This status indicates that the specified room ID does not exist in the system.

```
{
    "message": "Room with ID 64a0d5fa3b9c680017d68c38 not found"
}
```

#### 6. Delete a specific room by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}_**
- Description: This endpoint deletes a specific room based on the provided room ID. If the room is successfully deleted, no content is returned.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following parameter:

- roomId: The unique identifier of the room to delete.

**Example Request**

Description: A `DELETE` request to the room deletion endpoint, including the room's ID in the URL.

```
curl -X DELETE http://localhost:8080/api/v1/rooms/64a0d5fa3b9c680017d68c37 \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **204 No Content**

Description: This status indicates that the request was successful, and the room has been deleted. No content is returned in the response.

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **404 Not Found**

Description: This status indicates that the specified room ID does not exist in the system.

```
{
    "message": "Room with ID 64a0d5fa3b9c680017d68c37 not found"
}
```

#### 7. Delete all rooms

Endpoint

- URL Path: **_/api/v1/rooms_**
- Description: This endpoint deletes all rooms in the database. It returns a message indicating the result of the deletion operation.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Example Request**

Description: A `DELETE` request to the endpoint for deleting all rooms.

```
curl -X DELETE http://localhost:8080/api/v1/rooms \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the request was successful, and the server returns a message indicating the number of rooms deleted or if no rooms were found.

```
{
    "message": "Successfully deleted 6 rooms."
}
```
```
{
    "message": "No rooms found to delete."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **404 Not Found**

Description: This status indicates that the specified room ID does not exist in the system.

```
{
    "message": "Room with ID 64a0d5fa3b9c680017d68c37 not found"
}
```

### Team Management

#### 1. Team data model

Information about the team.

| Column Name  | Data Type  | Description                                                                 |
| :----------- | :--------- | :-------------------------------------------------------------------------- |
| teamId       | ObjectId   | Unique identifier for each team                                             |
| roomId       | ObjectId   | Unique identifier for the team's room                                       |
| name         | string     | Name of the team                                                            |
| teamScore    | int        | Total points scored by the team during this game                            |
| selectedWord | ObjectId   | Unique identifier for the record of the word to guess                       |
| players      | ObjectId[] | Array of unique identifiers for players on the team                         |
| chatId       | ObjectId   | Unique identifier for the team's chat room                                  |
| describer    | ObjectId   | Unique identifier of the player who describes the word                      |
| description  | string     | Description of the word provided by the describer                           |
| tryedWords   | ObjectId[] | Array of unique identifiers for words attempted by the team during the game |
| teamLeader   | ObjectId   | Unique identifier of the player who makes a word guess                      |
| success      | boolean    | Status indicating if the word was successfully guessed                      |
| answer       | string     | The team's submitted guess                                                  |

#### 2. Add a new team to a room

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams_**
- Description: This endpoint allows the creation of a new team within a specific game room.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameter:

- roomId: The unique identifier of the room where the team will be created.

**Request Body:**

- name (string): The name of the team.
- players (array of strings): An array of player IDs to be added to the team.

**Example Request**

Description: A `POST` request to create a new team in a specific room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670aa84ac626acf113cc3b56/teams \
-H "Authorization: Bearer access_token" \
-H "Content-Type: application/json" \
-d '{
    "name": "Team Avengers",
    "players": ["66fdbf1df0eaf8e493933dfe", "66f8f82f027b5bb2be6d0de9", "66f8f812027b5bb2be6d0de6"]
}'
```

**Example Responses**

Status Code: **200 OK**

Description: The team was successfully created in the specified room, and the team details are returned.

```
{
    "roomId": "670aa84ac626acf113cc3b56",
    "name": "Team Avengers",
    "teamScore": 0,
    "players": [
        "66fdbf1df0eaf8e493933dfe",
        "66f8f82f027b5bb2be6d0de9",
        "66f8f812027b5bb2be6d0de6"
    ],
    "chatId": null,
    "describer": null,
    "description": null,
    "tryedWords": [],
    "teamLeader": null,
    "success": null,
    "answer": null,
}
```

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the username is already in use.

```
{
    "message": "User is already in the room."
}
```

#### 3. Get all teams in a room

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams_**
- Description: This endpoint retrieves a list of all teams in a specified room, sorted by team score in descending order. Optionally, it can also nest the user details for each team.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameter:

- roomId: The unique identifier of the room for which the teams will be retrieved.

**Query Parameter (optional)**

- nestUsers: A boolean flag (true or false). If set to true, it nests the user details (players) within the team objects. Defaults to false.

**Example Request**

Description: A `GET` request to retrieve all teams in the room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670aa84ac626acf113cc3b56/teams \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **200 OK**

Description: A list of all teams in the room, optionally with user details if nestUsers is set to true, or an empty array if no teams are found.

```
[
    {
        "_id": "670aa860c626acf113cc3b58",
        "roomId": "670aa84ac626acf113cc3b56",
        "name": "team1",
        "teamScore": 0,
        "players": [
            "66fdbf1df0eaf8e493933dfe",
            "66f8f82f027b5bb2be6d0de9",
            "66f8f812027b5bb2be6d0de6"
        ],
        "chatId": null,
        "describer": null,
        "description": null,
        "tryedWords": [],
        "teamLeader": null,
        "success": null,
        "answer": null,
    },
    ...
]
```

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

#### 4. Delete all teams from a specific room

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams_**
- Description: This endpoint allows an authenticated user to delete all teams from a specified room. The operation will return the number of teams deleted or indicate if no teams were found.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following path parameter:

- roomId: The unique identifier of the room from which all teams will be deleted.

**Example Request**

Description: A `DELETE` request to remove all teams from the room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670aa84ac626acf113cc3b56/teams \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status code: **200 OK**

Description: All teams were successfully deleted from the room, or no teams were found in the room.

```
{
    "message": "Successfully deleted 3 team(s) from room 670aa84ac626acf113cc3b56."
}
```

```
{
    "message": "No teams found in room 670aa84ac626acf113cc3b56."
}
```

Status Code: **400 Bad Request**

Description: The provided room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

#### 5. Get a specific ream by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}_**
- Description: This endpoint retrieves details about a specific team within a specified room using the team ID and room ID.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team to be retrieved.

**Example Request**

Description: A `GET` request to retrieve details of a specific team in a
specific room.

```
curl -X GET http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The team was successfully found, and the team details are returned.

```
{
    "_id": "670b83a30824fd6e01fe4190",
    "roomId": "670b835b0824fd6e01fe418e",
    "name": "team1",
    "teamScore": 100,
    "players": [
        "66fdbf1df0eaf8e493933dfe",
        "66f8f82f027b5bb2be6d0de9",
        "66f8f812027b5bb2be6d0de6"
    ],
    "chatId": 64a0d5fa3b9c680017d68c4d,
    "describer": 66fdbf1df0eaf8e493933dfe,
    "description": null,
    "tryedWords": [],
    "teamLeader": 66f8f82f027b5bb2be6d0de9,
    "success": null,
    "answer": null,
}
```

Status Code: **400 Bad Request**

Description: The provided team or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team does not exist in the room.

```
{
    "message": ""Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found!!!""
}
```

#### 6. Update a team by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}_**
- Description: This endpoint allows updating specific details of a team within a specified room using the team ID and room ID.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request Parameter**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team to be updated.

**Query Parameter (optional)**

- name: The updated name of the team.
- players: An updated array of player IDs to be added to the team.
- describer: The updated ID of the user who will describe the selected word.
- description: Description of the word provided by the describer.
- teamLeader: The updated ID of the user who will lead the team.
- selectedWord: The updated ID of the word selected for the game.
- tryedWords (array of strings, optional): An updated array of words that have been tried by the team.
- success: A boolean flag (true or false). Status indicating if the word was successfully guessed
- answer: The team's submitted guess.

**Example Request**

Description: A `PUT` request to update a specific team in a specific room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190 \
-H "Authorization: Bearer access_token" \
-H "Content-Type: application/json" \
-d '{
    "name": "Alpha Team Updated",
    "success": true,
    "answer": "town"
}
```

**Example Responses**

Status code: **200 OK**

Description: The team was successfully updated, and the updated team details are returned.

```
{
    "_id": "670b83a30824fd6e01fe4190",
    "roomId": "670b835b0824fd6e01fe418e",
    "name": "Alpha Team Updated",
    "teamScore": 100,
    "players": [
        "66fdbf1df0eaf8e493933dfe",
        "66f8f82f027b5bb2be6d0de9",
        "66f8f812027b5bb2be6d0de6"
    ],
    "chatId": 64a0d5fa3b9c680017d68c4d,
    "describer": 66fdbf1df0eaf8e493933dfe,
    "description": null,
    "tryedWords": [],
    "teamLeader": 66f8f82f027b5bb2be6d0de9,
    "success": true,
    "answer": "town",
}
```

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team does not exist in the room.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found!!!"
}
```

#### 7. Delete a team by ID

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}_**
- Description: This endpoint allows the deletion of a specific team from a room using the team ID and room ID.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team to be deleted.

**Example Request**

Description: A `DELETE` request to remove a specific team from a specific room.

```
curl -X DELETE http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The request was successful, and the team has been deleted.

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted,

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team was not found in the room.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found"
}
```

#### 8. Get all players in a team

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}/players_**
- Description: This endpoint retrieves all players within a specified team in a given room. Players will be returned in descending order based on their score.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team from which players will be retrieved.

**Example Request**

Description: A `GET` request to retrieve all players in the team within room.

```
curl -X GET http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/players \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The list of players in the specified team is returned, sorted by their score in descending order.

```
[
    {
        "userId": "60d5f9a2b0f8b8e17a15f5f3",
        "username": "Alex",
        "score": 3000,
        "played": 30,
        "wins": 20
    },
    {
        "userId": "670b8af60824fd6e01fe4198",
        "username": "Jack",
        "score": 1500,
        "played": 29,
        "wins": 15
    }
]
```

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team cannot be found, or there are no players
associated with the team.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found!!!"
}
```

```
{
    "message": "User not found."
}
```

#### 9. Add a player to a team

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}_**
- Description: This endpoint allows adding a user to a specified team in a given room. If the team is full or the user is already in the team, an appropriate error will be returned.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team to which the player will be added.
- userId: The unique identifier of the user (player) to be added to the team.

**Example Request**

Description: A `POST` request to add a player (specified by userId) to a team in a specific room.

```
curl -X POST http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/players/64a0d5fa3b9c680017d68c45 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status Code: **200 OK**

Description: The player was successfully added to the team.

```
{
    "message": "Player added to the team successfully.",
    "roomId": 670b835b0824fd6e01fe418e,
    "teamId": 670b83a30824fd6e01fe4190,
}
```

Status Code: **400 Bad Request**

Description: The team is already full or the user is already in the team.

```
{
    "message": "Team is already full."
}
```

```
{
    "message": "User 64a0d5fa3b9c680017d68c45 already joined to team",
    "roomId": null,
    "teamId": null,
}
```

Description: The provided user ID, team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team or user was not found.

```
{
    "message": "Team not found."
}
```

#### 10. Remove a player from a team

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}_**
- Description: This endpoint allows removing a player (user) from a specified team in a given room.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team to which the player will be added.
- userId: The unique identifier of the user (player) to be removed from the team.

**Example Request**

Description: A `DELETE` request to remove a player (specified by userId) from a
team in a specific room.

```
curl -X DELETE http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/players/64a0d5fa3b9c680017d68c45 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status Code: **200 OK**

Description: The player was successfully removed from the specified team.

```
{
    "_id": "670b83a30824fd6e01fe4190",
    "roomId": "670b835b0824fd6e01fe418e",
    "name": "TeamTest",
    "teamScore": 0,
    "players": [66fdbf1df0eaf8e493933dfe, 66f8f82f027b5bb2be6d0de9],
    "chatId": 64a0d5fa3b9c680017d68c4d,
    "describer": 66fdbf1df0eaf8e493933dfe,
    "description": null,
    "tryedWords": [],
    "teamLeader": 66f8f82f027b5bb2be6d0de9,
    "success": null,
    "answer": null,
}
```

Status Code: **400 Bad Request**

Description: The provided user ID, team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team was not found.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found"
}
```

#### 11. Define a describer and leader for a round

Endpoint

- URL Path: **_/api/v1/rooms/{roomId}/teams/{teamId}/roles_**
- Description: This endpoint sets the next describer and team leader for a specified team in a room. It cycles through the players in the team to assign these roles in each round:
  - If no describer is currently set (first round), the first player is assigned as the describer, and the second player is assigned as the leader.
  - In subsequent rounds, the next describer and leader are selected cyclically from the list of players.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room containing the team.
- teamId: The unique identifier of the team for which to assign the describer and leader.

**Example Request**

Description: A `PUT` request to set a player (specified by userId) as the
describer in a specific team within a room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/roles \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The describer and leader were successfully assigned for the round.

```
{
    "_id": "670b83a30824fd6e01fe4190",
    "roomId": "670b835b0824fd6e01fe418e",
    "name": "team1",
    "teamScore": 100,
    "players": [
        "66fdbf1df0eaf8e493933dfe",
        "66f8f82f027b5bb2be6d0de9",
        "66f8f812027b5bb2be6d0de6"
    ],
    "chatId": 64a0d5fa3b9c680017d68c4d,
    "describer": 66fdbf1df0eaf8e493933dfe,
    "description": null,
    "tryedWords": [],
    "teamLeader": 66f8f82f027b5bb2be6d0de9,
    "success": null,
    "answer": null,
}
```

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team was not found.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found!!!"
}
```

#### 12. Reset round fields

Endpoint

- URL Path: **\_/api/v1/rooms/{roomId}/teams/{teamId}/reset**
- Description: This endpoint resets the round-specific fields (selectedWord, description, success, answer) to null for a specified team within a room. It ensures that the team is ready for a new round.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room where the team is located.
- teamId: The unique identifier of the team whose round-specific fields are to be reset.

**Example Request**

Description: A `PUT` request to reset the round fields for team within a room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/reset \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The round fields were successfully reset to null.

```
{
    "_id": "670b83a30824fd6e01fe4190",
    "roomId": "670b835b0824fd6e01fe418e",
    "name": "team1",
    "teamScore": 100,
    "selectedWord": null,
    "players": [
        "66fdbf1df0eaf8e493933dfe",
        "66f8f82f027b5bb2be6d0de9",
        "66f8f812027b5bb2be6d0de6"
    ],
    "chatId": 64a0d5fa3b9c680017d68c4d,
    "describer": 66fdbf1df0eaf8e493933dfe,
    "description": null,
    "tryedWords": [64a0d5fa3b9c680017d68c45],
    "teamLeader": 66f8f82f027b5bb2be6d0de9,
    "success": null,
    "answer": null,
}
```

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team was not found.

```
{
    "message": "Team 64a0d5fa3b9c680017d68c4a in room 64a0d5fa3b9c680017d68c3e not found"
}
```

#### 13. Calculate and update scores

Endpoint

- URL Path: **\_/api/v1/rooms/{roomId}/teams/{teamId}/calculate-scores**
- Description: This endpoint calculates and updates the team’s score as well as each player’s score based on the round's result. If the team succeeded in the round, points are awarded to both the team and its players.
- Authentication: This endpoint requires the user to be authenticated with a
  valid access token.

**Request body**

The request must include the following parameters:

- roomId: The unique identifier of the room where the team is located.
- teamId: The unique identifier of the team whose score needs to be calculated.

**Example Request**

Description: A `PUT` request to reset the round fields for team within a room.

```
curl -X PUT http://localhost:8080/api/v1/rooms/670b835b0824fd6e01fe418e/teams/670b83a30824fd6e01fe4190/calculate-scores \
-H "Authorization: Bearer access_token" \
```

**Example Responses**

Status Code: **200 OK**

Description: The scores were successfully updated.

```
{
    "message": "Team and player scores have been successfully updated."
}
```

Description: No score update occurred as the team did not succeed in the round.

```
{
    "message": "No score update as the team did not succeed."
}
```

Status Code: **400 Bad Request**

Description: The provided team ID or room ID is invalid or improperly formatted.

```
{
    "message": "Invalid ObjectId"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid.

```
{
    "message": "Token not found"
}
```

Status Code: **404 Not Found**

Description: The specified team was not found.

```
{
    "message": "Team not found."
}
```

### Word Management

#### 1. Word data model

Information about the word

| Column Name  | Data Type | Description                     |
| :----------- | :-------- | :------------------------------ |
| wordId       | ObjectId  | Unique identifier for each word |
| word         | string    | Word name                       |
| similarWords | string[]  | An array of similar words       |

#### 2. Create a new word

Endpoint

- URL Path: **_/api/v1/words_**
- Description: This endpoint creates a new word. It accepts word details in the
  request body and returns a response indicating the result of the creating
  process.

**Request Body**

The request body must be in JSON format and include the following fields:

- word: (string, required): The name of the new word. Must be unique
- similarWords: (array of strings): An array of similar words

**Example Request**

Description: A `POST` request to the word creation endpoint. It includes a word
name and an array of similar words.

```

curl -X POST http://localhost:8080/api/v1/words \
-H "Content-Type: application/json" \
-d '{
  "word": "apple",
  "similarWords": ["", ""]
}'

```

**Example Responses**

Status code: **201 Created**

Description: The word has been successfully created. The response includes a
success message and the data of the created word.

```
{
    "_id": "12456789",
    "word": "apple",
    "similarWords": ["", ""]
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the word is already in use.

```
{
    "message": "Word already exists."
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
creation process.

```
{
    "message": "An unexpected error occurred during creation."
}
```

#### 3. Get all words

Endpoint

- URL Path: **_/api/v1/words_**
- Description: This endpoint returns all words.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `GET` request to the getting all words endpoint.

```

curl -X GET http://localhost:8080/api/v1/words \
-H "Content-Type: application/json"

```

**Example Responses**

Status code: **200 OK**

Description: The array of words has been successfully returned. The response
includes a success message and the array of words.

```
[
    {
        "_id": "67094a0bb0125c7cc3dbe4f1",
        "word": "bicycle",
        "similarWords": [
            "bike",
            "cycle"
        ],
        "__v": 0
    },
    {
        "_id": "67094a0bb0125c7cc3dbe4f4",
        "word": "garden",
        "similarWords": [
            "lawn",
            "yard"
        ],
        "__v": 0
    }
]
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found",
    "error": "Unauthorized",
    "statusCode": 401
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
getting all words process.

```
{
    "message": "An unexpected error occurred during getting all words."
}
```

#### 4. Get the word by id

Endpoint

- URL Path: **_/api/v1/words/:wordId_**
- Description: This endpoint returns word with the specified id.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `GET` request to the getting word endpoint.

```

curl -X GET http://localhost:8080/api/v1/words/:id \
-H "Content-Type: application/json"

```

**Example Responses**

Status code: **200 OK**

Description: The word has been successfully returned. The response includes a
success message and the data of the word.

```
{
    "_id": "67094a0bb0125c7cc3dbe4f1",
    "word": "bicycle",
    "similarWords": [
        "bike",
        "cycle"
    ],
    "__v": 0
}
```

Status Code: **400 Bad Request**

Description: The provided ID is invalid or missing.

```
{
    "message": "'Invalid word ID format."
}
```

Status Code: **404 Not Found Exception**

Description: Can not found word with provided ID.

```
{
    "message": "Word with ID '${wordId}' not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
getting the word process.

```
{
    "message": "An unexpected error occurred during getting the word."
}
```

#### 5. Update the word

Endpoint

- URL Path: **_/api/v1/words/:wordId_**
- Description: This endpoint returns updated word with the specified id.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body must be in JSON format and include the following fields:

- word: (string, required): The name of the updated word. Must be unique
- similarWords: (array of strings): An array of similar words

**Example Request**

Description: A `PATCH` request to the getting word endpoint.

```

curl -X PATCH http://localhost:8080/api/v1/words/:id \
-H "Content-Type: application/json"
-d '{
  "word": "tie",
  "similarWords": ["", ""]
}'

```

**Example Responses**

Status code: **200 OK**

Description: The word has been successfully updated. The response includes a
success message and the data of the updated word.

```
{
    "word": "updatedWord",
    "similarWords": [
        "updatedSimilar1",
        "updatedSimilar2"
    ]
}
```

Status Code: **400 Bad Request**

Description: The provided ID is invalid or missing. No field was provided to update.

```
{
    "message": "'Invalid word ID format."
}
```

```
{
    "message": "At least one field must be updated."
}
```

Status Code: **404 Not Found Exception**

Description: Can not found word with provided ID.

```
{
    "message": "Word with ID '${wordId}' not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
getting the word process.

```
{
    "message": "An unexpected error occurred during updatting the word."
}
```

#### 6. Delete the word

Endpoint

- URL Path: **_/api/v1/words/:wordId_**
- Description: This endpoint deletes word with the specified id.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `DELETE` request to the deleting word endpoint.

```

curl -X DELETE http://localhost:8080/api/v1/words/:id \
-H "Content-Type: application/json"

```

**Example Responses**

Status code: **204 DELETED**

Description: The word has been successfully deleted. The response includes a
success message

```
{
    "message": "Word successfully deleted.",
}
```

Status Code: **400 Bad Request**

Description: The provided ID is invalid or missing.

```
{
    "message": "'Invalid word ID format."
}
```

Status Code: **404 Not Found Exception**

Description: Can not found word with provided ID.

```
{
    "message": "Word with ID '${wordId}' not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
getting the word process.

```
{
    "message": "An unexpected error occurred during deleting the word."
}
```

#### 7. Get a random word for a team

Endpoint

- URL Path: **_/api/v1/words/random_**
- Description: This endpoint retrieves a random word that has not been used by the team in the specified room. It ensures that only the current describer can request the word.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `POST` request to fetch a random word for the team.

```

curl -X POST http://localhost:8080/api/v1/words/random \
-H "Content-Type: application/json" \
-d '{
  "roomId": "650fae0b8a8b4c1d7b8f12d3",
  "teamId": "650fae0b8a8b4c1d7b8f12e7"
}'
```

**Request Body**

- roomId: (string, required) The ID of the room where the team is located.
- teamId: (string, required) The ID of the team requesting the word.

**Example Responses**

Status code: **200 OK**

Description: A random word has been successfully returned along with the updated list of tried words.

```
{
  "word": {
    "_id": "6510a8c8f1234a6d8a8fefb9",
    "word": "ocean",
    "similarWords": ["sea", "water", "wave"],
    "__v": 0
  },
  "tryedWords": [
    "6510a8c8f1234a6d8a8fefb9"
  ]
}
```

Status Code: **400 Bad Request**

Description: The request body is missing required fields or the provided data is not valid.

```
{
  "message": "Invalid request. Both 'roomId' and 'teamId' are required."
}
```

Status Code: **404 Not Found Exception**

Description: The team was not found, or no unused words are available.

```
{
    "message": "No unused words found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication or the requesting user is not the describer.

```
{
    "message": "Only the describer can get a new word."
}
```

Status code: **500 Internal Server Error**

Description: An unexpected error occurred while trying to retrieve the word.

```
{
    "message": "An unexpected error occurred while fetching the random word."
}
```

#### 8. Check if the provided answer is correct

Endpoint

- URL Path: **_/api/v1/words/
  /check-answer_**
- Description: This endpoint checks if the provided answer matches the word or any of its similar words.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `POST` request to validate a user's answer for a specific word.

```

curl -X POST http://localhost:8080/api/v1/words/6510a8c8f1234a6d8a8fefb9/check-answer \
-H "Content-Type: application/json" \
-d '{
  "answer": "bicycle"
}'
```

**Request Parameters**

- id: (string, required) The ID of the word being checked.

**Request Body**

- answer: (string, required) The user’s answer to be checked.

**Example Responses**

Status code: **200 OK**

Description: The answer was successfully validated. The response indicates whether the answer is correct.

```
{
  "correct": true
}
```

Status Code: **400 Bad Request**

Description: The provided ID is invalid or the request body is missing the answer.

```
{
  "message": "Invalid word ID format or answer is required."
}
```

Status Code: **404 Not Found**

Description: The word with the provided ID was not found.

```
{
  "message": "Word with ID '6510a8c8f1234a6d8a8fefb9' not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid.

```
{
    "message": "Unauthorized access."
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the answer validation process.

```
{
  "message": "An unexpected error occurred while checking the answer."
}
```

#### 9. Check if the provided description is valid

Endpoint

- URL Path: **_/api/v1/words/
  /check-description_**
- Description: This endpoint checks if the provided description does not contain the word or any of its similar words.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A `POST` request to validate a user's description for a specific word.

```
curl -X POST http://localhost:8080/api/v1/words/6510a8c8f1234a6d8a8fefb9/check-description \
-H "Content-Type: application/json" \
-d '{
  "description": "A vehicle with two wheels used for riding."
}'
```

**Request Parameters**

- id: (string, required) The ID of the word being checked.

**Request Body**

- description: (string, required) The description to be validated.

**Example Responses**

Status code: **200 OK**

Description: The description was successfully validated. The response indicates whether the description is valid.

```
{
  "correct": true
}
```

Status Code: **400 Bad Request**

Description: The provided ID is invalid or the request body is missing the description.

```
{
  "message": "Invalid word ID format or description is required."
}
```

Status Code: **404 Not Found**

Description: The word with the provided ID was not found.

```
{
  "message": "Word with ID '6510a8c8f1234a6d8a8fefb9' not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid.

```
{
    "message": "Unauthorized access."
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the description validation process.

```
{
  "message": "An unexpected error occurred while checking the description."
}
```

#### Word Comparison Logic

The `checkAnswer` and `checkDescription` methods use a word comparison function to ensure that the user’s description does not include the target word or any of its similar words. Below is an overview of the compareWords method used in the comparison process:

**Comparison Method Details**

- `Exact Match`:
  The words are first normalized by converting them to lowercase and trimming whitespace. If both words match exactly, the function returns true.

- `Stemming`:
  The method leverages Porter Stemming to compare the root form of both words. If the stemmed versions of the words match, they are considered similar.

- `Levenshtein Distance`:
  The Levenshtein distance measures the number of single-character edits required to change one word into another. A similarity threshold of 0.2 (or 20%) is used to determine if two words are close enough to be considered similar.

### Chat Management

#### 1. Module description

This module provides a real-time chat functionality using WebSockets, powered by Socket.IO. For communication between server and client both of them should use Socket.IO.  The chat supports features such as team-based communication, message broadcasting, and message history saved in DB. 

Server side of module works with ChatGateway which uses messages module.

#### 2. Connection

**Subscribed event:** None

**Description:** Each client connects to WebSocket server initialized on app server start and gets socket id. After session end client disconnects from server.

**Methods:**

- `handleConnection`: Handles user's connection. Logs connected user.
- `handleDisconnect`: Handles user's disconnection. Logs disconnected user.

#### 3. Team join

**Subscribed event:** `joinTeam`

**Description:** When client emits event server joins user to chat with key consisting of room's and team's ID, making it unique for each team in room.

**Received data:** 
- Client 
- Body:
  - `roomId`: string - Id of joined room
  - `teamId`: string - Id of joined team

**Methods:**
- `handleJoinTeam`: Handles user's join to team, joins them to team's chat and makes logs.

#### 4. Message

**Subscribed event:** `sendMessage`

**Emitted event**: `receiveMessage`

**Description:** When client emits `sendMessage` event server gets from it room, team IDs and saves message data. Then server emits `receiveMessage` event and sends saved message to all users in chat.

**Received data:** 
- Client 
- Body:
  - `roomId`: string - Id of joined room
  - `teamId`: string - Id of joined team
  - `userId`: string - Id of message author user
  - `userName`: string - User's name
  - `text`: string - Message's text

**Sent data:** 
- Body:
  - `roomId`: string - Id of joined room
  - `teamId`: string - Id of joined team
  - `userId`: string - Id of message author user
  - `userName`: string - User's name
  - `text`: string - Message's text
  - `timestamp`: Date - Time and date of sending message

**Methods:**
- `handleMessage`: Handles user sending message. Saves message to DB and send to all users in chat.

### Message Management

#### 1. Message data model

The Message collection stores individual messages exchanged in the chat, each
associated with a user who sent the message and the timestamp when the message
was sent.

| Column Name      | Data Type | Description                                      |
| :--------------- | :-------- | :----------------------------------------------- |
| \_id (messageId) | ObjectId  | Unique identifier for each message (Primary Key) |
| userId           | ObjectId  | Reference to the user who sent the message       |
| roomId           | ObjectId  | Reference to room where the message is sent      |
| teamId           | ObjectId  | Reference to team where the message is sent      |
| userName         | string    | Name of the user who sent the message            |
| text             | string    | The content of the message                       |
| timestamp        | Date      | Timestamp for when the message was sent          |

#### 2. GET `GET /api/v1/messages`

Description: Method to retrieve all messages.
Authentication: This endpoint requires the user to be authenticated with a valid
access token.

**Request body**

Empty

**Example Request**

Description: A `GET` request to retrieve all messages.

```
curl -X GET http://localhost:8080/api/v1/messages \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The request was successful, and the response contains all messages
of the requested chat.

```json
{
  [
    {
      "messageId": "messageId1",
      "user": {
        "_id": "user1",
        "username": "user123"
      },
      "text": "Hello!",
      "roomId": "bfdsuf12384fd",
      "teamId": "ni1234jfkds12",
      "timestamp": "2024-09-25T10:05:00Z"
    },
    {
      "messageId": "messageId2",
      "user": {
        "_id": "user2",
        "username": "user456"
      },
      "text": "Hello!",
      "roomId": "bfdsuf12384fd",
      "teamId": "ni1234jfkds12",
      "timestamp": "2024-09-25T10:06:00Z"
    }
  ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required permissions to access the team
in this room.

```
{
    "message": "Access denied. Insufficient permissions."
}
```

Status Code: **404 Not Found**

Description: The specified chat cannot be found.

```
{
    "message": "Chat not found."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected error while processing the
request.

```
{
    "message": "An unexpected error occurred while retrieving the message."
}
```

#### 2. GET `GET /api/v1/messages/{messageId}`

Description: Method to retrieve one message by its id.
Authentication: This endpoint requires the user to be authenticated with a valid
access token.

**Request body**

Empty

**Example Request**

Description: A `GET` request to retrieve all messages.

```
curl -X GET http://localhost:8080/api/v1/messages/messageId1 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The request was successful, and the response contains requested message.

```json
{
  {
      "messageId": "messageId1",
      "user": {
        "_id": "user1",
        "username": "user123"
      },
      "text": "Hello!",
      "roomId": "bfdsuf12384fd",
      "teamId": "ni1234jfkds12",
      "timestamp": "2024-09-25T10:05:00Z"
    }
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required permissions to access the team
in this room.

```
{
    "message": "Access denied. Insufficient permissions."
}
```

Status Code: **404 Not Found**

Description: The specified message cannot be found.

```
{
    "message": "Message not found."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected error while processing the
request.

```
{
    "message": "An unexpected error occurred while retrieving the message."
}
```


#### 2. DELETE `DELETE /api/v1/messages/{messageId}`

Description: Method to delete one message by its id.
Authentication: This endpoint requires the user to be authenticated with a valid
access token.

**Request body**

Empty

**Example Request**

Description: A `DELETE` request to delete 1 message.

```
curl -X DELETE http://localhost:8080/api/v1/messages/messageId1 \
-H "Authorization: Bearer access_token"
```

**Example Responses**

Status code: **200 OK**

Description: The request was successful, and the message was deleted.

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Token not found"
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required permissions to access the message.

```
{
    "message": "Access denied. Insufficient permissions."
}
```

Status Code: **404 Not Found**

Description: The specified message cannot be found.

```
{
    "message": "Message not found."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected error while processing the
request.

```
{
    "message": "An unexpected error occurred while deleting the message."
}
```


## Security

### Server-Side Security

Server-side security is essential for protecting user data and maintaining the integrity of the application. This involves implementing various measures to prevent unauthorized access, data breaches, and malicious attacks. The following features are implemented to ensure a secure environment for users and their data:

- **Authentication & Authorization:** JWT (JSON Web Token) is used to keep sessions secure. When a user logs in, a unique JWT is created, allowing only authenticated users to access specific features;

- **Data Encryption:** Passwords are securely hashed using bcrypt along with a salt to enhance security. A salt is a random value added to the password before hashing, making it resistant to rainbow table attacks. This ensures that even if two users have the same password, their hashes will differ.
During authentication, only the hashed password is compared with the stored hash, never the plain text version.

- **Input Validation & Sanitization:** All user input is validated with specific rules using DTO (Data Transfer Object) validation to prevent NoSQL injection attacks. Global validation only allows expected properties;

- **CORS (Cross-Origin Resource Sharing)**:
  CORS policies are enabled to restrict which domains can access server resources. This mitigates Cross-Origin attacks, allowing only trusted origins to interact with the API;

- **Helmet for HTTP Header Security**:
  The Helmet middleware is used to configure HTTP headers. It prevents vulnerabilities such as clickjacking, MIME sniffing, and reduces the risk of cross-site scripting attacks by setting appropriate security-related headers.

- **Rate Limiting**:
  To mitigate brute-force attacks and prevent DDoS (Distributed Denial of Service) attacks, a Rate Limiting strategy is implemented. The server limits the number of requests from a single IP address in a given time frame, blocking abusive behavior.

- **Database Security:** Safeguards against NoSQL injection are implemented by sanitizing all input queries and performing validation checks. ParseObjectIdPipe is used to ensure only valid MongoDB ObjectId values are processed;

- **Data Protection & Privacy:** User details, especially passwords, are never exposed in responses. Data sent is carefully sanitized to ensure no sensitive information is included;

- **Real-time Chat Security:** All chat features are secured through authenticated Socket connections, ensuring that only authorized users can access chat rooms and keeping conversations safe.

### Client-Side Security

Client-side security is essential for safeguarding user data and ensuring a safe browsing experience. This involves proper handling of sensitive information within the user's browser. To enhance client-side security, the following measure has been implemented:

- **Secure Cookies:** Authentication tokens are stored in secure cookies that have the `httpOnly` and `secure` flags enabled. This setup ensures that tokens are only transmitted over HTTPS connections, which helps reduce the risk of Cross-Site Scripting (XSS) attacks. Additionally, this means that these tokens cannot be accessed by client-side scripts, providing an extra layer of protection for user data.

## Testing

This project has both unit and integration testing implemented to maintain high code quality and reliability.

- **Unit Testing:** Files have extension .spec.ts. One testing file per service or controller.

- **Integration Testing:** Files have extension .integration.spec.ts. One testing file per module.

**Testing commands:**

Before tests use `cd ./alias-chat-game` to navigate to server directory.
- Run tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- Run tests and get coverage: `npm run test:cov`

**Current test coverage**
| File       | % Stmts  | % Branch | % Funcs |  % Lines |
|:-----------|:---------|:---------|:--------|:---------|
| All files  |   87.23  |    72.07 |   86.27 |    86.21 |

## Deployment

Before deploying, ensure that you have the following:

- Node.js and npm installed on the server.
- MongoDB instance set up and accessible.
- Git installed (for cloning the repository).
- Docker installed (for containerized deployment).

#### 1. Clone the repository

```
git clone https://github.com/Aliko-XIII/alias-node-js.git
```

#### 2. Navigate to the project folder

```
cd alias-node-js/alias-chat-game
```

#### 3. Install dependencies

```
npm install
```

#### 4. Set up environment variables

Create a .env file in the root directory of your project and define the necessary environment variables. Refer to .env.example for a sample configuration.

#### 5. Build the application

```
npm run build
```

#### 6. Start the application

```
npm run start
```

#### Docker Deployment:

To run the Alias game in a Docker container:

#### 1. Build and run the application  
Ensure you're in the project directory, then run:

```
docker compose up
```

#### 2. Access the application
Once the containers are running, you can access the API at:

```
http://localhost:8080/api/v1/
```

#### 3. Stop the application
When you’re finished, stop the application and clean up the resources by running:

```
docker compose down
```

## Future Enhancements

As we continue to develop and improve our application, we have identified several key enhancements that will enhance user experience, increase security, and broaden accessibility. These future enhancements will help us meet user needs and keep pace with modern technology trends.

- **Integration with Social Login Providers:**
  To simplify the authentication process for users, we plan to implement social login options, such as Google, Facebook, and GitHub. This enhancement not only makes it easier for users to log in but also improves security by utilizing the multi-factor authentication features provided by these platforms.

- **Multi-language Support in the Chat System:**
  We aim to enhance our chat application by adding multi-language support. This feature will allow users from different regions to communicate more easily, breaking down language barriers. By integrating translation APIs (like Google Translate API or Microsoft Azure Translator), the system can automatically detect the language of messages and translate them into the recipient's preferred language. Users will have the option to select their preferred language during registration or within chat sessions, significantly improving their overall experience.
