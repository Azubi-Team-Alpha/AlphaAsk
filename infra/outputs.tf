output "api_gateway_url" {
  description = "URL of the Amazon API Gateway HTTP endpoint"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for backend container image"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_s3_bucket" {
  description = "Name of the S3 bucket storing frontend build assets"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name for the frontend application"
  value       = aws_cloudfront_distribution.frontend_cdn.domain_name
}

output "dynamodb_users_table" {
  description = "Name of the DynamoDB Users table"
  value       = aws_dynamodb_table.users.name
}

output "elasticache_redis_endpoint" {
  description = "Primary endpoint address for AWS ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes.0.address
}
