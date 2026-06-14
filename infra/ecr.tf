# Repositório de imagens Docker construídas no CI/CD (DEV-65).
resource "aws_ecr_repository" "api" {
  name                 = "oficina-mecanica-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  # Ambiente de estudo: permite destroy mesmo com imagens no repositório.
  force_delete = true
}
