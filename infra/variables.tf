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

variable "cluster_version" {
  description = "Versão do Kubernetes do cluster EKS."
  type        = string
  default     = "1.30"
}

variable "vpc_cidr" {
  description = "Bloco CIDR da VPC dedicada."
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_endpoint_public_access" {
  description = "Expõe o endpoint do API Server do EKS na internet. Em produção, restrinja via cluster_endpoint_public_access_cidrs ou prefira endpoint privado."
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDRs autorizados a acessar o endpoint público do API Server. Restrinja em produção (ex.: IPs da VPN/CI)."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_cluster_creator_admin_permissions" {
  description = "Concede admin do cluster ao principal que aplica o Terraform. Conveniente em DEV; desabilite em contas/ambientes compartilhados."
  type        = bool
  default     = true
}
