variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "alphaask"
}

variable "bedrock_model_id" {
  description = "AWS Bedrock model ID for AI responses"
  type        = string
  default     = "anthropic.claude-3-5-sonnet-20240620-v1:0"
}

variable "jwt_secret_key" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true
  default     = "super-secret-jwt-key-alphaask-2026-production"
}
