# Amazon ElastiCache for Redis (AWS Managed Cache & Rate Limiting)

resource "aws_security_group" "elasticache_sg" {
  name        = "${var.app_name}-elasticache-sg"
  description = "Security group for AlphaAsk AWS ElastiCache Redis Cluster"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
    description     = "Allow Redis access from Lambda only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-elasticache-sg"
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.app_name}-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.elasticache_sg.id]

  tags = {
    Name = "${var.app_name}-redis-cluster"
  }
}
