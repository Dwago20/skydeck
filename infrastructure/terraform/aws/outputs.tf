output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "app_public_ip" {
  description = "Public IP of the application instance"
  value       = aws_eip.app.public_ip
}

output "app_instance_id" {
  description = "Instance ID of the application server"
  value       = aws_instance.app.id
}

output "s3_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = aws_s3_bucket.data.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 data bucket"
  value       = aws_s3_bucket.data.arn
}

output "web_security_group_id" {
  description = "Security group ID for web traffic"
  value       = aws_security_group.web.id
}
