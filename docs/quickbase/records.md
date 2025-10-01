# Quickbase Records

## Query Patterns
- Select by fid filters
- Pagination & sort
- Use `POST /v1/records/query` for all record retrieval
- Use `{rid.EX.'recordId'}` for record ID queries
- Use `{fid.EX.'value'}` for field value queries

## Record Operations
- **Get Record**: Use `POST /v1/records/query` with `{rid.EX.'recordId'}` where clause
- **Delete Record**: Use `DELETE /v1/records` with `{from, where}` body
- **Create Record**: Use `POST /v1/records` with `{to, data}` body
- **Update Record**: Use `POST /v1/records` with `{to, data: [{rid, ...fields}]}` body

## Upsert
- Merge by key fid

## Bulk Ops
- Batch create/update/delete

## Examples
```json
// Get single record by ID
{
  "from": "tableId",
  "select": [1, 2, 3],
  "where": "{rid.EX.'123'}",
  "options": { "top": 1 }
}

// Delete record by ID
{
  "from": "tableId", 
  "where": "{rid.EX.'123'}"
}

// Query by field value
{
  "from": "tableId",
  "select": [1, 2, 3],
  "where": "{148.EX.'+1234567890'}",
  "options": { "top": 1 }
}
```
