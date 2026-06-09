const fs = require('fs');
let c = fs.readFileSync('C:/nginx/conf/nginx.conf', 'utf8');

c = c.replace(/proxy_pass http:\/\/happylife_api\/api\/;(\r\n|\n)*\s*proxy_http_version 1\.1;(\r\n|\n)*\s*proxy_set_header Upgrade \$http_upgrade;(\r\n|\n)*\s*proxy_set_header Connection 'upgrade';(\r\n|\n)*\s*proxy_set_header Host \$host;/g, `proxy_pass http://myspa_api/api/;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade $http_upgrade;\n            proxy_set_header Connection 'upgrade';\n            proxy_set_header Host $host;`);

c = c.replace(/server \{\s*listen\s*8082;.*?\}\s*\}/s, `server {\n        listen       8082;\n        server_name  localhost;\n\n        location / {\n            proxy_pass http://happylife_client;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade $http_upgrade;\n            proxy_set_header Connection 'upgrade';\n            proxy_set_header Host localhost;\n            proxy_cache_bypass $http_upgrade;\n        }\n\n        location /api/ {\n            proxy_pass http://happylife_api/api/;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade $http_upgrade;\n            proxy_set_header Connection 'upgrade';\n            proxy_set_header Host localhost;\n            proxy_cache_bypass $http_upgrade;\n        }\n    }\n}`);

fs.writeFileSync('C:/nginx/conf/nginx.conf', c);
console.log('Nginx config updated safely');
