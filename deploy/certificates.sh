#!/bin/bash
# CA key and certificate
openssl req -new -x509 -sha256 -nodes -newkey rsa:4096 -subj '/CN=ImageGate Webhook' -keyout ca.key -out ca.crt

# server certificate
openssl genrsa -out server.key 4096
openssl req -new -key server.key -subj '/CN=imagegate-webhook.imagegate.svc' -out server.csr
openssl x509 -req -in server.csr -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial \
  -extfile <(printf "subjectAltName=DNS:imagegate,DNS:imagegate-webhook.imagegate.svc") -out server.crt 

# update ca bundle in webhook
export CA_BUNDLE=$(cat ca.crt | base64 | tr -d '\n')
sed 's/caBundle:.*$/caBundle: '"$CA_BUNDLE"'/' webhook.yaml > webhook_new.yaml && mv webhook_new.yaml webhook.yaml

# update secret
kubectl create secret generic imagegate-webhook-certificates \
  -n imagegate \
  --from-file=ca.crt=ca.crt \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key \
  -o yaml --dry-run=client > secret.yaml

