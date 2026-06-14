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

variable "db_name" {
  description = "Nome do banco de dados inicial criado no RDS."
  type        = string
  default     = "oficina"
}

variable "db_username" {
  description = "Usuário master do RDS."
  type        = string
  default     = "oficina"
}

variable "db_password" {
  description = "Senha master do RDS. Forneça via TF_VAR_db_password ou tfvars (nunca versionar)."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Classe da instância RDS."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Armazenamento alocado (GB) para o RDS."
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "Versão do PostgreSQL no RDS."
  type        = string
  default     = "16"
}
