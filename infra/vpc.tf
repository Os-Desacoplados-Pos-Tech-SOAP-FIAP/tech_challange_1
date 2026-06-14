data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # 3 AZs para alta disponibilidade do EKS e do RDS.
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr
  azs  = local.azs

  # Uma subnet pública e uma privada por AZ (6 subnets no total).
  private_subnets = [for k in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, k)]
  public_subnets  = [for k in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, k + 8)]

  # NAT gateway único: econômico para ambiente de estudo/sandbox.
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags exigidas pela descoberta de subnets do EKS / AWS Load Balancer Controller.
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
