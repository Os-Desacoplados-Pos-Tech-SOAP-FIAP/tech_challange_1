# Credenciais expostas ao cluster via External Secrets Operator (DEV-62/DEV-54).
# O ESO sincroniza estes secrets do AWS Secrets Manager para um Secret do K8s.

# JWT_SECRET gerado aleatoriamente (não precisa ser conhecido por humanos).
resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.cluster_name}/JWT_SECRET"
  # Ambiente de estudo: remoção imediata (sem janela de recuperação).
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# DATABASE_URL montada a partir do endpoint do RDS + credenciais. Formato Prisma.
locals {
  database_url = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${var.db_name}?schema=public"
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.cluster_name}/DATABASE_URL"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = local.database_url
}
