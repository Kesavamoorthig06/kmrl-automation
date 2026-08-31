#!/bin/bash
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
echo "IAM Role:"
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null || echo "NO_IAM_ROLE"
echo ""
echo "--- Checking if port 8300 reachable from outside ---"
# Try to add port 8300 inbound rule using iptables check
sudo iptables -L INPUT -n 2>/dev/null | head -10
echo "---"
echo "Firewalld:"
sudo firewall-cmd --list-all 2>/dev/null || echo "no firewalld"
