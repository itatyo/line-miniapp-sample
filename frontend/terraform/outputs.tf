output "cloudfront_domain_name" {
  description = "CloudFrontのドメイン名"
  value       = aws_cloudfront_distribution.app.domain_name
}

output "s3_bucket_name" {
  description = "S3バケット名"
  value       = aws_s3_bucket.app.bucket
} 