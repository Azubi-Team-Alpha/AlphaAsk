# Serverless AWS Lambda Function from ECR Container Image

resource "aws_lambda_function" "backend" {
  function_name = "${var.app_name}-backend"
  role          = aws_iam_role.lambda_exec.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:latest"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      USERS_TABLE      = aws_dynamodb_table.users.name
      SESSIONS_TABLE   = aws_dynamodb_table.sessions.name
      MESSAGES_TABLE   = aws_dynamodb_table.messages.name
      FAQ_TABLE        = aws_dynamodb_table.faq.name
      JWT_SECRET_KEY   = var.jwt_secret_key
      BEDROCK_MODEL_ID = var.bedrock_model_id
      REDIS_URL        = "redis://${aws_elasticache_cluster.redis.cache_nodes.0.address}:6379"
      GEMINI_API_KEY   = var.gemini_api_key
      GROQ_API_KEY     = var.groq_api_key
    }
  }

  tags = {
    Name = "${var.app_name}-lambda"
  }
}

# Amazon API Gateway (HTTP API v2)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://alphaask.alphateam.live", "http://alphaask.alphateam.live", "*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "any_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "apigw_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
