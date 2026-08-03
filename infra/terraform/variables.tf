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
  default     = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
}

variable "jwt_secret_key" {
  description = "Secret key for JWT token signing — must be at least 32 chars. Can be overridden via TF_VAR_jwt_secret_key or GitHub secrets."
  type        = string
  sensitive   = true
  default     = "alphaask-super-secret-jwt-key-2026-production"
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN distribution (requires AWS account verification)"
  type        = bool
  default     = false
}

variable "gemini_api_key" {
  description = "Google Gemini API key for fallback LLM responses"
  type        = string
  sensitive   = true
  default     = ""
}

variable "groq_api_key" {
  description = "Groq Cloud API key for fallback LLM responses"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openrouter_api_key" {
  description = "OpenRouter API key providing access to 400+ LLM models"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name matching Cloudflare CNAME and S3 static website bucket name"
  type        = string
  default     = "alphaask.alphateam.live"
}

variable "use_custom_domain_bucket" {
  description = "Set to true to name S3 bucket exactly as the custom domain name for direct Cloudflare CNAME routing (Option 2)"
  type        = bool
  default     = true
}

variable "enable_vpc_lambda" {
  description = "Attach Lambda to VPC (disabled by default so Lambda has direct internet/AWS service access without needing NAT Gateway)"
  type        = bool
  default     = false
}
