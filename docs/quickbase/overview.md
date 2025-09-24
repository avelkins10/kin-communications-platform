# Quickbase Integration Overview

## Auth
- Header: `QB-Realm-Hostname: <realm>.quickbase.com`
- Header: `Authorization: QB-USER-TOKEN <token>`
- Content-Type: `application/json`

## Core Concepts
- Apps, Tables, Fields (fid), Records (rid)
- REST endpoints for schema, records, files, users

## Environment
- QUICKBASE_REALM_HOST
- QUICKBASE_USER_TOKEN
- QUICKBASE_APP_ID (optional per table docs)
