output "cluster_name" {
  description = "Nome do cluster EKS."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint do API Server do EKS."
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "Endpoint (host:porta) da instância RDS Postgres."
  value       = aws_db_instance.this.endpoint
}

output "ecr_repository_url" {
  description = "URL do repositório ECR da API (usada pelo CD)."
  value       = aws_ecr_repository.api.repository_url
}

output "kubeconfig_command" {
  description = "Comando pronto para configurar o kubeconfig local."
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

output "database_url_secret_name" {
  description = "Nome do secret DATABASE_URL no AWS Secrets Manager (consumido pelo External Secrets Operator)."
  value       = aws_secretsmanager_secret.database_url.name
}

output "jwt_secret_name" {
  description = "Nome do secret JWT_SECRET no AWS Secrets Manager (consumido pelo External Secrets Operator)."
  value       = aws_secretsmanager_secret.jwt_secret.name
}
