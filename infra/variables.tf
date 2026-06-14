variable "aws_region" {
  description = "Região AWS onde a stack é provisionada."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente lógico (usado em tags e nomes)."
  type        = string
  default     = "prod"
}

variable "cluster_name" {
  description = "Nome do cluster EKS e prefixo dos recursos relacionados."
  type        = string
  default     = "oficina-mecanica"
}

variable "vpc_cidr" {
  description = "Bloco CIDR da VPC dedicada."
  type        = string
  default     = "10.0.0.0/16"
}
