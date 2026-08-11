$VPS_IP = "149.118.62.155"
$USER = "ubuntu"
$KEY_PATH = "C:\Users\editor02\.gemini\antigravity\scratch\ORACLE\phanthemy\ssh-key-2026-06-17.key"
$REMOTE_DIR = "/var/www/wasypro"

Write-Host "Building project locally..." -ForegroundColor Cyan
npm run build

Write-Host "Zipping dist folder..." -ForegroundColor Cyan
Compress-Archive -Path "dist\*" -DestinationPath "dist.zip" -Force

Write-Host "Creating remote directory..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no $USER@$VPS_IP "sudo mkdir -p $REMOTE_DIR && sudo chown -R $USER:$USER $REMOTE_DIR"

Write-Host "Uploading files to VPS..." -ForegroundColor Cyan
scp -i $KEY_PATH -o StrictHostKeyChecking=no dist.zip ${USER}@${VPS_IP}:${REMOTE_DIR}/dist.zip
scp -i $KEY_PATH -o StrictHostKeyChecking=no ecosystem.config.cjs ${USER}@${VPS_IP}:${REMOTE_DIR}/ecosystem.config.cjs
scp -i $KEY_PATH -o StrictHostKeyChecking=no package.json ${USER}@${VPS_IP}:${REMOTE_DIR}/package.json

Write-Host "Extracting and restarting PM2 on VPS..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no $USER@$VPS_IP "cd $REMOTE_DIR && unzip -o dist.zip -d dist && rm dist.zip && npm install serve && pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs && pm2 save"

Write-Host "Cleaning up local zip..." -ForegroundColor Cyan
Remove-Item dist.zip

Write-Host "Deploy complete!" -ForegroundColor Green
