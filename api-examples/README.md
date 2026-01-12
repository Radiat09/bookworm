# API Examples

This folder contains a few quick curl examples to help you get started while the OpenAPI spec is fleshed out.

## Health

```bash
curl http://localhost:5000/
```

## Search books

```bash
curl "http://localhost:5000/api/v1/book?q=harry&limit=10"
```

## Create book (requires auth + multipart)

```bash
curl -X POST "http://localhost:5000/api/v1/book" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "title=My Book" \
  -F "author=Author Name" \
  -F "cover=@./cover.jpg"
```

## Login (example)

```bash
curl -X POST "http://localhost:5000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme"}'
```
