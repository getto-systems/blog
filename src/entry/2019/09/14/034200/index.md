# Kubernetes で cert-manager する話ふたたび
<a id="top"></a>

[以前](/entry/2019/05/26/071958)の記事から書き方がちょっと変更されたのでまとめる。


###### CONTENTS

1. [出来上がったもの](#outcome)
1. [Issuer の登録](#apply-issuer)
1. [Certificate の登録](#apply-certificate)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- cert-manager : 0.10.0


<a id="outcome"></a>
### 出来上がったもの

#### letsencrypt-issuer.yaml

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Issuer
metadata:
  name: letsencrypt-staging
  namespace: cert-manager
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: 'admin@example.com'
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - dns01:
        route53:
          region: us-east-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: route53-credentials
            key: secret-access-key
---
apiVersion: certmanager.k8s.io/v1alpha1
kind: Issuer
metadata:
  name: letsencrypt-prod
  namespace: cert-manager
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: 'admin@example.com'
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        route53:
          region: us-east-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: route53-credentials
            key: secret-access-key
```

以下の箇所を書き換える必要がある。

- email : 通知を受け取るメールアドレス
- accessKeyID : AWS Route53 にアクセスする access key id
- secretAccessKeySecretRef.name : secret access key の入った secret の名前


#### certificate.yaml

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-DOMAIN_NAME
spec:
  secretName: tls-DOMAIN_NAME
  issuerRef:
    name: letsencrypt-prod
    kind: Issuer
  commonName: "*.DOMAIN.example.com"
```

以下の箇所を書き換える必要がある。

- name : Certificate リソースの名前
- secretName : 作成する secret の名前
- commonName : 証明書を取得するドメイン名


[TOP](#top)
<a id="apply-issuer"></a>
### Issuer の登録

登録する Issuer のテンプレートは以下の通り。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Issuer
metadata:
  name: letsencrypt-staging
  namespace: cert-manager
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: 'admin@example.com'
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - dns01:
        route53:
          region: us-east-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: route53-credentials
            key: secret-access-key
```

以下の箇所を書き換える必要がある。

- email : 通知を受け取るメールアドレス
- accessKeyID : AWS Route53 にアクセスする access key id
- secretAccessKeySecretRef.name : secret access key の入った secret の名前

access key id は secret から読み込んでくれなかった。
前やったときは試行錯誤中のリソースに情報が残っていて、読み込めたように見えたのだろう。

region は何に使っているのかわからない。
とりあえず何を指定しても良さそう。

solvers には、証明書の取得に使用する solver を列挙する。

```yaml
    solvers:
    - selector:
        dnsZones:
          - "example.com"
      dns01:
        route53:
          region: us-east-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: route53-credentials
            key: secret-access-key
```

solver が複数ある場合、`selector` によってどの solver を使用するか指定できる。

ClusterIssuer を作成する場合は kind に Issuer ではなく、ClusterIssuer を指定すれば良い。

production の server は `https://acme-v02.api.letsencrypt.org/directory` を指定する。


[TOP](#top)
<a id="apply-certificate"></a>
### Certificate の登録

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-DOMAIN_NAME
spec:
  secretName: tls-DOMAIN_NAME
  issuerRef:
    name: letsencrypt-staging
    kind: Issuer
  commonName: "*.DOMAIN.example.com"
```

以下の箇所を書き換える必要がある。

- name : Certificate リソースの名前。ドメイン名からつけるのが良さそう
- secretName : 作成する secret の名前。ingress リソースなどから参照される
- commonName : 証明書を取得するドメイン名

`commonName` に `*.DOMAIN.example.com` を指定すると、ワイルドカード証明書を取得できる。

Issuer の設定で solver が適切に設定されていないと、Certificate リソースを作成してもイベントが登録されず、証明書発行の処理が進まないので注意。

staging で適切に証明書が発行されたことを確認したら production に切り替える。


[TOP](#top)
<a id="postscript"></a>
### まとめ

複数の issuer をうまく記述できるようになった。
それに伴って、Certificate リソースの記述が簡単に書けるようになった。

ただ、cert-manager のアップデートごとに設定の仕方が変わるので、Let's Encrypt の更新周期よりも短い間隔で cert-manager の調整をしている気がする。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Amazon Route53 : cert-manager docs](https://docs.cert-manager.io/en/latest/tasks/issuers/setup-acme/dns01/route53.html)


[TOP](#top)
