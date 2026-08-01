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

output "frontend_s3_website_url" {
  description = "S3 Static Website URL for the frontend application"
  value       = "http://${aws_s3_bucket_website_configuration.frontend_website.website_endpoint}"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name for the frontend application"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend_cdn[0].domain_name : "CloudFront Disabled (Use S3 Website URL)"
}

output "dynamodb_users_table" {
  description = "Name of the DynamoDB Users table"
  value       = aws_dynamodb_table.users.name
}

output "elasticache_redis_endpoint" {
  description = "Primary endpoint address for AWS ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes.0.address
}

output "cloudflare_cname_target" {
  description = "Target hostname to paste into your Cloudflare CNAME record for custom domain"
  value       = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}
