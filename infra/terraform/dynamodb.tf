# Amazon DynamoDB Tables for Serverless Storage

resource "aws_dynamodb_table" "users" {
  name         = "${var.app_name}-Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.app_name}-users-table"
  }
}

resource "aws_dynamodb_table" "sessions" {
  name         = "${var.app_name}-Sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "UserSessionsIndex"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.app_name}-sessions-table"
  }
}

resource "aws_dynamodb_table" "messages" {
  name         = "${var.app_name}-Messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "message_id"

  attribute {
    name = "message_id"
    type = "S"
  }

  attribute {
    name = "session_id"
    type = "S"
  }

  global_secondary_index {
    name            = "SessionMessagesIndex"
    hash_key        = "session_id"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.app_name}-messages-table"
  }
}

resource "aws_dynamodb_table" "questions" {
  name         = "${var.app_name}-Questions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-questions-table"
  }
}

resource "aws_dynamodb_table" "faq" {
  name         = "${var.app_name}-FAQ"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-faq-table"
  }
}
