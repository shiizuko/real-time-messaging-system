# Ager - Sistema de Mensagens em Tempo Real

Sistema de mensagens em tempo real construído com Node.js, Next.js, PostgreSQL e Redis.

## Tecnologias

- **Backend**: Node.js com Express
- **Frontend**: Next.js
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Containerização**: Docker
- **Orquestração**: Kubernetes

## Estrutura do Projeto

```
ager/
├── backend/         # Servidor Node.js
├── frontend/        # Aplicação Next.js
├── k8s/            # Configurações Kubernetes
└── docker-compose.yml
```

## Executando com Docker Compose

1. Clone o repositório
2. Execute:
```bash
docker-compose up --build
```
3. Acesse:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## Executando com Kubernetes

### Pré-requisitos
- Kubernetes cluster (ou Docker Desktop com Kubernetes)
- kubectl configurado

### Implantação

1. Construa as imagens:
```bash
docker-compose build
```

2. Aplique as configurações:
```bash
kubectl apply -f k8s/
```

3. Verifique o status:
```bash
kubectl get pods
```

4. Acesse:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

### Arquivos Kubernetes

- `backend-deployment.yaml`: Deployment do backend
- `backend-service.yaml`: Serviço do backend
- `backend-config.yaml`: Configurações do backend
- `frontend-deployment.yaml`: Deployment do frontend
- `frontend-service.yaml`: Serviço do frontend
- `frontend-config.yaml`: Configurações do frontend
- `postgres-deployment.yaml`: StatefulSet do PostgreSQL
- `postgres-service.yaml`: Serviço do PostgreSQL
- `redis-statefulset.yaml`: StatefulSet do Redis
- `redis-service.yaml`: Serviço do Redis
- `db-init-job.yaml`: Job para inicialização do banco

## Funcionalidades

- Registro e autenticação de usuários
- Envio de mensagens em tempo real
- Cache de mensagens com Redis
- Persistência de mensagens
- Interface responsiva com Next.js

## Variáveis de Ambiente

### Backend
- `NODE_ENV`: Ambiente de execução
- `PORT`: Porta do servidor (padrão: 8000)
- `DATABASE_URL`: URL do PostgreSQL
- `REDIS_URL`: URL do Redis
- `JWT_SECRET`: Chave secreta para tokens JWT

### Frontend
- `NEXT_PUBLIC_API_URL`: URL da API do backend
- `NEXT_PUBLIC_WS_URL`: URL do WebSocket do backend

## Desenvolvimento

1. Clone o repositório
2. Instale as dependências:
```bash
cd backend && npm install
cd ../frontend && npm install
```
3. Configure as variáveis de ambiente
4. Execute em modo desenvolvimento:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```
5. Rodar Redis:
```bash
 docker run -p 6379:6379 -it redis/redis-stack-server:latest
```
