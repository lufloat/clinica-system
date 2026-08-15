# Deploy em VPS

Guia da instalação em produção: Docker Compose com Postgres, gunicorn, Nginx e
Caddy (HTTPS automático). Testado ponta a ponta antes de existir servidor —
veja [Testar antes da VPS](#testar-antes-da-vps).

## O que é preciso ter em mãos

- VPS com Ubuntu 24.04, 2 vCPU / 4 GB / 40 GB (mínimo: 1 vCPU / 2 GB + swap)
- Acesso SSH com usuário `sudo`
- Um domínio e acesso ao painel de DNS
- Um e-mail para os avisos do certificado

---

## 1. Preparar o servidor

```bash
# como root, no primeiro acesso
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/

# firewall: só SSH e web
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# desliga login por senha (só chave)
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

> Antes de desligar a senha, **confirme numa segunda janela** que a chave
> funciona. Errar aqui tranca você para fora da máquina.

Docker:

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
```

Se a VPS tiver 2 GB de RAM, crie swap — o build do Vite consome memória e é
morto pelo kernel sem ela:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 2. Apontar o domínio

No painel do registrador, crie um registro **A**:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` (ou `clinica`) | IP da VPS |

Confirme antes de seguir — o Caddy só emite o certificado depois que o
domínio resolve para o servidor:

```bash
dig +short clinica.exemplo.com.br
```

## 3. Configurar

```bash
sudo mkdir -p /opt/clinica-system && sudo chown deploy:deploy /opt/clinica-system
git clone <url-do-repositorio> /opt/clinica-system
cd /opt/clinica-system

cp .env.prod.example .env
nano .env
```

Preencha **todos** os campos vazios. Gere os segredos:

```bash
# SECRET_KEY
docker run --rm python:3.13-slim python -c "import secrets; print(secrets.token_urlsafe(64))"

# DB_PASSWORD
openssl rand -base64 32
```

E ajuste o domínio em três lugares do `.env`: `ALLOWED_HOSTS` (sem esquema),
`FRONTEND_ORIGINS` (com `https://`) e `SITE_ADDRESS` (sem esquema).

## 4. Subir

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

O backend roda `migrate` e `collectstatic` sozinho a cada start. Acompanhe:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

O Caddy emite o certificado no primeiro acesso ao domínio; leva alguns
segundos.

## 5. Criar o primeiro acesso

```bash
docker exec -it clinica-backend-prod python manage.py createsuperuser
```

O login aceita **usuário ou e-mail**, indiferente.

## 6. Backup

```bash
chmod +x scripts/backup.sh
crontab -e
```

Adicione:

```
0 3 * * * /opt/clinica-system/scripts/backup.sh >> /var/log/clinica-backup.log 2>&1
```

Rode uma vez na mão para conferir, e **teste o restore** antes de precisar
dele. O script guarda o dump em `/opt/backups/clinica` — configure a cópia
externa indicada no fim do arquivo, senão o backup morre junto com a VPS.

---

## Atualizar o sistema

```bash
cd /opt/clinica-system
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

O volume do Postgres não é tocado. Como o frontend fixa o endereço da API no
build, qualquer mudança no `VITE_API_URL` exige `--build`.

## Testar antes da VPS

A mesma stack roda na máquina local, sem domínio e sem TLS:

```bash
# um .env com SITE_ADDRESS=http://localhost e ALLOWED_HOSTS=localhost,127.0.0.1
docker compose -f docker-compose.prod.yml up -d --build
```

Acesse `http://localhost`. Ela usa nome de projeto próprio (`clinica-prod`),
então **não conflita** com a stack de desenvolvimento nem compartilha o banco.

Para derrubar: `docker compose -f docker-compose.prod.yml down`
(com `-v` apagaria o banco).

---

## Problemas comuns

| Sintoma | Causa |
|---|---|
| Toda página responde **400** | Domínio fora do `ALLOWED_HOSTS` |
| Frontend abre, mas login dá erro de rede | `FRONTEND_ORIGINS` sem `https://` ou com barra no fim |
| **502** no `/api` | Backend não subiu — veja `docker logs clinica-backend-prod` |
| `/admin` sem CSS | `collectstatic` falhou no start |
| Recarregar `/pacientes` dá **404** | `nginx.conf` não foi para a imagem |
| Certificado não sai | DNS ainda não aponta para o IP, ou porta 443 fechada no firewall |
| Build morre sem mensagem | Falta memória — crie o swap do passo 1 |
