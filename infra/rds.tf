# Banco gerenciado externo ao cluster (decisão arquitetural). Postgres 16 para
# parear com a versão usada localmente.

resource "aws_db_subnet_group" "this" {
  name       = "${var.cluster_name}-db"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name        = "${var.cluster_name}-rds"
  description = "Permite acesso ao Postgres apenas a partir dos nos do EKS"
  vpc_id      = module.vpc.vpc_id
}

# Ingress 5432 liberado SOMENTE para o security group dos nós do EKS.
resource "aws_vpc_security_group_ingress_rule" "rds_from_eks" {
  security_group_id            = aws_security_group.rds.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = module.eks.node_security_group_id
  description                  = "Postgres 5432 a partir do SG dos nos EKS"
}

resource "aws_db_instance" "this" {
  identifier     = "${var.cluster_name}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false
  publicly_accessible = false

  # Ambiente de estudo: descarta snapshot final ao destruir.
  skip_final_snapshot = true
}
