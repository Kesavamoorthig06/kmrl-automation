import boto3

ec2 = boto3.client("ec2")
data = ec2.describe_instances()
print(f"{'Instance ID':<22} {'State':<12} {'Public IP':<18} {'Type':<14} {'Key':<16} {'Name'}")
print("-" * 100)
for r in data["Reservations"]:
    for i in r["Instances"]:
        name = "unnamed"
        for t in i.get("Tags", []):
            if t["Key"] == "Name":
                name = t["Value"]
        print(f"{i['InstanceId']:<22} {i['State']['Name']:<12} {i.get('PublicIpAddress', 'N/A'):<18} {i['InstanceType']:<14} {i.get('KeyName', 'N/A'):<16} {name}")
