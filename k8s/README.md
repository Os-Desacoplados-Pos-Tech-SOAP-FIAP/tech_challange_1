# Kubernetes (Kustomize)

Manifestos para deploy da API em Kubernetes (alvo: AWS EKS), organizados em base + overlays por ambiente.

```
k8s/
├── base/                 # recursos comuns a todos os ambientes
│   ├── namespace.yaml    # namespace oficina-mecanica
│   ├── configmap.yaml    # config não-sensível (NODE_ENV, PORT, JWT_EXPIRES_IN, LOG_LEVEL)
│   ├── secret.yaml       # TEMPLATE de DATABASE_URL e JWT_SECRET (placeholders)
│   └── kustomization.yaml
└── overlays/
    ├── dev/              # NODE_ENV=development, LOG_LEVEL=debug
    └── prod/             # defaults da base; imagem e segredos injetados pelo CI/CD
```

> O `base/` ainda não inclui Deployment/Service/Ingress/HPA — eles entram nas issues
> DEV-55..DEV-57 e serão adicionados ao `base/kustomization.yaml`.

## Validar

```bash
# Renderiza o resultado final do overlay (não exige cluster):
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/prod

# Validação client-side:
kubectl apply -k k8s/overlays/dev  --dry-run=client
kubectl apply -k k8s/overlays/prod --dry-run=client
```

## Aplicar

```bash
kubectl apply -k k8s/overlays/dev    # ou overlays/prod no EKS
```

## Segredos em produção

`base/secret.yaml` é apenas um **template** com placeholders — não contém valores reais.
Em produção os segredos vêm do **AWS Secrets Manager**, sincronizados para o cluster pelo
**External Secrets Operator** (ver DEV-62), substituindo este template.
