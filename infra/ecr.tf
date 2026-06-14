# Repositório de imagens Docker construídas no CI/CD (DEV-65). O nome deriva de
# var.cluster_name (default => "oficina-mecanica-api"), evitando colisão em contas
# compartilhadas e mantendo o mesmo nome usado pelo Kustomize/CD.
resource "aws_ecr_repository" "api" {
  name                 = "${var.cluster_name}-api"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }

  # Ambiente de estudo: permite destroy mesmo com imagens no repositório.
  force_delete = true
}
