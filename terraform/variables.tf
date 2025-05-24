variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "app_name" {
  description = "アプリケーション名"
  type        = string
  default     = "line-miniapp-sample"
}

variable "environment" {
  description = "環境（dev/stg/prod）"
  type        = string
  default     = "dev"
} 