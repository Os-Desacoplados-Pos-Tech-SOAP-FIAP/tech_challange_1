module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Endpoint público para acesso via kubectl/CI (kubeconfig). Configurável e
  # restringível por CIDR — em produção, limite a IPs da VPN/CI ou use privado.
  cluster_endpoint_public_access       = var.cluster_endpoint_public_access
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # IRSA (OIDC provider) é necessário para o AWS Load Balancer Controller e o
  # External Secrets Operator assumirem roles IAM via service accounts.
  enable_irsa = true

  # Acesso admin ao cluster para o principal que aplica o Terraform (configurável).
  enable_cluster_creator_admin_permissions = var.enable_cluster_creator_admin_permissions

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      instance_types = ["t3.medium"]
      desired_size   = 2
      min_size       = 2
      max_size       = 5
    }
  }
}

# Providers kubernetes/helm autenticados no cluster recém-criado. O exec plugin
# usa `aws eks get-token`, evitando tokens estáticos que expiram.
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--region", var.aws_region]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--region", var.aws_region]
    }
  }
}
