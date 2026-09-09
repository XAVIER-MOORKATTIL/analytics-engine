provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "analytics_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "Analytics-Engine-VPC" }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.analytics_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public_subnet.id

  tags = {
    Name = "Analytics-Engine-Node"
  }
}