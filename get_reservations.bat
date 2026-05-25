@echo off
curl -s -X POST http://localhost:300/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"123456\"}" > admin_token.json
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('admin_token.json'));console.log(d.data.token);" > token.txt
set /p TOKEN=<token.txt
curl -s "http://localhost:300/api/v1/reservations" -H "Authorization: Bearer %TOKEN%"