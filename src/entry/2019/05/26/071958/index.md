# Kubernetes で cert-manager する話
<a id="top"></a>

- 2019-09-14 追記 : cert-manager version 0.10.0 の書き方をまとめた

Kubernetes クラスタにデプロイした api サーバーと https で通信したい。

このための証明書を、[cert-manager](https://github.com/jetstack/cert-manager) を使用して取得する。

###### CONTENTS

1. [出来上がったもの](#outcome)
1. [cert-manager のインストール](#install-cert-manager)
1. [AWS Route53 設定用ユーザーの追加](#add-aws-user)
1. [DNS validation の設定](#dns-validation)
1. [Certificate の設定](#setup-certificate)
1. [Ingress の設定](#setup-ingress)
1. [ドメインを追加する手順](#add-domain)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- cert-manager : 0.8.0
- GKE : 1.12.7-gke.10


<a id="outcome"></a>
### 出来上がったもの

- Kubernetes クラスタは GKE を使用してデプロイ
- api サーバーのドメインは AWS Route53 で管理
- 証明書は [cert-manager](https://github.com/jetstack/cert-manager) を使用して取得
- Issuer は [Let's Encrypt](https://letsencrypt.org/) で DNS validation
- api サーバーは Ingress リソースでサービス


[TOP](#top)
<a id="install-cert-manager"></a>
### cert-manager のインストール

[ドキュメント](https://docs.cert-manager.io/en/latest/getting-started/install/kubernetes.html)にしたがって、cert-manager をインストールする。

```bash
kubectl create namespace cert-manager
kubectl label namespace cert-manager certmanager.k8s.io/disable-validation=true
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v0.8.0/cert-manager.yaml
```

それぞれ何をしているかの詳細はドキュメントを参照。

これで `cert-manager` という名前空間に cert-manager がデプロイされる。


[TOP](#top)
<a id="add-aws-user"></a>
### AWS Route53 設定用ユーザーの追加

DNS validation を使用して証明書を発行する。
このために、 AWS で以下のポリシーをもつユーザーを作成する。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "route53:GetChange",
            "Resource": "arn:aws:route53:::change/*"
        },
        {
            "Effect": "Allow",
            "Action": "route53:ChangeResourceRecordSets",
            "Resource": "arn:aws:route53:::hostedzone/*"
        },
        {
            "Effect": "Allow",
            "Action": "route53:ListHostedZonesByName",
            "Resource": "*"
        }
    ]
}
```

hosted zone id の設定を細かくやれば、もっと制限したポリシーでも OK、と[ドキュメント](https://docs.cert-manager.io/en/latest/tasks/issuers/setup-acme/dns01/route53.html)に書いてある。

access key id と secret access key は secret に詰め込んでおく。

```bash
echo -n $ACCESS_KEY_ID > access-key-id
echo -n $SECRET_ACCESS_KEY > secret-access-key
kubectl create secret generic \
  cert-manager-route53-credentials-secret \
  --namespace=cert-manager \
  --from-file=access-key-id \
  --from-file=secret-access-key
```

名前空間は `cert-manager` にする。
access key id と secret access key は history に残らないように工夫したい。


[TOP](#top)
<a id="dns-validation"></a>
### DNS validation の設定

DNS validation を使用して証明書を取得するように Issuer を設定する。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
  namespace: cert-manager
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: 'admin@example.com' # 通知を受け取るメールアドレスにする
    privateKeySecretRef:
      name: letsencrypt-prod
    dns01:
      providers:
      - name: route53
        route53:
          region: eu-west-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: cert-manager-route53-credentials-secret
            key: secret-access-key
```

- 2019-09-10 追記 : accessKeyIDSecretRef ではなく、accessKeyID を直接書かないと読み取ってくれない（設定できた気がするんだけど）

DNS validation を使用するので、`http01` の項目は必要ない。
（両方設定するやり方もあるようだが調べていない）

### kind について

kind は ClusterIssuer にしている。
ClusterIssuer は Issuer とほぼ同じだが、名前空間をまたいで参照可能になるもの。

cert-manager は `cert-manager` 名前空間にデプロイするが、Certificate リソースは Ingress リソースと同じ名前空間に置きたい。（この記事では `default`）

これは、Certificate リソースが作成する tls secret を Ingress リソースから参照したいため。

Issuer は `cert-manager` に定義するので、`default` からは参照できないが、ClusterIssuer にすることで名前空間をまたいで参照可能にしている。

#### 別な方法として

`cert-manager` 名前空間に Certificate リソースを置いて、出来上がった secret を必要な名前空間にコピーする、という方法もある。
Certificate リソースは secret を自動作成するので、名前空間を分けておきたいという気持ちがある。

Certificate リソースを `cert-manager` 名前空間に作成するのか、それとも Ingress リソースと同じ名前空間に作成するのかは運用ルールに沿ったやり方で決めれば良い。

### staging の Issuer

Let's Encrypt は証明書の発行数に制限があるので、staging 用の Issuer も用意しておくと良い。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
  namespace: cert-manager
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: 'admin@example.com' # 通知を受け取るメールアドレスにする
    privateKeySecretRef:
      name: letsencrypt-staging
    dns01:
      providers:
      - name: route53
        route53:
          region: eu-west-1
          accessKeyID: <ACCESS-KEY-ID>
          secretAccessKeySecretRef:
            name: cert-manager-route53-credentials-secret
            key: secret-access-key
```

- 2019-09-10 追記 : accessKeyIDSecretRef ではなく、accessKeyID を直接書かないと読み取ってくれない

staging なら発行数の制限はない。


[TOP](#top)
<a id="setup-certificate"></a>
### Certificate の設定

Issuer リソースの作成が終わったら、Certificate リソースを作成できる。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-example-api
spec:
  secretName: tls-example-api
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: api.example.com
  acme:
    config:
    - dns01:
        provider: route53
      domains:
      - api.example.com
```

`commonName` と `domains` に証明書を取得するドメインを指定する。

`issuerRef` には先に作成した Issuer の名前を指定する。
kind に ClusterIssuer を指定することで名前空間をまたいだ参照が可能になる。

`acme.config` には `dns01` を指定する。
`provider` には先に作成した Issuer の `providers` で指定した名前を指定する。

証明書の取得状況は `kubectl describe` で確認できる。
（以下はドキュメントからの引用）

```bash
$ kubectl describe -f certificate.yaml
Events:
  Type    Reason          Age      From          Message
  ----    ------          ----     ----          -------
  Normal  CreateOrder     57m      cert-manager  Created new ACME order, attempting validation...
  Normal  DomainVerified  55m      cert-manager  Domain "api.example.com" verified with "dns-01" validation
  Normal  IssueCert       55m      cert-manager  Issuing certificate...
  Normal  CertObtained    55m      cert-manager  Obtained certificate from ACME server
  Normal  CertIssued      55m      cert-manager  Certificate issued successfully
```

`Certificate issued successfully` というメッセージが出ていれば成功。
tls を格納した secret ができているはず。

#### 複数のドメインの証明書を取得したいときは

それぞれ個別に Certificate リソースを作成する。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-example-api1
spec:
  secretName: tls-example-api1
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: api1.example.com
  acme:
    config:
    - dns01:
        provider: route53
      domains:
      - api1.example.com
---
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-example-api2
spec:
  secretName: tls-example-api2
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: api2.example.com
  acme:
    config:
    - dns01:
        provider: route53
      domains:
      - api2.example.com
```

ファイルを分けても良いし、上記のように `---` で繋げても良い。

#### ワイルドカード証明書にしたいときは

ドメインにワイルドカードを指定する。

```yaml
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: certificate-example
spec:
  secretName: tls-example
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: "*.example.com"
  acme:
    config:
    - dns01:
        provider: route53
      domains:
      - "*.example.com"
```

アスタリスクは yaml の特殊文字なので、クオートする必要がある。

ただ、`api.service.example.com` は `*.example.com` の証明書ではダメだった。
（そらそうよ案件だな）

なので、ワイルドカードでの運用はしていない。

DNS validation にしたのはワイルドカード証明書を使いたかったから、なのでこの時点で必要性を失ってしまったのだが。

今の目的は、Ingress の設定で `nginx.ingress.kubernetes.io/ssl-redirect: "false"` しなくてよくなる、というもの。
（言い訳的だが）


[TOP](#top)
<a id="setup-ingress"></a>
### Ingress の設定

Certificate リソースによって、 tls secret が作成されたら Ingress リソースで参照できるようになる。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: example-ingress
  annotations: # この他にも色々と設定が必要
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - backend:
          serviceName: example-api
          servicePort: 8080
  tls:
  - secretName: tls-example-api
    hosts:
    - api.example.com
```

（annotations については Ingress リソースの設定になるので割愛）

サービスするホストと、それに対応する tls の設定を書いていく。


[TOP](#top)
<a id="add-domain"></a>
### ドメインを追加する手順

サービスするドメインを増やす手順は以下の通り。

1. Certificate リソースを追加
1. Ingress リソースの host と、対応する tls を追加


[TOP](#top)
<a id="postscript"></a>
### まとめ

Kubernetes にデプロイした api サーバーと https 通信するための証明書を cert-manager で取得する方法をまとめた。

最初はよくわかっていなかったので 1つの secret に全てのホストの証明書をまとめて入れるような形だった。
Kubernetes の設定方法を見直してみたら、 1つの secret に 1つのホストの証明書で、何も問題なかった。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [jetstack/cert-manager | GitHub](https://github.com/jetstack/cert-manager)
- [Issuing an ACME certificate using DNS validation | Docs cert-manager](https://docs.cert-manager.io/en/latest/tutorials/acme/dns-validation.html)
- Kubernetes 完全ガイド（書籍）


[TOP](#top)
